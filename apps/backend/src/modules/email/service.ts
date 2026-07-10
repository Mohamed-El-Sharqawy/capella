const MAILTRAP_API_URL = "https://send.api.mailtrap.io/api/send";
const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN;
const MAILTRAP_SENDER_EMAIL =
  process.env.MAILTRAP_SENDER_EMAIL || "hello@capellauae.com";
const MAILTRAP_SENDER_NAME =
  process.env.MAILTRAP_SENDER_NAME || "Capella";
const MAILTRAP_OWNERS = process.env.MAILTRAP_OWNERS || "";

interface MailtrapAddress {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: MailtrapAddress[];
  subject: string;
  html: string;
  replyTo?: MailtrapAddress;
}

function getOwnerEmails(): MailtrapAddress[] {
  return MAILTRAP_OWNERS.split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email, name: "Capella Owner" }));
}

async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  if (!MAILTRAP_TOKEN) {
    console.warn("MAILTRAP_TOKEN not set, skipping email");
    return;
  }

  const payload: Record<string, unknown> = {
    from: { email: MAILTRAP_SENDER_EMAIL, name: MAILTRAP_SENDER_NAME },
    to,
    subject,
    html,
  };

  if (replyTo) {
    payload.headers = { "Reply-To": replyTo.email };
  }

  try {
    const res = await fetch(MAILTRAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Token": MAILTRAP_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Mailtrap error ${res.status}: ${text}`);
    } else {
      console.log(`Email sent to ${to.map((t) => t.email).join(", ")}`);
    }
  } catch (err) {
    console.error("Mailtrap send failed:", err);
  }
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: {
    productNameEn: string;
    productNameAr: string;
    variantNameEn?: string;
    variantNameAr?: string;
    quantity: number;
    price: number;
    imageUrl?: string | null;
  }[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  note?: string;
}

export interface StatusUpdateEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  newStatus: string;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  };
  return map[status] || status;
}

function buildOwnerOrderHtml(data: OrderEmailData): string {
  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productNameEn}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;" />` : ""}
        <strong>${item.productNameEn}</strong>${item.variantNameEn ? ` (${item.variantNameEn})` : ""} &times; ${item.quantity}
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${(item.price * item.quantity).toFixed(2)} AED</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1a1a1a;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;">New Order #${data.orderId.slice(-8).toUpperCase()}</h1>
    <p style="margin:6px 0 0;font-size:14px;opacity:0.8;">${data.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</p>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <h3 style="margin-top:0;">Customer</h3>
    <p><strong>${data.customerName}</strong><br/>
    ${data.customerEmail}<br/>
    ${data.customerPhone || ""}</p>

    <h3>Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${itemsRows}
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">Subtotal</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${data.subtotal.toFixed(2)} AED</td>
      </tr>
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">Shipping</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${data.shippingCost.toFixed(2)} AED</td>
      </tr>
      ${data.discountAmount > 0 ? `<tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#e53e3e;">-${data.discountAmount.toFixed(2)} AED</td>
      </tr>` : ""}
      <tr>
        <td style="padding:10px;font-weight:bold;font-size:16px;">Total</td>
        <td style="padding:10px;text-align:right;font-weight:bold;font-size:16px;">${data.total.toFixed(2)} AED</td>
      </tr>
    </table>

    <h3>Shipping Address</h3>
    <p>${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br/>
    ${data.shippingAddress.street}<br/>
    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br/>
    ${data.shippingAddress.country}${data.shippingAddress.phone ? `<br/>${data.shippingAddress.phone}` : ""}</p>

    ${data.note ? `<h3>Customer Note</h3><p>${data.note}</p>` : ""}

    <p style="margin-top:20px;font-size:13px;color:#888;">Contact: capellaaae@hotmail.com &bull; +971 52 451 4147</p>
  </div>
</body>
</html>`;
}

function buildCustomerOrderHtml(data: OrderEmailData): string {
  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productNameEn}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:10px;vertical-align:middle;" />` : ""}
        <div style="display:inline-block;vertical-align:middle;">
          <strong>${item.productNameEn}</strong><br/>
          ${item.variantNameEn ? `<span style="color:#888;font-size:13px;">${item.variantNameEn}</span><br/>` : ""}
          Qty: ${item.quantity}
        </div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;vertical-align:middle;">${(item.price * item.quantity).toFixed(2)} AED</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:30px 0;">
    <h1 style="margin:0;font-size:26px;letter-spacing:2px;">CAPELLA</h1>
  </div>

  <div style="background:#f9f9f9;padding:30px;border-radius:8px;">
    <h2 style="margin-top:0;color:#1a1a1a;">Thank you for your order!</h2>
    <p>Hi ${data.customerName},</p>
    <p>Your order <strong>#${data.orderId.slice(-8).toUpperCase()}</strong> has been ${data.paymentMethod === "COD" ? "received" : "confirmed and paid"}.</p>

    <h3 style="margin-bottom:8px;">Order Summary</h3>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden;">
      ${itemsRows}
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">Subtotal</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${data.subtotal.toFixed(2)} AED</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">Shipping</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${data.shippingCost.toFixed(2)} AED</td>
      </tr>
      ${data.discountAmount > 0 ? `<tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;color:#e53e3e;">-${data.discountAmount.toFixed(2)} AED</td>
      </tr>` : ""}
      <tr>
        <td style="padding:14px 12px;font-weight:bold;font-size:16px;">Total</td>
        <td style="padding:14px 12px;text-align:right;font-weight:bold;font-size:16px;">${data.total.toFixed(2)} AED</td>
      </tr>
    </table>

    <h3 style="margin-top:24px;margin-bottom:8px;">Shipping To</h3>
    <p style="background:#fff;padding:12px;border-radius:6px;">${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br/>
    ${data.shippingAddress.street}<br/>
    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br/>
    ${data.shippingAddress.country}</p>

    ${data.note ? `<h3>Note</h3><p style="background:#fff;padding:12px;border-radius:6px;">${data.note}</p>` : ""}
  </div>

  <div style="text-align:center;padding:20px;font-size:13px;color:#888;">
    <p>Questions? Contact us at <a href="mailto:capellaaae@hotmail.com">capellaaae@hotmail.com</a> or +971 52 451 4147</p>
    <p style="margin-bottom:0;">Capella &mdash; Fine Jewelry</p>
  </div>
</body>
</html>`;
}

function buildStatusUpdateHtml(data: StatusUpdateEmailData): string {
  const statusColor: Record<string, string> = {
    CONFIRMED: "#38a169",
    PROCESSING: "#d69e2e",
    SHIPPED: "#3182ce",
    DELIVERED: "#38a169",
    CANCELLED: "#e53e3e",
    REFUNDED: "#e53e3e",
    PENDING: "#a0aec0",
  };
  const color = statusColor[data.newStatus] || "#333";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:30px 0;">
    <h1 style="margin:0;font-size:26px;letter-spacing:2px;">CAPELLA</h1>
  </div>

  <div style="background:#f9f9f9;padding:30px;border-radius:8px;text-align:center;">
    <h2 style="margin-top:0;">Order Status Update</h2>
    <p>Hi ${data.customerName},</p>
    <p>Your order <strong>#${data.orderId.slice(-8).toUpperCase()}</strong> status has been updated to:</p>
    <div style="display:inline-block;background:${color};color:#fff;padding:10px 28px;border-radius:20px;font-size:16px;font-weight:bold;letter-spacing:1px;">
      ${statusLabel(data.newStatus).toUpperCase()}
    </div>
    <p style="margin-top:24px;font-size:14px;color:#888;">If you have any questions, feel free to reach out.</p>
  </div>

  <div style="text-align:center;padding:20px;font-size:13px;color:#888;">
    <p>Questions? Contact us at <a href="mailto:capellaaae@hotmail.com">capellaaae@hotmail.com</a> or +971 52 451 4147</p>
    <p style="margin-bottom:0;">Capella &mdash; Fine Jewelry</p>
  </div>
</body>
</html>`;
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

function buildContactNotificationHtml(data: ContactEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1a1a1a;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;">New Contact Message</h1>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;font-weight:bold;width:100px;">Name</td><td>${data.name}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Email</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
      ${data.phone ? `<tr><td style="padding:8px 0;font-weight:bold;">Phone</td><td>${data.phone}</td></tr>` : ""}
      <tr><td style="padding:8px 0;font-weight:bold;">Subject</td><td>${data.subject}</td></tr>
    </table>
    <h3 style="margin-top:20px;">Message</h3>
    <p style="background:#f9f9f9;padding:16px;border-radius:6px;white-space:pre-wrap;">${data.message}</p>
  </div>
</body>
</html>`;
}

export abstract class EmailService {
  static async sendOrderNotification(data: OrderEmailData) {
    const owners = getOwnerEmails();
    if (owners.length === 0) {
      console.warn("MAILTRAP_OWNERS not set, skipping owner notification");
      return;
    }

    await sendEmail({
      to: owners,
      subject: `New Order #${data.orderId.slice(-8).toUpperCase()} - ${data.customerName}`,
      html: buildOwnerOrderHtml(data),
      replyTo: { email: data.customerEmail, name: data.customerName },
    });
  }

  static async sendCustomerConfirmation(data: OrderEmailData) {
    await sendEmail({
      to: [{ email: data.customerEmail, name: data.customerName }],
      subject: `Your Capella Order #${data.orderId.slice(-8).toUpperCase()} - Thank You!`,
      html: buildCustomerOrderHtml(data),
    });
  }

  static async sendStatusUpdate(data: StatusUpdateEmailData) {
    await sendEmail({
      to: [{ email: data.customerEmail, name: data.customerName }],
      subject: `Order #${data.orderId.slice(-8).toUpperCase()} - ${statusLabel(data.newStatus)}`,
      html: buildStatusUpdateHtml(data),
    });
  }

  static async sendContactNotification(data: ContactEmailData) {
    const owners = getOwnerEmails();
    if (owners.length === 0) {
      console.warn("MAILTRAP_OWNERS not set, skipping contact notification");
      return;
    }

    await sendEmail({
      to: owners,
      subject: `Contact: ${data.subject} - ${data.name}`,
      html: buildContactNotificationHtml(data),
      replyTo: { email: data.email, name: data.name },
    });
  }

  /**
   * Alert store owners when a Tabby/Tamara payment was AUTHORIZED but could not
   * be captured. Uncaptured authorizations are never settled, so these must be
   * resolved manually (capture/cancel) within Tabby's 21-day window.
   */
  static async sendCaptureFailureAlert(params: {
    orderId: string;
    paymentId: string;
    provider: string;
    error: unknown;
  }) {
    const owners = getOwnerEmails();
    if (owners.length === 0) {
      console.warn("MAILTRAP_OWNERS not set, skipping capture failure alert");
      return;
    }

    const errorMsg =
      params.error instanceof Error ? params.error.message : String(params.error);

    const html = `<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
    <div style="background:#dc2626;color:#fff;padding:20px 24px">
      <h2 style="margin:0;font-size:18px">⚠️ Payment capture failed — action required</h2>
    </div>
    <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6">
      <p>A payment was <strong>authorized</strong> but could not be captured. The order is NOT settled and must be resolved in the ${params.provider} dashboard within 21 days.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#6b7280">Order</td><td style="padding:6px 0"><strong>#${params.orderId.slice(-8).toUpperCase()}</strong> (${params.orderId})</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Provider</td><td style="padding:6px 0">${params.provider}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Payment ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px">${params.paymentId}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Error</td><td style="padding:6px 0">${errorMsg}</td></tr>
      </table>
      <p style="margin:0;color:#6b7280">Capture or cancel this payment manually in the ${params.provider} Merchant Dashboard.</p>
    </div>
  </div>
</body></html>`;

    await sendEmail({
      to: owners,
      subject: `⚠️ Capture failed: Order #${params.orderId.slice(-8).toUpperCase()} (${params.provider})`,
      html,
    });
  }
}
