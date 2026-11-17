import { Order, OrderItem } from '../types/order';

interface PrintReceiptOptions {
  customerName?: string;
  storeName?: string;
  storeLocation?: string;
}

/**
 * Utility to print or save-as-PDF a clean, GST-compliant Tax Invoice & Receipt
 * for any Order in the system (My Orders, Admin Order Details, POS Checkout).
 */
export function printReceipt(order: Order, options?: PrintReceiptOptions) {
  if (typeof window === 'undefined') return;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  const itemsList: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const itemsRows = itemsList
    .map((it) => {
      const qty = it.qty || it.quantity || 1;
      const price = it.price !== undefined ? it.price : (it.unit_price || 0);
      const sub = (qty * price).toFixed(2);
      return `
        <tr>
          <td style="padding: 7px 0; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
            ${qty}x ${it.name}
          </td>
          <td style="padding: 7px 0; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
            ₹${sub}
          </td>
        </tr>
      `;
    })
    .join('');

  const itemsSubtotal = itemsList.reduce((acc, it) => {
    const qty = it.qty || it.quantity || 1;
    const price = it.price !== undefined ? it.price : (it.unit_price || 0);
    return acc + qty * price;
  }, 0);

  const totalAmount = Number(order.total_amount || itemsSubtotal);
  const tax = Math.round(totalAmount * 0.05 * 100) / 100;
  const subtotalBeforeTax = Math.max(0, Math.round((totalAmount - tax) * 100) / 100);

  const addressHtml = order.delivery_address
    ? `
      <div style="margin-top: 14px; padding: 10px 12px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Delivery Address</div>
        <div style="font-size: 12px; font-weight: 600; color: #1e293b;">${order.delivery_address}</div>
      </div>
    `
    : '';

  const customerName =
    options?.customerName ||
    (order as any).user?.name ||
    'Valued Customer';

  const storeName =
    options?.storeName ||
    order.store?.name ||
    'StorePulse Food Hub';

  const storeLocation =
    options?.storeLocation ||
    order.store?.location ||
    'Savedi, Ahilyanagar, Maharashtra';

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const orderShortId = order.id ? order.id.slice(0, 8).toUpperCase() : 'UNKNOWN';
  const paymentMethod = order.payment_method || 'CASH';
  const isPaid = order.payment_status === 'COMPLETED' || (order.payment_status as string) === 'PAID' || paymentMethod !== 'CASH';

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice_${orderShortId}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 12px;
          }
          .receipt-box {
            max-width: 440px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 22px;
            box-sizing: border-box;
          }
          .store-header {
            text-align: center;
            border-bottom: 2px dashed #cbd5e1;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .store-brand {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .brand-accent {
            color: #ff7a00;
          }
          .store-outlet {
            font-size: 14px;
            font-weight: 700;
            color: #334155;
            margin-top: 3px;
          }
          .store-location {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .doc-title {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 12px;
            background: #f1f5f9;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: #475569;
            text-transform: uppercase;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding-bottom: 12px;
            margin-bottom: 12px;
            border-bottom: 1px solid #f1f5f9;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .meta-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .meta-value {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .section-label {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 6px;
          }
          .totals-table {
            margin-top: 10px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
          }
          .grand-total-row td {
            padding: 10px 0 4px 0;
            border-top: 2px solid #0f172a;
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
          }
          .grand-total-price {
            color: #ff7a00;
            font-size: 18px;
          }
          .payment-row {
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: ${isPaid ? '#f0fdf4' : '#fff7ed'};
            border: 1px solid ${isPaid ? '#bbf7d0' : '#fed7aa'};
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            color: ${isPaid ? '#166534' : '#c2410c'};
          }
          .receipt-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px dashed #e2e8f0;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="store-header">
            <div class="store-brand">Store<span class="brand-accent">Pulse</span></div>
            <div class="store-outlet">${storeName}</div>
            <div class="store-location">📍 ${storeLocation}</div>
            <div class="doc-title">Tax Invoice & Cash Memo</div>
          </div>

          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Invoice / Order ID</span>
              <span class="meta-value">#${orderShortId}</span>
              <span class="meta-label" style="margin-top: 4px;">Customer</span>
              <span class="meta-value">${customerName}</span>
            </div>
            <div class="meta-item" style="text-align: right;">
              <span class="meta-label">Date & Time</span>
              <span class="meta-value">${formattedDate}</span>
              <span class="meta-label" style="margin-top: 4px;">Order Type</span>
              <span class="meta-value">${order.delivery_address ? 'Home Delivery' : 'Dine-In / Counter'}</span>
            </div>
          </div>

          <div class="section-label">Billed Items</div>
          <table>
            <thead>
              <tr style="border-bottom: 1.5px solid #0f172a; text-align: left; font-size: 11px; color: #64748b;">
                <th style="padding-bottom: 6px;">Item & Qty</th>
                <th style="padding-bottom: 6px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals-table">
            <table>
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #64748b;">Item Subtotal</td>
                <td style="padding: 4px 0; text-align: right; font-size: 12px; font-weight: 600;">₹${subtotalBeforeTax.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #64748b;">GST (5% Tax)</td>
                <td style="padding: 4px 0; text-align: right; font-size: 12px; font-weight: 600;">₹${tax.toFixed(2)}</td>
              </tr>
              <tr class="grand-total-row">
                <td>Grand Total</td>
                <td style="text-align: right;" class="grand-total-price">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="payment-row">
            <span>Payment Mode: <strong>${paymentMethod}</strong></span>
            <span>Status: <strong>${isPaid ? 'PAID' : 'PENDING'}</strong></span>
          </div>

          ${addressHtml}

          <div class="receipt-footer">
            <div style="font-weight: 700; color: #475569; margin-bottom: 2px;">FSSAI Lic. & GST Compliant Invoice</div>
            <div>Thank you for ordering with StorePulse • Please Visit Again!</div>
          </div>
        </div>
      </body>
    </html>
  `;

  frameDoc.open();
  frameDoc.write(receiptHtml);
  frameDoc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }
  }, 250);
}
