/**
 * One-shot migration: Cloudinary -> Cloudflare R2.
 *
 * A SINGLE command runs the whole migration end-to-end:
 *   1. Copy every Cloudinary asset (images AND videos) into the R2 bucket,
 *      preserving the key shape (`ecommerce/<folder>/<file>`).
 *   2. Rewrite every media URL + publicId column in the DB to point at R2
 *      (Cloudinary stored public_ids WITHOUT an extension; R2 keys need one).
 *
 * Usage (from repo root):
 *   pnpm migrate:storage              # run the full migration
 *   pnpm migrate:storage -- --dry-run # preview without writing anything
 *
 * Both steps are idempotent (HeadObject skip + guarded WHERE clauses), so the
 * command is safe to re-run. ⚠️ Still take a `pg_dump` first — step 2 rewrites
 * DB rows.
 */
import "dotenv/config";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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

const dryRun = process.argv.includes("--dry-run");

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

// ─── Step 1: copy files from Cloudinary to R2 ───────────────────────────────
async function copyFilesToR2(resources: CloudinaryResource[]) {
  log(`\n${c.bright}${c.green}▶ Step 1: copy Cloudinary assets -> R2${c.reset}`);
  log(`${c.dim}  ${resources.length} resource(s) to migrate${c.reset}`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of resources) {
    const key = cloudinaryUrlToKey(r.secure_url);
    try {
      // Idempotency: skip if already in R2 (read-only, safe even in dry-run).
      await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
      skipped++;
      continue;
    } catch {
      // not found -> proceed to copy
    }

    if (dryRun) {
      copied++;
      continue;
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
            `${c.dim} (skipped ${skipped}, failed ${failed})${c.reset}`
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
    `${c.green}✓ Step 1 done:${c.reset} copied=${copied}, skipped=${skipped}, failed=${failed}`
  );
}

// ─── Step 2: rewrite DB URLs and publicIds ───────────────────────────────────
async function rewriteDatabaseUrls() {
  log(`\n${c.bright}${c.cyan}▶ Step 2: rewrite DB URLs & publicIds${c.reset}`);
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
    const count = await prisma.$executeRawUnsafe(sql);
    return count;
  };

  let totalAffected = 0;

  // 2a — swap Cloudinary host -> R2 host on every URL column.
  log(`${c.cyan}  2a) swapping Cloudinary hosts -> ${R2_PUBLIC_BASE}${c.reset}`);
  for (const [table, col] of urlSwaps) {
    const sql = `UPDATE ${table} SET ${col} = REGEXP_REPLACE(${col}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}') WHERE ${col} LIKE '${cloudLike}';`;
    const n = await exec(sql);
    totalAffected += n;
    log(`    ${table}.${col.replace(/"/g, "")}: ${n} row(s)`);
  }

  // 2b — rewrite publicIds to the R2 key (strip host prefix from the URL col).
  log(`${c.cyan}  2b) rewriting publicIds -> R2 keys${c.reset}`);
  for (const [table, pubCol, urlCol] of publicIdSwaps) {
    const sql = `UPDATE ${table} SET ${pubCol} = SUBSTRING(${urlCol} FROM LENGTH('${r2Prefix}') + 1) WHERE ${urlCol} LIKE '${r2Like}';`;
    const n = await exec(sql);
    totalAffected += n;
    log(`    ${table}.${pubCol.replace(/"/g, "")}: ${n} row(s)`);
  }

  log(`${c.green}✓ Step 2 done:${c.reset} ${totalAffected} row(s) affected (cumulative)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log(`${c.bright}${c.cyan}╔══ Cloudinary -> R2 migration ══╗${c.reset}`);
  log(`${c.dim}  bucket:    ${R2_BUCKET_NAME || "(unset)"}${c.reset}`);
  log(`${c.dim}  publicUrl: ${R2_PUBLIC_BASE || "(unset)"}${c.reset}`);
  log(`${c.dim}  prefix:    ${KEY_PREFIX}/${c.reset}`);
  log(`${c.dim}  dryRun:    ${dryRun}${c.reset}`);

  if (!R2_BUCKET_NAME || !R2_PUBLIC_BASE) {
    log(`${c.red}R2_BUCKET / R2_PUBLIC_URL not set. Aborting.${c.reset}`);
    process.exit(1);
  }

  try {
    const resources = await listAllCloudinaryResources();
    await copyFilesToR2(resources);
    await rewriteDatabaseUrls();
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
