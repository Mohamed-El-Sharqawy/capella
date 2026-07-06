import { getShippingCost } from "@ecommerce/shared-utils";
import type { Order } from "@ecommerce/shared-types";
import { toast } from "sonner";

const CURRENCY = "AED";
const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString()} ${CURRENCY}`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

/** Escape user-supplied strings before injecting them into the print-window HTML. */
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

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "DELIVERED") return "background:#dcfce7;color:#166534";
  if (s === "CANCELLED" || s === "REFUNDED") return "background:#fee2e2;color:#991b1b"
  if (s === "PENDING") return "background:#fef9c3;color:#854d0e";
  if (s === "CONFIRMED" || s === "PROCESSING" || s === "SHIPPED") return "background:#dbeafe;color:#1e40af";
  return "background:#f3f4f6;color:#374151";
}

function paymentSummary(order: Order): string {
  if (order.status === "REFUNDED") return "Refunded";
  const online = ["ZIINA", "TABBY", "TAMARA"].includes(order.paymentMethod || "");
  if (online) return `Paid online via ${order.paymentMethod}`;
  if (order.paidAt) return `Paid (Cash on Delivery) — ${fmtDate(order.paidAt)}`;
  return "Cash on Delivery — Not yet paid";
}

function buildInvoiceHtml(order: Order): string {
  const invNo = `INV-${order.id.slice(-8).toUpperCase()}`;
  const dateStr = fmtDate(order.createdAt);

  const name = order.user
    ? `${order.user.firstName} ${order.user.lastName}`
    : `${order.guestFirstName || order.shippingFirstName} ${order.guestLastName || order.shippingLastName}`;
  const email = order.user?.email || order.guestEmail || "—";
  const phone = order.guestPhone || order.shippingPhone || "—";

  const shipName = `${order.shippingFirstName} ${order.shippingLastName}`;
  const cityLine = [order.shippingCity, order.shippingState, order.shippingZipCode]
    .filter(Boolean)
    .join(", ");

  const itemsHtml = (order.items || [])
    .map((item) => {
      const img = item.imageUrl
        ? `<img class="img" src="${esc(item.imageUrl)}" alt="" />`
        : "";
      const variant = item.variantNameEn ? esc(item.variantNameEn) : "";
      const sku = item.sku ? ` · SKU ${esc(item.sku)}` : "";
      return `
        <tr>
          <td>${img}<span class="item-name">${esc(item.productNameEn)}</span>
            <div class="item-sub">${variant}${sku}</div></td>
          <td class="num">${item.quantity}</td>
          <td class="num">${money(item.price)}</td>
          <td class="num">${money(item.price * item.quantity)}</td>
        </tr>`;
    })
    .join("");

  const subtotal = (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = order.discountAmount || 0;
  const shipping = getShippingCost(subtotal);

  const discountRow =
    discount > 0
      ? `<div class="row discount"><span>Discount${
          order.coupon ? ` (${esc(order.coupon.code)})` : ""
        }</span><span>−${money(discount)}</span></div>`
      : "";

  const noteHtml = order.note
    ? `<div class="note"><b>Customer note:</b> ${esc(order.note)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${invNo} — Capella</title>
<style>
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 28px; }
  .wrap { max-width: 760px; margin: 0 auto; }
  .toolbar { text-align: right; margin-bottom: 18px; }
  .toolbar button { background: #111; color: #fff; border: 0; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 18px; margin-bottom: 26px; }
  .brand { font-size: 30px; font-weight: 800; letter-spacing: 4px; }
  .brand-sub { font-size: 10px; color: #b8945f; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
  .brand-contact { font-size: 11px; color: #777; margin-top: 10px; line-height: 1.6; }
  .doc { text-align: right; }
  .doc h1 { font-size: 32px; margin: 0; letter-spacing: 3px; font-weight: 300; }
  .doc .inv-no { font-size: 13px; color: #444; margin-top: 6px; font-weight: 600; }
  .doc .full-id { font-size: 10px; color: #999; margin-top: 2px; }
  .doc .date { font-size: 12px; color: #888; margin-top: 6px; }
  .status { display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 1px; ${statusBadgeClass(
    order.status
  )} }
  .parties { display: flex; gap: 40px; margin-bottom: 26px; }
  .party { flex: 1; }
  .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 8px; }
  .party .name { font-weight: 700; font-size: 14px; }
  .party .line { font-size: 12px; color: #555; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
  thead th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; border-bottom: 2px solid #eee; padding: 10px 8px; }
  thead th.num { text-align: right; }
  tbody td { padding: 12px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px; vertical-align: middle; }
  tbody td.num { text-align: right; white-space: nowrap; }
  .item-name { font-weight: 600; }
  .item-sub { font-size: 11px; color: #888; margin-top: 3px; }
  .img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; vertical-align: middle; margin-right: 10px; }
  .totals { margin-left: auto; width: 290px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .row.muted { color: #777; }
  .totals .row.discount { color: #2e7d32; }
  .totals .grand { border-top: 2px solid #111; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 800; }
  .pay { margin-top: 18px; padding: 12px 16px; background: #f7f5f2; border-left: 3px solid #b8945f; font-size: 12px; }
  .pay b { text-transform: uppercase; letter-spacing: 1px; font-size: 10px; color: #555; }
  .note { margin-top: 14px; font-size: 12px; color: #666; }
  .foot { margin-top: 36px; padding-top: 18px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
  @media print { body { padding: 0; } .toolbar { display: none; } }
</style></head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="wrap">
    <div class="head">
      <div>
        <div class="brand">CAPELLA</div>
        <div class="brand-sub">Luxury Jewellery</div>
        <div class="brand-contact">
          hello@capellauae.com<br />capellauae.com<br />United Arab Emirates
        </div>
      </div>
      <div class="doc">
        <h1>INVOICE</h1>
        <div class="inv-no">${invNo}</div>
        <div class="full-id">${esc(order.id)}</div>
        <div class="date">${dateStr}</div>
        <div class="status">${esc(order.status)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Bill To</h3>
        <div class="name">${esc(name)}</div>
        <div class="line">${esc(email)}</div>
        <div class="line">${esc(phone)}</div>
      </div>
      <div class="party">
        <h3>Ship To</h3>
        <div class="name">${esc(shipName)}</div>
        <div class="line">${esc(order.shippingStreet)}</div>
        <div class="line">${esc(cityLine)}</div>
        <div class="line">${esc(order.shippingCountry)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit Price</th><th class="num">Total</th></tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="totals">
      <div class="row muted"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      ${discountRow}
      <div class="row muted"><span>Shipping</span><span>${
        shipping === 0 ? "Free" : money(shipping)
      }</span></div>
      <div class="row grand"><span>Total</span><span>${money(order.total)}</span></div>
    </div>

    <div class="pay"><b>Payment</b><br />${esc(paymentSummary(order))}</div>
    ${noteHtml}

    <div class="foot">Thank you for shopping with Capella · capellauae.com</div>
  </div>
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
      function check() {
        done++;
        if (done >= pending) doPrint();
      }
      setTimeout(doPrint, 2500); // fallback
    })();
  </script>
</body></html>`;
}

/**
 * Opens a print-ready invoice for the given order in a new window and triggers
 * the browser's print dialog (which also supports "Save as PDF").
 */
export function printOrderInvoice(order: Order): void {
  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) {
    toast.error("Pop-up blocked — allow pop-ups for this site to print invoices.");
    return;
  }
  win.document.open();
  win.document.write(buildInvoiceHtml(order));
  win.document.close();
}
