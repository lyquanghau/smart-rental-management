import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, KeyRound, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { unlockUser } from '../services/authService.js';
import { getRooms } from '../services/roomService.js';
import {
  createTenant,
  deleteTenant,
  getTenants,
  updateTenant,
} from '../services/tenantService.js';

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  identityNumber: '',
  room: '',
};

const copy = {
  en: {
    add: 'Add',
    addTenant: 'Add tenant',
    actions: 'Actions',
    cancel: 'Cancel',
    confirmDelete: (name) =>
      `Delete tenant ${name}? The record will be hidden from the list.`,
    contact: 'Contact',
    delete: 'Delete',
    edit: 'Edit',
    empty: 'No tenants yet.',
    floor: 'Floor',
    floorOption: 'floor',
    fullName: 'Full name',
    loading: 'Loading...',
    loadingData: 'Loading data...',
    managed: 'managed tenants',
    noEmail: 'No email',
    noId: 'No ID number',
    phone: 'Phone number',
    reload: 'Reload',
    room: 'Room',
    saving: 'Saving...',
    saved: 'Tenant saved.',
    deleted: 'Tenant deleted.',
    tenant: 'Tenant',
    tenants: 'Tenants',
    unassigned: 'Unassigned',
    update: 'Update',
    updateTenant: 'Update tenant',
  },
  vi: {
    add: 'Thêm',
    addTenant: 'Thêm khách',
    actions: 'Thao tác',
    cancel: 'Hủy',
    confirmDelete: (name) =>
      `Xóa khách thuê ${name}? Dữ liệu sẽ được ẩn khỏi danh sách.`,
    contact: 'Liên hệ',
    delete: 'Xóa',
    edit: 'Sửa',
    empty: 'Chưa có khách thuê nào.',
    floor: 'Tầng',
    floorOption: 'tầng',
    fullName: 'Họ tên',
    loading: 'Đang tải...',
    loadingData: 'Đang tải dữ liệu...',
    managed: 'khách đang quản lý',
    noEmail: 'Chưa có email',
    noId: 'Chưa có CCCD/CMND',
    phone: 'Số điện thoại',
    reload: 'Tải lại',
    room: 'Phòng',
    saving: 'Đang lưu...',
    saved: 'Đã lưu thông tin khách thuê.',
    deleted: 'Đã xóa khách thuê.',
    tenant: 'Khách thuê',
    tenants: 'Khách thuê',
    unassigned: 'Chưa gán phòng',
    update: 'Cập nhật',
    updateTenant: 'Cập nhật khách thuê',
  },
};

const accountCopy = {
  en: {
    account: 'Account',
    accountActive: 'Active account',
    accountLocked: 'Locked account',
    accountNoLogin: 'No login account',
    accountTemporary: 'Temporary password',
    confirmResetPassword: (name) =>
      `Reset login password for ${name}? A new temporary password will be generated.`,
    credentialNote:
      'The temporary password is shown once. Ask the tenant to change it after login.',
    newCredentialTitle: 'Give this login to the tenant',
    passwordDeadline: 'Password change deadline',
    resetPassword: 'Reset password',
    resetPasswordSuccess: 'Temporary password generated.',
    tempPassword: 'Temporary password',
    username: 'Username',
  },
  vi: {
    account: 'Tai khoan',
    accountActive: 'Dang hoat dong',
    accountLocked: 'Dang bi khoa',
    accountNoLogin: 'Chua co tai khoan',
    accountTemporary: 'Mat khau tam',
    confirmResetPassword: (name) =>
      `Cap lai mat khau dang nhap cho ${name}? He thong se tao mat khau tam moi.`,
    credentialNote:
      'Mat khau tam chi hien thi mot lan. Nhac khach thue doi sau khi dang nhap.',
    newCredentialTitle: 'Gui thong tin nay cho khach thue',
    passwordDeadline: 'Han doi mat khau',
    resetPassword: 'Cap lai mat khau',
    resetPasswordSuccess: 'Da tao mat khau tam.',
    tempPassword: 'Mat khau tam',
    username: 'Ten dang nhap',
  },
};

function toFormData(tenant) {
  return {
    fullName: tenant.fullName || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    identityNumber: tenant.identityNumber || '',
    room: tenant.room?._id || tenant.room || '',
  };
}

function toPayload(formData) {
  return {
    fullName: formData.fullName.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim() || null,
    identityNumber: formData.identityNumber.trim() || null,
    room: formData.room || null,
  };
}

function formatDate(value, text) {
  if (!value) return text.accountNoLogin;
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function getAccountStatus(tenant, text) {
  if (!tenant.user) return text.accountNoLogin;
  if (!tenant.user.isActive) return text.accountLocked;
  if (tenant.user.mustChangePassword) return text.accountTemporary;
  return text.accountActive;
}

export function TenantsPage() {
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const text = {
    ...(copy[language] || copy.vi),
    ...(accountCopy[language] || accountCopy.vi),
  };
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTenantId, setEditingTenantId] = useState('');
  const [credential, setCredential] = useState(null);
  const [resettingUserId, setResettingUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isEditing = Boolean(editingTenantId);

  const availableRoomOptions = useMemo(() => {
    return rooms.filter(
      (room) =>
        room.status !== 'maintenance' ||
        tenants.some(
          (tenant) =>
            tenant._id === editingTenantId &&
            (tenant.room?._id || tenant.room) === room._id,
        ),
    );
  }, [editingTenantId, rooms, tenants]);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [tenantData, roomData] = await Promise.all([
        getTenants(),
        getRooms(),
      ]);
      setTenants(tenantData);
      setRooms(roomData);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingTenantId('');
    setIsFormOpen(false);
  }

  function startCreate() {
    setFormData(emptyForm);
    setEditingTenantId('');
    setCredential(null);
    setError('');
    setIsFormOpen(true);
  }

  function startEdit(tenant) {
    setEditingTenantId(tenant._id);
    setCredential(null);
    setFormData(toFormData(tenant));
    setError('');
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updateTenant(editingTenantId, toPayload(formData));
      } else {
        await createTenant(toPayload(formData));
      }

      resetForm();
      await loadData();
      showSuccess(text.saved);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(tenant) {
    const confirmed = window.confirm(text.confirmDelete(tenant.fullName));

    if (!confirmed) return;

    setError('');

    try {
      await deleteTenant(tenant._id);
      if (editingTenantId === tenant._id) resetForm();
      await loadData();
      showSuccess(text.deleted);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    }
  }

  async function handleResetPassword(tenant) {
    if (!tenant.user?._id) return;

    const confirmed = window.confirm(
      text.confirmResetPassword(tenant.fullName),
    );

    if (!confirmed) return;

    setError('');
    setResettingUserId(tenant.user._id);

    try {
      const data = await unlockUser(tenant.user._id);
      setCredential({
        tenantName: tenant.fullName,
        ...data,
      });
      await loadData();
      showSuccess(text.resetPasswordSuccess);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setResettingUserId('');
    }
  }

  return (
    <section>
      <div className="page-heading">
        <h1>{text.tenants}</h1>
        <div className="page-actions">
          <span className="page-summary">
            {tenants.length} {text.managed}
          </span>
          <button type="button" onClick={startCreate}>
            <Plus className="button-icon" size={16} strokeWidth={2.5} />
            {text.addTenant}
          </button>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadData}
          >
            <RefreshCw className="button-icon" size={16} strokeWidth={2.5} />
            {isLoading ? text.loading : text.reload}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      {credential ? (
        <div className="credential-panel account-credential-panel">
          <strong>{text.newCredentialTitle}</strong>
          <span>{credential.tenantName}</span>
          <span>
            {text.username}: {credential.user.username}
          </span>
          <span>Email: {credential.user.email}</span>
          <span>
            {text.tempPassword}: {credential.temporaryPassword}
          </span>
          <span>
            {text.passwordDeadline}:{' '}
            {formatDate(credential.user.temporaryPasswordExpiresAt, text)}
          </span>
          <small>{text.credentialNote}</small>
        </div>
      ) : null}

      <Modal
        isOpen={isFormOpen}
        title={isEditing ? text.updateTenant : text.addTenant}
        onClose={resetForm}
      >
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2>{isEditing ? text.updateTenant : text.addTenant}</h2>

          <label>
            {text.fullName}
            <input
              required
              value={formData.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
            />
          </label>

          <label>
            {text.phone}
            <input
              required
              value={formData.phone}
              onChange={(event) => updateField('phone', event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
          </label>

          <label>
            CCCD/CMND
            <input
              value={formData.identityNumber}
              onChange={(event) =>
                updateField('identityNumber', event.target.value)
              }
            />
          </label>

          <label>
            {text.room}
            <select
              value={formData.room}
              onChange={(event) => updateField('room', event.target.value)}
            >
              <option value="">{text.unassigned}</option>
              {availableRoomOptions.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} - {text.floorOption} {room.floor}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <button disabled={isSubmitting} type="submit">
              {isEditing ? (
                <Edit3 className="button-icon" size={16} strokeWidth={2.5} />
              ) : (
                <Plus className="button-icon" size={16} strokeWidth={2.5} />
              )}
              {isSubmitting ? text.saving : isEditing ? text.update : text.add}
            </button>
            {isEditing ? (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                <X className="button-icon" size={16} strokeWidth={2.5} />
                {text.cancel}
              </button>
            ) : null}
          </div>
        </form>
      </Modal>

      <div className="split-layout">
        <div className="table-panel">
          {isLoading ? <p>{text.loadingData}</p> : null}

          {!isLoading && tenants.length === 0 ? <p>{text.empty}</p> : null}

          {!isLoading && tenants.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.tenant}</th>
                  <th>{text.contact}</th>
                  <th>{text.room}</th>
                  <th>{text.account}</th>
                  <th>{text.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <strong>{tenant.fullName}</strong>
                      <span>{tenant.identityNumber || text.noId}</span>
                    </td>
                    <td>
                      <strong>{tenant.phone}</strong>
                      <span>{tenant.email || text.noEmail}</span>
                    </td>
                    <td>
                      {tenant.room ? (
                        <>
                          <strong>{tenant.room.name}</strong>
                          <span>
                            {text.floor} {tenant.room.floor}
                          </span>
                        </>
                      ) : (
                        <span>{text.unassigned}</span>
                      )}
                    </td>
                    <td>
                      <strong>{getAccountStatus(tenant, text)}</strong>
                      {tenant.user ? (
                        <span>{tenant.user.username || tenant.user.email}</span>
                      ) : null}
                    </td>
                    <td>
                      <div className="row-actions">
                        {tenant.user ? (
                          <button
                            className="secondary-button"
                            disabled={resettingUserId === tenant.user._id}
                            type="button"
                            onClick={() => handleResetPassword(tenant)}
                          >
                            <KeyRound
                              className="button-icon"
                              size={16}
                              strokeWidth={2.5}
                            />
                            {resettingUserId === tenant.user._id
                              ? text.saving
                              : text.resetPassword}
                          </button>
                        ) : null}
                        <button type="button" onClick={() => startEdit(tenant)}>
                          <Edit3
                            className="button-icon"
                            size={16}
                            strokeWidth={2.5}
                          />
                          {text.edit}
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => handleDelete(tenant)}
                        >
                          <Trash2
                            className="button-icon"
                            size={16}
                            strokeWidth={2.5}
                          />
                          {text.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </section>
  );
}
