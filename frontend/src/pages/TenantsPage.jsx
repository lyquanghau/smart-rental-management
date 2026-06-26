import { useEffect, useMemo, useState } from 'react';
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
    email: formData.email.trim(),
    identityNumber: formData.identityNumber.trim(),
    room: formData.room || undefined,
  };
}

export function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTenantId, setEditingTenantId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }

  function startEdit(tenant) {
    setEditingTenantId(tenant._id);
    setFormData(toFormData(tenant));
    setError('');
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
    const confirmed = window.confirm(
      `Xóa khách thuê ${tenant.fullName}? Dữ liệu sẽ được ẩn khỏi danh sách.`,
    );

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
        <h1>Khách thuê</h1>
        <span className="page-summary">
          {tenants.length} khách đang quản lý
        </span>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="split-layout">
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2>{isEditing ? 'Cập nhật khách thuê' : 'Thêm khách thuê'}</h2>

          <label>
            Họ tên
            <input
              required
              value={formData.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
            />
          </label>

          <label>
            Số điện thoại
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
            Phòng
            <select
              value={formData.room}
              onChange={(event) => updateField('room', event.target.value)}
            >
              <option value="">Chưa gán phòng</option>
              {availableRoomOptions.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} - tầng {room.floor}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm'}
            </button>
            {isEditing ? (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                Hủy
              </button>
            ) : null}
          </div>
        </form>

        <div className="table-panel">
          {isLoading ? <p>Đang tải dữ liệu...</p> : null}

          {!isLoading && tenants.length === 0 ? (
            <p>Chưa có khách thuê nào.</p>
          ) : null}

          {!isLoading && tenants.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Khách thuê</th>
                  <th>Liên hệ</th>
                  <th>Phòng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <strong>{tenant.fullName}</strong>
                      <span>
                        {tenant.identityNumber || 'Chưa có CCCD/CMND'}
                      </span>
                    </td>
                    <td>
                      <strong>{tenant.phone}</strong>
                      <span>{tenant.email || 'Chưa có email'}</span>
                    </td>
                    <td>
                      {tenant.room ? (
                        <>
                          <strong>{tenant.room.name}</strong>
                          <span>Tầng {tenant.room.floor}</span>
                        </>
                      ) : (
                        <span>Chưa gán phòng</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => startEdit(tenant)}>
                          Sửa
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => handleDelete(tenant)}
                        >
                          Xóa
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
