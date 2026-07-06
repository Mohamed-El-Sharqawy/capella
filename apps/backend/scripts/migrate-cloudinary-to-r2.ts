/**
 * One-off migration: Cloudinary -> Cloudflare R2.
 *
 * Three phases:
 *   1. Copy every Cloudinary asset (images AND videos) into the R2 bucket,
 *      preserving the key shape (`ecommerce/<folder>/<file>`). Idempotent via
 *      HeadObject — safe to re-run.
 *   2. Prune R2 orphans (objects under the prefix that no longer exist in
 *      Cloudinary). OPT-IN: requires `--prune`. Prints orphans by default.
 *   3. Rewrite the DB: swap the Cloudinary host for the R2 host on every URL
 *      column, and rewrite every `publicId` column to be the R2 key (Cloudinary
 *      stored public_ids WITHOUT an extension; R2 keys need one).
 *
 * Usage (from repo root):
 *   pnpm migrate:storage                     # run phase 1 then phase 3
 *   pnpm migrate:storage -- --phase=1        # only copy files
 *   pnpm migrate:storage -- --phase=2        # list orphans (dry-run)
 *   pnpm migrate:storage -- --phase=2 --prune # actually delete orphans
 *   pnpm migrate:storage -- --phase=3        # only rewrite DB
 *   pnpm migrate:storage -- --dry-run        # phases 2/3 print without writing
 *   pnpm migrate:storage -- --limit=20       # cap items (testing)
 *
 * NOTE: take a `pg_dump` of the database before running phase 3. Phase 3 is
 * idempotent (guarded WHERE clauses), but a backup is still strongly advised.
 */
import "dotenv/config";
import {
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME, R2_PUBLIC_BASE, KEY_PREFIX } from "../src/lib/storage";
import { prisma } from "../src/lib/prisma";

// ─── ANSI colors (matches src/lib/logger.ts style) ───────────────────────────
const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};
const log = (msg: string) => console.log(msg);
const ts = () => new Date().toISOString().replace("T", " ").substring(0, 19);

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : undefined;
};
const phase = getArg("phase"); // "1" | "2" | "3" | undefined (= run 1 + 3)
const dryRun = args.includes("--dry-run");
const prune = args.includes("--prune");
const limit = getArg("limit") ? Number(getArg("limit")) : undefined;

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
}

/** Strip the Cloudinary URL prefix so the remainder is the R2 key.
 *  `https://res.cloudinary.com/<cloud>/image/upload/v123/ecommerce/x/foo.jpg`
 *  -> `ecommerce/x/foo.jpg` */
function cloudinaryUrlToKey(url: string): string {
  return url.replace(
    /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(v\d+\/)?/,
    ""
  );
}

function mimeFromResource(r: CloudinaryResource): string {
  if (r.resource_type === "image") {
    switch (r.format) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      case "svg":
        return "image/svg+xml";
      default:
        return `image/${r.format}`;
    }
  }
  if (r.resource_type === "video") {
    switch (r.format) {
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mov":
        return "video/quicktime";
      default:
        return `video/${r.format}`;
    }
  }
  return "application/octet-stream";
}

/** Paginate Cloudinary's Admin API for both images and videos under the
 *  `ecommerce/` prefix. Cloudinary namespaces videos separately from images,
 *  so we must list both resource types or videos are skipped entirely. */
async function listAllCloudinaryResources(): Promise<CloudinaryResource[]> {
  const { cloudinary } = await import("../src/lib/cloudinary");
  const out: CloudinaryResource[] = [];

  for (const resourceType of ["image", "video"] as const) {
    let nextCursor: string | undefined;
    let page = 0;
    do {
      const resp: any = await cloudinary.api.resources({
        type: "upload",
        resource_type: resourceType,
        prefix: `${KEY_PREFIX}/`,
        max_results: 500,
        next_cursor: nextCursor,
      });
      page++;
      log(
        `${c.dim}[${ts()}]${c.reset} ${c.cyan}cloudinary${c.reset} listed ` +
          `${resp.resources?.length ?? 0} ${resourceType}(s) (page ${page})`
      );
      for (const r of resp.resources ?? []) {
        out.push({
          public_id: r.public_id,
          secure_url: r.secure_url,
          format: r.format,
          resource_type: r.resource_type ?? resourceType,
        });
      }
      nextCursor = resp.next_cursor;
    } while (nextCursor);
  }
  return out;
}

// ─── Phase 1: copy files from Cloudinary to R2 ──────────────────────────────
async function phase1CopyFiles() {
  log(`\n${c.bright}${c.green}▶ Phase 1: copy Cloudinary assets -> R2${c.reset}`);
  const resources = await listAllCloudinaryResources();
  log(`${c.dim}  ${resources.length} resource(s) found in Cloudinary${c.reset}`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  const total = limit ? Math.min(limit, resources.length) : resources.length;

  for (let i = 0; i < total; i++) {
    const r = resources[i];
    const key = cloudinaryUrlToKey(r.secure_url);
    try {
      // Idempotency: skip if already in R2.
      await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
      skipped++;
      continue;
    } catch {
      // not found -> proceed to copy
    }

    try {
      const dl = await fetch(r.secure_url);
      if (!dl.ok) throw new Error(`fetch ${dl.status}`);
      const buffer = Buffer.from(await dl.arrayBuffer());
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeFromResource(r),
        })
      );
      copied++;
      if (copied % 25 === 0) {
        log(
          `${c.dim}[${ts()}]${c.reset} ${c.green}copied ${copied}${c.reset}` +
            `${c.dim} / ${total} (skipped ${skipped})${c.reset}`
        );
      }
    } catch (err) {
      failed++;
      log(
        `${c.dim}[${ts()}]${c.reset} ${c.red}failed: ${key}${c.reset} ` +
          `${c.dim}${(err as Error).message}${c.reset}`
      );
    }
  }

  log(
    `${c.green}✓ Phase 1 done:${c.reset} copied=${copied}, skipped=${skipped}, failed=${failed}`
  );
}

// ─── Phase 2: prune R2 orphans ──────────────────────────────────────────────
async function phase2PruneOrphans() {
  log(`\n${c.bright}${c.yellow}▶ Phase 2: prune R2 orphans${c.reset}`);

  // Canonical set of keys that SHOULD exist (= what Cloudinary has).
  const resources = await listAllCloudinaryResources();
  const canonical = new Set(resources.map((r) => cloudinaryUrlToKey(r.secure_url)));
  log(`${c.dim}  ${canonical.size} canonical key(s) from Cloudinary${c.reset}`);

  // List everything currently in R2 under the prefix.
  const r2Keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const resp = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: `${KEY_PREFIX}/`,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of resp.Contents ?? []) {
      if (obj.Key) r2Keys.push(obj.Key);
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  log(`${c.dim}  ${r2Keys.length} object(s) in R2 under ${KEY_PREFIX}/${c.reset}`);

  const orphans = r2Keys.filter((k) => !canonical.has(k));
  log(`${c.yellow}  ${orphans.length} orphan(s) detected${c.reset}`);
  if (orphans.length > 0 && orphans.length <= 50) {
    for (const k of orphans) log(`${c.dim}    - ${k}${c.reset}`);
  }

  if (!prune) {
    log(
      `${c.dim}  dry-run: pass --prune to delete orphans (1000 per batch)${c.reset}`
    );
    return;
  }
  if (dryRun) {
    log(`${c.dim}  --dry-run set: skipping actual deletion${c.reset}`);
    return;
  }

  const capped = limit ? orphans.slice(0, limit) : orphans;
  let deleted = 0;
  for (let i = 0; i < capped.length; i += 1000) {
    const batch = capped.slice(i, i + 1000);
    const resp = await r2.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      })
    );
    deleted += resp.Deleted?.length ?? batch.length;
  }
  log(`${c.green}✓ Phase 2 done:${c.reset} deleted ${deleted} orphan(s)`);
}

// ─── Phase 3: rewrite DB URLs and publicIds ─────────────────────────────────
async function phase3RewriteDb() {
  log(`\n${c.bright}${c.cyan}▶ Phase 3: rewrite DB URLs & publicIds${c.reset}`);
  if (dryRun) log(`${c.yellow}  DRY-RUN — no writes will be performed${c.reset}`);

  // Host-swap regex (POSIX). Matches the Cloudinary delivery prefix and
  // optional version segment, e.g.
  //   https://res.cloudinary.com/<cloud>/image/upload/v12345/
  const pattern = "^https://res\\.cloudinary\\.com/[^/]+/(image|video|raw)/upload/(v[0-9]+/)?";
  const replacement = `${R2_PUBLIC_BASE}/`;
  const cloudLike = "https://res.cloudinary.com/%";

  // publicId rewrite: strip the R2 host prefix off the (already rewritten) URL
  // column to derive the R2 key. Run AFTER the URL host-swap.
  const r2Prefix = `${R2_PUBLIC_BASE}/`;
  const r2Like = `${r2Prefix}%`;

  /** URL host-swap statements. [table, column(quoted if camelCase)] */
  const urlSwaps: Array<[string, string]> = [
    ["product_images", "url"],
    ["collection_images", "url"],
    ["collection_videos", "url"],
    ["banners", '"imageUrl"'],
    ["banners", '"mobileImageUrl"'],
    ["promo_banners", '"imageUrl"'],
    ["instagram_posts", '"imageUrl"'],
    ["shoppable_videos", '"videoUrl"'],
    ["shoppable_videos", '"thumbnailUrl"'],
    ["order_items", '"imageUrl"'],
    ["users", "avatar"],
  ];

  /** publicId rewrite statements. [table, publicIdCol, sourceUrlCol] */
  const publicIdSwaps: Array<[string, string, string]> = [
    ["product_images", '"publicId"', "url"],
    ["collection_images", '"publicId"', "url"],
    ["collection_videos", '"publicId"', "url"],
    ["banners", '"publicId"', '"imageUrl"'],
    ["banners", '"mobilePublicId"', '"mobileImageUrl"'],
    ["promo_banners", '"publicId"', '"imageUrl"'],
    ["instagram_posts", '"publicId"', '"imageUrl"'],
    ["shoppable_videos", '"videoPublicId"', '"videoUrl"'],
    ["shoppable_videos", '"thumbnailPublicId"', '"thumbnailUrl"'],
  ];

  const exec = async (sql: string) => {
    if (dryRun) {
      log(`${c.dim}  [dry-run] ${sql.replace(/\s+/g, " ").slice(0, 120)}${c.reset}`);
      return 0;
    }
    // Prisma.raw() keeps the literal identifiers intact; the dynamic values
    // (pattern, replacement, prefix, likes) are inlined here as they are all
    // constants derived from trusted config, not user input.
    const count = await prisma.$executeRawUnsafe(sql);
    return count;
  };

  let totalAffected = 0;

  // 3a — swap Cloudinary host -> R2 host on every URL column.
  log(`${c.cyan}  3a) swapping Cloudinary hosts -> ${R2_PUBLIC_BASE}${c.reset}`);
  for (const [table, col] of urlSwaps) {
    const sql = `UPDATE ${table} SET ${col} = REGEXP_REPLACE(${col}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}') WHERE ${col} LIKE '${cloudLike}';`;
    const n = await exec(sql);
    totalAffected += n;
    log(`    ${table}.${col.replace(/"/g, "")}: ${n} row(s)`);
  }

  // 3b — rewrite publicIds to the R2 key (strip host prefix from the URL col).
  log(`${c.cyan}  3b) rewriting publicIds -> R2 keys${c.reset}`);
  for (const [table, pubCol, urlCol] of publicIdSwaps) {
    const sql = `UPDATE ${table} SET ${pubCol} = SUBSTRING(${urlCol} FROM LENGTH('${r2Prefix}') + 1) WHERE ${urlCol} LIKE '${r2Like}';`;
    const n = await exec(sql);
    totalAffected += n;
    log(`    ${table}.${pubCol.replace(/"/g, "")}: ${n} row(s)`);
  }

  log(`${c.green}✓ Phase 3 done:${c.reset} ${totalAffected} row(s) affected (cumulative)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log(`${c.bright}${c.cyan}╔══ Cloudinary -> R2 migration ══╗${c.reset}`);
  log(`${c.dim}  bucket:    ${R2_BUCKET_NAME || "(unset)"}${c.reset}`);
  log(`${c.dim}  publicUrl: ${R2_PUBLIC_BASE || "(unset)"}${c.reset}`);
  log(`${c.dim}  prefix:    ${KEY_PREFIX}/${c.reset}`);
  log(`${c.dim}  phase:     ${phase ?? "1+3"}  dryRun: ${dryRun}  limit: ${limit ?? "∞"}${c.reset}`);

  if (!R2_BUCKET_NAME || !R2_PUBLIC_BASE) {
    log(`${c.red}R2_BUCKET / R2_PUBLIC_URL not set. Aborting.${c.reset}`);
    process.exit(1);
  }

  try {
    if (phase === "1") {
      await phase1CopyFiles();
    } else if (phase === "2") {
      await phase2PruneOrphans();
    } else if (phase === "3") {
      await phase3RewriteDb();
    } else if (!phase) {
      await phase1CopyFiles();
      await phase3RewriteDb();
    } else {
      log(`${c.red}Unknown --phase=${phase}. Use 1, 2, or 3.${c.reset}`);
      process.exit(1);
    }
    log(`\n${c.bright}${c.green}Migration finished.${c.reset}\n`);
  } catch (err) {
    log(`\n${c.red}${c.bright}Migration failed:${c.reset} ${(err as Error).message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
