import { Invoice } from '../models/Invoice.js';
import { Notification } from '../models/Notification.js';
import { Payment } from '../models/Payment.js';
import { env } from '../config/env.js';
import { createHttpError } from './httpError.js';

const paidStatuses = new Set(['paid']);

function formatInvoiceLabel(invoice) {
  const roomName = invoice.room?.name || 'N/A';
  return `phong ${roomName} thang ${invoice.month}/${invoice.year}`;
}

function notifyDiscordPaymentSuccess(invoice) {
  if (!env.discordWebhookUrl) return;

  const roomName = invoice.room?.name || 'N/A';
  const tenantName = invoice.tenant?.fullName || 'N/A';
  const amount = Number(invoice.totalAmount).toLocaleString('vi-VN');

  fetch(env.discordWebhookUrl, {
    body: JSON.stringify({
      content: [
        '**Smart Rental - Hoa don da thanh toan**',
        `Phong: ${roomName}`,
        `Khach thue: ${tenantName}`,
        `So tien: ${amount} VND`,
        `Ky hoa don: ${invoice.month}/${invoice.year}`,
        `Ma giao dich: ${invoice.paymentOrderId || invoice.paidReference || 'N/A'}`,
      ].join('\n'),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }).catch((error) => {
    console.error('Discord payment notification failed:', error.message);
  });
}

export async function markInvoicePaidFromGateway({
  amount,
  eventKey,
  orderId,
  paidAt = new Date(),
  provider,
  rawPayload,
  reference,
  requestId,
  transactionId,
}) {
  const invoice = await Invoice.findOne({
    paymentProvider: provider,
    paymentOrderId: orderId,
  }).populate([
    { path: 'room', select: 'name floor price maxOccupants status' },
    { path: 'tenant', select: 'fullName phone email identityNumber' },
  ]);

  if (!invoice) {
    throw createHttpError(404, 'Khong tim thay hoa don cua giao dich');
  }

  if (Number(amount) !== Number(invoice.totalAmount)) {
    throw createHttpError(400, 'So tien thanh toan khong khop hoa don', {
      amount: 'So tien gateway tra ve khong bang tong hoa don',
    });
  }

  const wasAlreadyPaid = paidStatuses.has(invoice.status);

  invoice.status = 'paid';
  invoice.paidAt = paidAt;
  invoice.paymentStatus = 'paid';
  invoice.paidReference = reference || transactionId || '';
  await invoice.save();

  const payment = await Payment.findOneAndUpdate(
    { owner: invoice.owner, invoice: invoice._id },
    {
      $set: {
        amount: invoice.totalAmount,
        contract: invoice.contract,
        dueDate: invoice.dueDate,
        invoice: invoice._id,
        method:
          provider === 'momo'
            ? 'momo'
            : provider === 'sepay'
              ? 'sepay'
              : 'bank_transfer',
        note: `Auto paid by ${provider}`,
        owner: invoice.owner,
        paidAt,
        provider,
        providerOrderId: orderId,
        providerReference: reference || '',
        providerRequestId: requestId || '',
        providerTransactionId: transactionId ? String(transactionId) : '',
        status: 'paid',
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  if (!wasAlreadyPaid) {
    await Notification.findOneAndUpdate(
      { sourceEventKey: eventKey },
      {
        $setOnInsert: {
          entityId: invoice._id,
          entityType: 'invoice',
          message: `Hoa don ${formatInvoiceLabel(invoice)} da duoc thanh toan ${Number(invoice.totalAmount).toLocaleString('vi-VN')} VND.`,
          owner: invoice.owner,
          sourceEventKey: eventKey,
          title: 'Hoa don da thanh toan',
          type: 'payment_success',
        },
      },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    );
    notifyDiscordPaymentSuccess(invoice);
  }

  return {
    invoice,
    payment,
    rawPayload,
    wasAlreadyPaid,
  };
}
