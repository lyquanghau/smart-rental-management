import React, { useEffect, useState } from 'react';
import { RoomStatusBadge } from '../components/RoomStatusBadge.jsx';
import {
  createRoom,
  deleteRoom,
  getRoom,
  getRooms,
  updateRoom,
} from '../services/roomService.js';

const emptyForm = {
  name: '',
  floor: '',
  price: '',
  maxOccupants: '2',
  status: 'available',
};

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'available', label: 'Trống' },
  { value: 'occupied', label: 'Đã thuê' },
  { value: 'maintenance', label: 'Bảo trì' },
];

const editableStatusOptions = statusOptions.filter((option) => option.value);

function toFormData(room) {
  return {
    name: room.name || '',
    floor: String(room.floor ?? ''),
    price: String(room.price ?? ''),
    maxOccupants: String(room.maxOccupants ?? 2),
    status: room.status || 'available',
  };
}

function toPayload(formData) {
  return {
    name: formData.name.trim(),
    floor: Number(formData.floor),
    price: Number(formData.price),
    maxOccupants: Number(formData.maxOccupants || 2),
    status: formData.status,
  };
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingRoomId, setEditingRoomId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const isEditing = Boolean(editingRoomId);

  async function loadRooms() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getRooms();
      setRooms(data);

      if (selectedRoom) {
        const stillExists = data.some((room) => room._id === selectedRoom._id);
        if (!stillExists) setSelectedRoom(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  const visibleRooms = statusFilter
    ? rooms.filter((room) => room.status === statusFilter)
    : rooms;

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingRoomId('');
  }

  function startEdit(room) {
    setEditingRoomId(room._id);
    setFormData(toFormData(room));
    setError('');
  }

  async function loadRoomDetail(roomId) {
    setIsDetailLoading(true);
    setError('');

    try {
      const data = await getRoom(roomId);
      setSelectedRoom(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updateRoom(editingRoomId, toPayload(formData));
      } else {
        await createRoom(toPayload(formData));
      }

      resetForm();
      await loadRooms();
      if (selectedRoom) await loadRoomDetail(selectedRoom._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(room) {
    const confirmed = window.confirm(
      `Xóa phòng ${room.name}? Dữ liệu sẽ được ẩn khỏi danh sách.`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await deleteRoom(room._id);
      if (editingRoomId === room._id) resetForm();
      if (selectedRoom?._id === room._id) setSelectedRoom(null);
      await loadRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <h1>Danh sách phòng</h1>
        <div className="page-actions">
          <span className="page-summary">
            {rooms.length} phòng đang quản lý
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadRooms}
          >
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="split-layout">
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2>{isEditing ? 'Cập nhật phòng' : 'Thêm phòng'}</h2>

          <label>
            Tên phòng
            <input
              required
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>

          <label>
            Tầng
            <input
              min="1"
              required
              type="number"
              value={formData.floor}
              onChange={(event) => updateField('floor', event.target.value)}
            />
          </label>

          <label>
            Giá thuê mỗi tháng
            <input
              min="0"
              required
              type="number"
              value={formData.price}
              onChange={(event) => updateField('price', event.target.value)}
            />
          </label>

          <label>
            Số người tối đa
            <input
              min="1"
              required
              type="number"
              value={formData.maxOccupants}
              onChange={(event) =>
                updateField('maxOccupants', event.target.value)
              }
            />
          </label>

          <label>
            Trạng thái
            <select
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {editableStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">
              Trạng thái đã thuê sẽ được đồng bộ tự động khi có khách thuê đang
              gán phòng.
            </span>
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

        <div className="room-management-panel">
          {isLoading ? <p>Đang tải dữ liệu...</p> : null}

          {!isLoading && !error && visibleRooms.length === 0 ? (
            <p>Không có phòng phù hợp.</p>
          ) : null}

          {!error && visibleRooms.length > 0 ? (
            <div className="room-grid">
              {visibleRooms.map((room) => (
                <article className="room-card" key={room._id}>
                  <div>
                    <h2>{room.name}</h2>
                    <p>Tầng {room.floor}</p>
                    <p>Tối đa {room.maxOccupants || 2} người</p>
                  </div>
                  <RoomStatusBadge status={room.status} />
                  <strong>{formatMoney(room.price)}đ/tháng</strong>
                  <div className="row-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => loadRoomDetail(room._id)}
                    >
                      Chi tiết
                    </button>
                    <button type="button" onClick={() => startEdit(room)}>
                      Sửa
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => handleDelete(room)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <section className="detail-panel">
            <h2>Chi tiết phòng</h2>
            {isDetailLoading ? <p>Đang tải chi tiết...</p> : null}
            {!isDetailLoading && !selectedRoom ? (
              <p className="empty-note">Chọn một phòng để xem khách thuê.</p>
            ) : null}
            {!isDetailLoading && selectedRoom ? (
              <div className="detail-content">
                <div>
                  <strong>{selectedRoom.name}</strong>
                  <span>
                    Tầng {selectedRoom.floor} · Tối đa{' '}
                    {selectedRoom.maxOccupants || 2} người
                  </span>
                  <span>{formatMoney(selectedRoom.price)}đ/tháng</span>
                </div>
                <RoomStatusBadge status={selectedRoom.status} />

                <div>
                  <h3>Khách thuê hiện tại</h3>
                  {selectedRoom.currentTenants?.length > 0 ? (
                    <ul className="detail-list">
                      {selectedRoom.currentTenants.map((tenant) => (
                        <li key={tenant._id}>
                          <strong>{tenant.fullName}</strong>
                          <span>
                            {tenant.phone}
                            {tenant.email ? ` · ${tenant.email}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-note">Chưa có khách thuê đang gán.</p>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
