import type { Order } from "@ecommerce/shared-types";
import { toast } from "sonner";

// ─── Brand contact ───────────────────────────────────────────────────────────
const STORE_PHONE = "+971 52 451 4147";

// ─── Small helpers (kept local so this file is self-contained) ────────────────
const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString()} AED`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const shortNo = (id: string) => id.slice(-8).toUpperCase();

function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

function statusStyle(status: string): string {
  const s = status.toUpperCase();
  if (s === "DELIVERED") return "background:#dcfce7;color:#166534";
  if (s === "CANCELLED" || s === "REFUNDED") return "background:#fee2e2;color:#991b1b";
  if (s === "PENDING") return "background:#fef9c3;color:#854d0e";
  if (s === "CONFIRMED" || s === "PROCESSING" || s === "SHIPPED") return "background:#dbeafe;color:#1e40af";
  return "background:#f3f4f6;color:#374151";
}

const ONLINE_METHODS = ["ZIINA", "TABBY", "TAMARA"];

function paymentBox(order: Order): string {
  if (order.status === "REFUNDED") {
    return `<div class="pay refunded">REFUNDED — DO NOT SHIP</div>`;
  }
  if (ONLINE_METHODS.includes(order.paymentMethod || "")) {
    return `<div class="pay prepaid">PREPAID${order.paymentMethod ? ` via ${esc(order.paymentMethod)}` : ""} — <b>no cash collection</b></div>`;
  }
  // Cash on Delivery
  if (order.paidAt) {
    return `<div class="pay paid">PAID (cash already collected)</div>`;
  }
  return `<div class="pay cod">COLLECT ON DELIVERY: <b>${money(order.total)}</b></div>`;
}

function buildPackingSlipHtml(order: Order): string {
  const no = shortNo(order.id);
  const dateStr = fmtDate(order.createdAt);

  const shipName = `${order.shippingFirstName} ${order.shippingLastName}`;
  const cityLine = [order.shippingCity, order.shippingState, order.shippingZipCode]
    .filter(Boolean)
    .join(", ");

  const totalPieces = (order.items || []).reduce((s, i) => s + i.quantity, 0);

  const noteHtml = order.note
    ? `<div class="note"><b>Note:</b> ${esc(order.note)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Packing Slip #CAP-${no} — Capella</title>
<style>
  @page { size: 4in 6in; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 2px; font-size: 10px; line-height: 1.35; }
  .toolbar { text-align: right; margin-bottom: 6px; }
  .toolbar button { background: #111; color: #fff; border: 0; padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 8px; }
  .brand { font-size: 16px; font-weight: 800; letter-spacing: 2px; }
  .brand-sub { font-size: 7px; color: #b8945f; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 1px; }
  .brand-contact { font-size: 9px; color: #444; margin-top: 3px; }
  .head-right { text-align: right; }
  .qr { width: 46px; height: 46px; }
  .ord-no { font-size: 11px; font-weight: 700; margin-top: 2px; }
  .head-meta { font-size: 9px; color: #777; margin-top: 1px; }
  .status { display: inline-block; margin-top: 3px; padding: 1px 6px; border-radius: 999px; font-size: 8px; font-weight: 700; letter-spacing: 1px; ${statusStyle(order.status)} }
  .grid { display: flex; gap: 6px; margin-bottom: 8px; }
  .box { border-radius: 3px; padding: 6px 7px; }
  .box h3 { font-size: 7px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin: 0 0 3px; }
  .ship { flex: 1.5; border: 2px solid #111; }
  .ship .name { font-size: 13px; font-weight: 800; }
  .ship .line { font-size: 10px; margin-top: 2px; }
  .ship .phone { font-size: 12px; font-weight: 700; margin-top: 4px; }
  .from { flex: 1; border: 1px solid #ddd; }
  .from .line { font-size: 9px; color: #555; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
  thead th { text-align: left; font-size: 7px; text-transform: uppercase; letter-spacing: 1px; color: #999; border-bottom: 2px solid #eee; padding: 4px 3px; }
  thead th.r { text-align: right; }
  tbody td { padding: 4px 3px; border-bottom: 1px solid #f0f0f0; font-size: 10px; vertical-align: top; }
  td.r { text-align: right; }
  td.sku { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; color: #444; }
  td.qty { font-weight: 700; }
  .check { font-size: 12px; line-height: 1; }
  .item-name { font-weight: 600; }
  .item-sub { font-size: 8px; color: #888; margin-top: 1px; }
  .pieces { font-size: 9px; color: #555; margin-bottom: 6px; }
  .pay { padding: 5px 7px; border-radius: 3px; margin-bottom: 6px; font-size: 10px; }
  .pay.cod { background: #fff7e6; border: 1.5px solid #111; color: #ad6800; }
  .pay.prepaid { background: #f6ffed; border: 1.5px solid #111; color: #389e0d; }
  .pay.paid { background: #f6ffed; border: 1.5px solid #111; color: #389e0d; }
  .pay.refunded { background: #fff1f0; border: 2px solid #111; color: #a8071a; font-weight: 700; }
  .note { font-size: 9px; color: #555; background: #fafafa; border-left: 3px solid #111; padding: 4px 7px; margin-bottom: 6px; }
  .fillin { font-size: 9px; color: #555; margin: 5px 0; }
  .fillin span { display: inline-block; border-bottom: 1px solid #999; min-width: 75px; height: 10px; }
  .sigs { display: flex; gap: 12px; margin-top: 8px; padding-top: 6px; border-top: 1px solid #eee; font-size: 9px; }
  .sigs .sig { flex: 1; }
  .sigs .line { margin-top: 11px; border-bottom: 1px solid #999; height: 1px; }
  @media print { body { padding: 0; } .toolbar { display: none; } }
</style></head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>

  <div class="head">
    <div>
      <div class="brand">CAPELLA</div>
      <div class="brand-sub">Luxury Jewellery</div>
      <div class="brand-contact">Tel: ${STORE_PHONE}</div>
    </div>
    <div class="head-right">
      <img class="qr" src="https://quickchart.io/qr?text=${encodeURIComponent(order.id)}&size=200&ecLevel=M&margin=2" alt="Order QR" onerror="this.style.display='none'" />
      <div class="ord-no">#CAP-${no}</div>
      <div class="head-meta">${dateStr}</div>
      <div class="status">${esc(order.status)}</div>
    </div>
  </div>

  <div class="box ship">
      <h3>Ship To</h3>
      <div class="name">${esc(shipName)}</div>
      <div class="line">${esc(order.shippingStreet)}</div>
      <div class="line">${esc(cityLine)}</div>
      <div class="line">${esc(order.shippingCountry)}</div>
      <div class="phone">Tel: ${esc(order.shippingPhone || "—")}</div>
    </div>

  <div class="pieces" style="margin-top: 5px;">Total pieces: <b>${totalPieces}</b></div>

  ${paymentBox(order)}

  ${noteHtml}

  <script>
    (function () {
      function doPrint() { setTimeout(function () { window.focus(); window.print(); }, 250); }
      var imgs = Array.prototype.slice.call(document.images);
      var pending = imgs.filter(function (i) { return !i.complete; }).length;
      if (pending === 0) { doPrint(); return; }
      var done = 0;
      imgs.forEach(function (img) {
        img.addEventListener("load", check);
        img.addEventListener("error", check);
      });
      function check() { done++; if (done >= pending) doPrint(); }
      setTimeout(doPrint, 2500);
    })();
  </script>
</body></html>`;
}

/**
 * Opens a print-ready packing slip for the given order in a new window (4×6 in)
 * and triggers the browser's print dialog. Designed to go in the shipping box
 * and be handed to the carrier — address-dominant, SKU + packed checkboxes,
 * COD collection amount when applicable.
 */
export function printPackingSlip(order: Order): void {
  const win = window.open("", "_blank", "width=620,height=820");
  if (!win) {
    toast.error("Pop-up blocked — allow pop-ups for this site to print the packing slip.");
    return;
  }
  win.document.open();
  win.document.write(buildPackingSlipHtml(order));
  win.document.close();
}
