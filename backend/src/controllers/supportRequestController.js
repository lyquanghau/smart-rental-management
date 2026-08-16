import { Notification } from '../models/Notification.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { createHttpError } from '../utils/httpError.js';
import { getTenantForUser, ownerFilter } from '../utils/ownership.js';

const supportPopulate = [
  {
    path: 'tenant',
    select: 'fullName phone email room',
    populate: { path: 'room', select: 'name floor' },
  },
  { path: 'requester', select: 'fullName email username role' },
  { path: 'owner', select: 'fullName email' },
];

function pickAllowed(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function normalizeCreatePayload(body) {
  return {
    category: pickAllowed(
      body.category,
      ['billing', 'contract', 'room', 'account', 'other'],
      'other',
    ),
    description: body.description?.trim(),
    priority: pickAllowed(body.priority, ['normal', 'urgent'], 'normal'),
    subject: body.subject?.trim(),
  };
}

function normalizeLandlordUpdatePayload(body, currentRequest) {
  const payload = {};

  if (body.priority !== undefined) {
    payload.priority = pickAllowed(
      body.priority,
      ['normal', 'urgent'],
      currentRequest.priority,
    );
  }

  if (body.status !== undefined) {
    payload.status = pickAllowed(
      body.status,
      ['open', 'in_progress', 'resolved', 'closed'],
      currentRequest.status,
    );
  }

  if (body.landlordReply !== undefined) {
    payload.landlordReply = body.landlordReply?.trim() || '';
  }

  if (payload.status === 'resolved' && currentRequest.status !== 'resolved') {
    payload.resolvedAt = new Date();
  }

  if (payload.status === 'closed' && currentRequest.status !== 'closed') {
    payload.closedAt = new Date();
  }

  if (payload.status && !['resolved', 'closed'].includes(payload.status)) {
    payload.resolvedAt = null;
    payload.closedAt = null;
  }

  return payload;
}

async function createSupportNotification({
  eventKey,
  message,
  owner,
  recipientRole,
  recipientUser,
  supportRequest,
  title,
}) {
  await Notification.updateOne(
    { sourceEventKey: eventKey },
    {
      $setOnInsert: {
        entityId: supportRequest._id,
        entityType: 'support_request',
        message,
        owner,
        recipientRole,
        recipientUser,
        sourceEventKey: eventKey,
        title,
        type: 'support_request',
      },
    },
    { upsert: true },
  );
}

function buildListFilters(req, tenant) {
  const filters =
    req.user.role === 'landlord'
      ? ownerFilter(req)
      : {
          requester: req.user._id,
          tenant: tenant._id,
        };

  if (req.query.status) {
    filters.status = pickAllowed(
      req.query.status,
      ['open', 'in_progress', 'resolved', 'closed'],
      undefined,
    );
  }

  if (req.query.priority) {
    filters.priority = pickAllowed(
      req.query.priority,
      ['normal', 'urgent'],
      undefined,
    );
  }

  if (req.query.category) {
    filters.category = pickAllowed(
      req.query.category,
      ['billing', 'contract', 'room', 'account', 'other'],
      undefined,
    );
  }

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  );
}

export async function listSupportRequests(req, res, next) {
  try {
    const tenant =
      req.user.role === 'tenant' ? await getTenantForUser(req.user._id) : null;
    const safeLimit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const requests = await SupportRequest.find(buildListFilters(req, tenant))
      .populate(supportPopulate)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(safeLimit);

    res.json({ data: requests });
  } catch (error) {
    next(error);
  }
}

export async function getSupportRequest(req, res, next) {
  try {
    const filters =
      req.user.role === 'landlord'
        ? ownerFilter(req, { _id: req.params.id })
        : {
            _id: req.params.id,
            requester: req.user._id,
            tenant: (await getTenantForUser(req.user._id))._id,
          };
    const request =
      await SupportRequest.findOne(filters).populate(supportPopulate);

    if (!request) {
      throw createHttpError(404, 'Khong tim thay yeu cau ho tro');
    }

    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function createSupportRequest(req, res, next) {
  try {
    if (req.user.role !== 'tenant') {
      throw createHttpError(403, 'Chi khach thue moi tao yeu cau ho tro');
    }

    const tenant = await getTenantForUser(req.user._id);
    const payload = normalizeCreatePayload(req.body);
    const supportRequest = await SupportRequest.create({
      ...payload,
      owner: tenant.owner,
      requester: req.user._id,
      tenant: tenant._id,
    });
    const populatedRequest = await supportRequest.populate(supportPopulate);

    await createSupportNotification({
      eventKey: `support-created:${supportRequest._id}`,
      message: `${tenant.fullName || 'Khách thuê'} đã gửi yêu cầu: ${supportRequest.subject}`,
      owner: tenant.owner,
      recipientRole: 'landlord',
      supportRequest,
      title: 'Yêu cầu hỗ trợ mới',
    });

    res.status(201).json({
      data: populatedRequest,
      message: 'Đã gửi yêu cầu hỗ trợ',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSupportRequest(req, res, next) {
  try {
    if (req.user.role !== 'landlord') {
      throw createHttpError(403, 'Chi chu tro moi cap nhat yeu cau ho tro');
    }

    const currentRequest = await SupportRequest.findOne(
      ownerFilter(req, { _id: req.params.id }),
    ).populate('tenant', 'fullName user');

    if (!currentRequest) {
      throw createHttpError(404, 'Khong tim thay yeu cau ho tro');
    }

    const payload = normalizeLandlordUpdatePayload(req.body, currentRequest);
    const supportRequest = await SupportRequest.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      payload,
      { new: true, runValidators: true },
    ).populate(supportPopulate);

    await createSupportNotification({
      eventKey: `support-updated:${supportRequest._id}:${supportRequest.updatedAt.getTime()}`,
      message: `Chủ trọ đã cập nhật yêu cầu: ${supportRequest.subject}`,
      owner: req.user._id,
      recipientRole: 'tenant',
      recipientUser: currentRequest.requester,
      supportRequest,
      title: 'Yêu cầu hỗ trợ đã được cập nhật',
    });

    res.json({
      data: supportRequest,
      message: 'Đã cập nhật yêu cầu hỗ trợ',
    });
  } catch (error) {
    next(error);
  }
}

export async function closeSupportRequest(req, res, next) {
  try {
    if (req.user.role !== 'tenant') {
      throw createHttpError(403, 'Chi khach thue moi dong yeu cau ho tro');
    }

    const tenant = await getTenantForUser(req.user._id);
    const supportRequest = await SupportRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        requester: req.user._id,
        tenant: tenant._id,
      },
      {
        closedAt: new Date(),
        status: 'closed',
      },
      { new: true, runValidators: true },
    ).populate(supportPopulate);

    if (!supportRequest) {
      throw createHttpError(404, 'Khong tim thay yeu cau ho tro');
    }

    await createSupportNotification({
      eventKey: `support-closed:${supportRequest._id}`,
      message: `${tenant.fullName || 'Khách thuê'} đã đóng yêu cầu: ${supportRequest.subject}`,
      owner: tenant.owner,
      recipientRole: 'landlord',
      supportRequest,
      title: 'Yêu cầu hỗ trợ đã đóng',
    });

    res.json({
      data: supportRequest,
      message: 'Đã đóng yêu cầu hỗ trợ',
    });
  } catch (error) {
    next(error);
  }
}
