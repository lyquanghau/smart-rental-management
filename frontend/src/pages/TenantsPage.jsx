import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Modal } from '../components/Modal.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
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
    tenant: 'Khách thuê',
    tenants: 'Khách thuê',
    unassigned: 'Chưa gán phòng',
    update: 'Cập nhật',
    updateTenant: 'Cập nhật khách thuê',
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

export function TenantsPage() {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTenantId, setEditingTenantId] = useState('');
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
    setError('');
    setIsFormOpen(true);
  }

  function startEdit(tenant) {
    setEditingTenantId(tenant._id);
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
    } catch (err) {
      setError(err.message);
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
    } catch (err) {
      setError(err.message);
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
                      <div className="row-actions">
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
