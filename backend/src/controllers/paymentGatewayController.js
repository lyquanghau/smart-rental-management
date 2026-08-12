import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Invoice } from '../models/Invoice.js';
import { ServiceSetting } from '../models/ServiceSetting.js';
import { createHttpError } from '../utils/httpError.js';
import { getTenantIdForUser, ownerFilter } from '../utils/ownership.js';
import { markInvoicePaidFromGateway } from '../utils/paymentAutomation.js';

const momoRequestType = 'captureWallet';

function assertMomoConfigured() {
  const missing = [];

  if (!env.momo.partnerCode) missing.push('MOMO_PARTNER_CODE');
  if (!env.momo.accessKey) missing.push('MOMO_ACCESS_KEY');
  if (!env.momo.secretKey) missing.push('MOMO_SECRET_KEY');
  if (!env.momo.redirectUrl) missing.push('MOMO_REDIRECT_URL');
  if (!env.momo.ipnUrl) missing.push('MOMO_IPN_URL');

  if (missing.length > 0) {
    throw createHttpError(500, `Thieu cau hinh MoMo: ${missing.join(', ')}`);
  }
}

function signMomo(rawSignature) {
  return crypto
    .createHmac('sha256', env.momo.secretKey)
    .update(rawSignature)
    .digest('hex');
}

function buildCreateSignature(payload) {
  return signMomo(
    `accessKey=${env.momo.accessKey}&amount=${payload.amount}&extraData=${payload.extraData}&ipnUrl=${payload.ipnUrl}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&partnerCode=${payload.partnerCode}&redirectUrl=${payload.redirectUrl}&requestId=${payload.requestId}&requestType=${payload.requestType}`,
  );
}

function buildIpnSignature(payload) {
  return signMomo(
    `accessKey=${env.momo.accessKey}&amount=${payload.amount}&extraData=${payload.extraData || ''}&message=${payload.message || ''}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo || ''}&orderType=${payload.orderType || ''}&partnerCode=${payload.partnerCode}&payType=${payload.payType || ''}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId || ''}`,
  );
}

function createOrderId(invoice) {
  return `INV${String(invoice._id).slice(-18).toUpperCase()}`;
}

function createSepayCode(invoice) {
  return `SRINV${String(invoice._id).slice(-10).toUpperCase()}`;
}

function buildVietQrUrl({ amount, paymentCode, setting }) {
  if (
    !setting?.bankCode ||
    !setting?.bankAccountNumber ||
    !setting?.bankAccountName
  ) {
    return '';
  }

  const bankCode = encodeURIComponent(setting.bankCode);
  const accountNumber = encodeURIComponent(setting.bankAccountNumber);
  const amountValue = Math.round(Number(amount || 0));
  const params = new URLSearchParams({
    accountName: setting.bankAccountName,
    addInfo: paymentCode,
    amount: String(amountValue),
  });

  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?${params.toString()}`;
}

async function getInvoiceForPayment(req) {
  const filters =
    req.user.role === 'landlord'
      ? ownerFilter(req, { _id: req.params.id })
      : { _id: req.params.id };

  if (req.user.role === 'tenant') {
    filters.tenant = await getTenantIdForUser(req.user._id);
  }

  const invoice = await Invoice.findOne(filters).populate([
    { path: 'room', select: 'name floor price maxOccupants status' },
    { path: 'tenant', select: 'fullName phone email identityNumber' },
  ]);

  if (!invoice) {
    throw createHttpError(404, 'Khong tim thay hoa don');
  }

  if (['paid', 'cancelled'].includes(invoice.status)) {
    throw createHttpError(400, 'Hoa don khong con cho thanh toan');
  }

  return invoice;
}

function buildMockPayment(invoice) {
  const orderId = invoice.paymentOrderId || createOrderId(invoice);
  const requestId =
    invoice.paymentRequestId || `${orderId}-${Date.now().toString(36)}`;

  return {
    checkoutUrl: `${env.momo.redirectUrl || '/tenant-portal'}?mockMomoOrderId=${orderId}`,
    deeplink: '',
    mockMode: true,
    orderId,
    qrCodeUrl: '',
    requestId,
  };
}

function buildSepayPayment(invoice) {
  const orderId = invoice.paymentOrderId || createSepayCode(invoice);

  return {
    mockMode: env.sepay.mockMode,
    orderId,
  };
}

async function createRealMomoPayment(invoice) {
  assertMomoConfigured();

  const orderId = invoice.paymentOrderId || createOrderId(invoice);
  const requestId = `${orderId}-${Date.now().toString(36)}`;
  const extraData = Buffer.from(
    JSON.stringify({ invoiceId: String(invoice._id) }),
  ).toString('base64');
  const payload = {
    accessKey: env.momo.accessKey,
    amount: Number(invoice.totalAmount),
    autoCapture: true,
    extraData,
    ipnUrl: env.momo.ipnUrl,
    lang: 'vi',
    orderId,
    orderInfo: `Thanh toan hoa don ${invoice.month}/${invoice.year}`,
    partnerCode: env.momo.partnerCode,
    redirectUrl: env.momo.redirectUrl,
    requestId,
    requestType: momoRequestType,
  };

  payload.signature = buildCreateSignature(payload);

  const response = await fetch(env.momo.endpoint, {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    method: 'POST',
  });
  const data = await response.json();

  if (!response.ok || data.resultCode !== 0) {
    throw createHttpError(
      502,
      data.message || 'MoMo khong tao duoc link thanh toan',
    );
  }

  return {
    checkoutUrl: data.payUrl || '',
    deeplink: data.deeplink || '',
    mockMode: false,
    orderId,
    qrCodeUrl: data.qrCodeUrl || '',
    requestId,
  };
}

export async function createMomoPaymentLink(req, res, next) {
  try {
    const invoice = await getInvoiceForPayment(req);
    const paymentLink = env.momo.mockMode
      ? buildMockPayment(invoice)
      : await createRealMomoPayment(invoice);

    invoice.paymentProvider = 'momo';
    invoice.paymentOrderId = paymentLink.orderId;
    invoice.paymentRequestId = paymentLink.requestId;
    invoice.paymentCheckoutUrl = paymentLink.checkoutUrl;
    invoice.paymentDeeplink = paymentLink.deeplink;
    invoice.paymentQrCodeUrl = paymentLink.qrCodeUrl;
    invoice.paymentStatus = 'pending';
    await invoice.save();

    res.status(201).json({
      data: {
        amount: invoice.totalAmount,
        checkoutUrl: paymentLink.checkoutUrl,
        deeplink: paymentLink.deeplink,
        invoiceId: invoice._id,
        mockMode: paymentLink.mockMode,
        orderId: paymentLink.orderId,
        qrCodeUrl: paymentLink.qrCodeUrl,
        requestId: paymentLink.requestId,
      },
      message: 'Da tao phien thanh toan MoMo',
    });
  } catch (error) {
    next(error);
  }
}

export async function createSepayPaymentCode(req, res, next) {
  try {
    const invoice = await getInvoiceForPayment(req);
    const payment = buildSepayPayment(invoice);
    const serviceSetting = await ServiceSetting.findOne({
      owner: invoice.owner,
    }).sort({ createdAt: 1 });
    const qrCodeUrl = buildVietQrUrl({
      amount: invoice.totalAmount,
      paymentCode: payment.orderId,
      setting: serviceSetting,
    });

    invoice.paymentProvider = 'sepay';
    invoice.paymentOrderId = payment.orderId;
    invoice.paymentRequestId = payment.orderId;
    invoice.paymentQrCodeUrl = qrCodeUrl;
    invoice.paymentStatus = 'pending';
    await invoice.save();

    res.status(201).json({
      data: {
        amount: invoice.totalAmount,
        invoiceId: invoice._id,
        mockMode: payment.mockMode,
        orderId: payment.orderId,
        paymentCode: payment.orderId,
        qrCodeUrl,
        transferContent: payment.orderId,
      },
      message: 'Da tao ma thanh toan SePay',
    });
  } catch (error) {
    next(error);
  }
}

export async function handleMomoIpn(req, res, next) {
  try {
    const payload = req.body || {};
    const expectedSignature = buildIpnSignature(payload);

    if (payload.signature !== expectedSignature) {
      throw createHttpError(400, 'Chu ky MoMo khong hop le');
    }

    if (Number(payload.resultCode) === 0) {
      await markInvoicePaidFromGateway({
        amount: payload.amount,
        eventKey: `momo:${payload.orderId}:${payload.transId || payload.requestId}`,
        orderId: payload.orderId,
        paidAt: new Date(Number(payload.responseTime) || Date.now()),
        provider: 'momo',
        rawPayload: payload,
        reference: payload.transId ? String(payload.transId) : '',
        requestId: payload.requestId,
        transactionId: payload.transId,
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

function verifySepayApiKey(req) {
  const authorization = req.get('authorization') || '';
  const expected = `Apikey ${env.sepay.apiKey}`;

  if (!env.sepay.apiKey || authorization !== expected) {
    throw createHttpError(401, 'SePay API key khong hop le');
  }
}

function verifySepayHmac(req) {
  const signature = req.get('x-sepay-signature') || '';
  const timestamp = Number(req.get('x-sepay-timestamp') || 0);
  const rawBody = req.rawBody || JSON.stringify(req.body || {});
  const driftSeconds = Math.abs(Date.now() / 1000 - timestamp);

  if (!env.sepay.webhookSecret) {
    throw createHttpError(500, 'Thieu cau hinh SEPAY_WEBHOOK_SECRET');
  }

  if (!timestamp || driftSeconds > 300) {
    throw createHttpError(401, 'SePay webhook da het han');
  }

  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', env.sepay.webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw createHttpError(401, 'Chu ky SePay khong hop le');
  }
}

function verifySepayWebhook(req) {
  if (env.sepay.mockMode || env.sepay.authMode === 'none') return;
  if (env.sepay.authMode === 'api_key') {
    verifySepayApiKey(req);
    return;
  }

  verifySepayHmac(req);
}

function normalizeSepayPayload(payload) {
  return {
    amount: Number(payload.transferAmount || payload.amount || 0),
    code: String(payload.code || '').trim(),
    content: String(payload.content || ''),
    eventId: String(payload.id || payload.referenceCode || ''),
    referenceCode: String(payload.referenceCode || payload.id || ''),
    transferType: String(payload.transferType || '').toLowerCase(),
    transactionDate: payload.transactionDate,
  };
}

function findSepayOrderId({ code, content }) {
  if (code.startsWith('SRINV')) return code;

  const match = content.match(/SRINV[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : '';
}

export async function handleSepayWebhook(req, res, next) {
  try {
    verifySepayWebhook(req);

    const payload = normalizeSepayPayload(req.body || {});

    if (payload.transferType && payload.transferType !== 'in') {
      res.status(200).json({ success: true, skipped: true });
      return;
    }

    const orderId = findSepayOrderId(payload);

    if (!orderId) {
      throw createHttpError(400, 'Khong tim thay ma thanh toan SePay');
    }

    await markInvoicePaidFromGateway({
      amount: payload.amount,
      eventKey: `sepay:${payload.eventId || orderId}`,
      orderId,
      paidAt: payload.transactionDate
        ? new Date(payload.transactionDate)
        : new Date(),
      provider: 'sepay',
      rawPayload: req.body,
      reference: payload.referenceCode,
      requestId: payload.eventId,
      transactionId: payload.eventId,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function simulateMomoSuccess(req, res, next) {
  try {
    if (!env.momo.mockMode) {
      throw createHttpError(
        403,
        'Chi duoc gia lap thanh toan khi bat MoMo mock mode',
      );
    }

    const invoice = await getInvoiceForPayment(req);
    const orderId = invoice.paymentOrderId || createOrderId(invoice);
    const requestId = invoice.paymentRequestId || `${orderId}-mock`;
    const result = await markInvoicePaidFromGateway({
      amount: invoice.totalAmount,
      eventKey: `momo-mock:${orderId}`,
      orderId,
      paidAt: new Date(),
      provider: 'momo',
      rawPayload: { mock: true },
      reference: `MOCK-${orderId}`,
      requestId,
      transactionId: `MOCK-${orderId}`,
    });

    res.json({
      data: {
        invoice: result.invoice,
        payment: result.payment,
      },
      message: result.wasAlreadyPaid
        ? 'Hoa don da duoc ghi nhan thanh toan truoc do'
        : 'Gia lap MoMo IPN thanh cong',
    });
  } catch (error) {
    next(error);
  }
}

export async function simulateSepaySuccess(req, res, next) {
  try {
    if (!env.sepay.mockMode) {
      throw createHttpError(
        403,
        'Chi duoc gia lap thanh toan khi bat SePay mock mode',
      );
    }

    const invoice = await getInvoiceForPayment(req);
    const orderId = invoice.paymentOrderId || createSepayCode(invoice);

    invoice.paymentProvider = 'sepay';
    invoice.paymentOrderId = orderId;
    invoice.paymentRequestId = orderId;
    invoice.paymentStatus = 'pending';
    await invoice.save();

    const result = await markInvoicePaidFromGateway({
      amount: invoice.totalAmount,
      eventKey: `sepay-mock:${orderId}`,
      orderId,
      paidAt: new Date(),
      provider: 'sepay',
      rawPayload: { mock: true },
      reference: `SEPAY-MOCK-${orderId}`,
      requestId: orderId,
      transactionId: `SEPAY-MOCK-${orderId}`,
    });

    res.json({
      data: {
        invoice: result.invoice,
        payment: result.payment,
      },
      message: result.wasAlreadyPaid
        ? 'Hoa don da duoc ghi nhan thanh toan truoc do'
        : 'Gia lap SePay webhook thanh cong',
    });
  } catch (error) {
    next(error);
  }
}
