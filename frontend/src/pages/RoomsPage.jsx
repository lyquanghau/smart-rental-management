import React, { useEffect, useState } from 'react';
import { Edit3, Eye, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import { Modal } from '../components/Modal.jsx';
import { RoomStatusBadge } from '../components/RoomStatusBadge.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { formatCurrency } from '../services/preferences.js';
import { formatMoneyInput, parseMoneyInput } from '../utils/moneyInput.js';
import {
  createRoom,
  deleteRoom,
  getRoom,
  getRooms,
  restoreRoom,
  updateRoom,
} from '../services/roomService.js';

const emptyForm = {
  name: '',
  floor: '',
  price: '',
  maxOccupants: '2',
  status: 'available',
};

const copy = {
  en: {
    add: 'Add',
    addRoom: 'Add room',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Delete room',
    confirmDelete: (name) =>
      `Delete room ${name}? The record will be hidden from the list.`,
    currentTenants: 'Current tenants',
    occupantIdentityNumber: 'ID number',
    occupantNote: 'Note',
    occupants: 'Occupants',
    representativeTenant: 'Representative tenant',
    details: 'Details',
    edit: 'Edit',
    delete: 'Delete',
    emptyAssigned: 'No active tenants assigned.',
    emptyList: 'No matching rooms.',
    fieldFloor: 'Floor',
    fieldMaxOccupants: 'Max occupants',
    fieldName: 'Room name',
    fieldPrice: 'Monthly rent',
    fieldStatus: 'Status',
    helpStatus:
      'Occupied status is synced automatically when an active tenant is assigned to the room.',
    loading: 'Loading...',
    loadingData: 'Loading data...',
    loadingDetails: 'Loading details...',
    month: 'month',
    pageTitle: 'Room list',
    people: 'people',
    reload: 'Reload',
    rent: 'Rent',
    room: 'Room',
    roomDetails: 'Room details',
    rooms: 'rooms',
    saving: 'Saving...',
    saved: 'Room saved.',
    deleted: 'Room deleted.',
    deleteScheduled: 'Room will be deleted.',
    restored: 'Room deletion undone.',
    restore: 'Restore',
    restoredRecord: 'Room restored.',
    undo: 'Undo',
    update: 'Update',
    updateRoom: 'Update room',
    statusOptions: [
      { value: '', label: 'All' },
      { value: 'available', label: 'Available' },
      { value: 'occupied', label: 'Occupied' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'deleted', label: 'Deleted' },
    ],
  },
  vi: {
    add: 'Thêm',
    addRoom: 'Thêm phòng',
    cancel: 'Hủy',
    confirmDeleteTitle: 'Xóa phòng',
    confirmDelete: (name) =>
      `Xóa phòng ${name}? Dữ liệu sẽ được ẩn khỏi danh sách.`,
    currentTenants: 'Khách hiện tại',
    occupantIdentityNumber: 'CCCD/CMND',
    occupantNote: 'Ghi chú',
    occupants: 'Người ở cùng',
    representativeTenant: 'Khách đại diện',
    details: 'Chi tiết',
    edit: 'Sửa',
    delete: 'Xóa',
    emptyAssigned: 'Chưa có khách thuê đang gán.',
    emptyList: 'Không có phòng phù hợp.',
    fieldFloor: 'Tầng',
    fieldMaxOccupants: 'Số người tối đa',
    fieldName: 'Tên phòng',
    fieldPrice: 'Giá thuê mỗi tháng',
    fieldStatus: 'Trạng thái',
    helpStatus:
      'Trạng thái đã thuê sẽ được đồng bộ tự động khi có khách thuê đang gán phòng.',
    loading: 'Đang tải...',
    loadingData: 'Đang tải dữ liệu...',
    loadingDetails: 'Đang tải chi tiết...',
    month: 'tháng',
    pageTitle: 'Danh sách phòng',
    people: 'người',
    reload: 'Tải lại',
    rent: 'Giá thuê',
    room: 'Phòng',
    roomDetails: 'Chi tiết phòng',
    rooms: 'phòng',
    saving: 'Đang lưu...',
    saved: 'Đã lưu thông tin phòng.',
    deleted: 'Đã xóa phòng.',
    deleteScheduled: 'Phòng sẽ được xóa.',
    restored: 'Đã hoàn tác xóa phòng.',
    restore: 'Khôi phục',
    restoredRecord: 'Đã khôi phục phòng.',
    undo: 'Hoàn tác',
    update: 'Cập nhật',
    updateRoom: 'Cập nhật phòng',
    statusOptions: [
      { value: '', label: 'Tất cả' },
      { value: 'available', label: 'Trống' },
      { value: 'occupied', label: 'Đã thuê' },
      { value: 'maintenance', label: 'Bảo trì' },
      { value: 'deleted', label: 'Đã xóa' },
    ],
  },
};

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
  return formatCurrency(value);
}

export function RoomsPage() {
  const { language } = usePreferences();
  const { confirm } = useConfirm();
  const { showError, showSuccess, showToast } = useToast();
  const text = copy[language] || copy.vi;
  const editableStatusOptions = text.statusOptions.filter(
    (option) => option.value,
  );
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingRoomId, setEditingRoomId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const isEditing = Boolean(editingRoomId);

  async function loadRooms() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getRooms({ includeDeleted: true });
      setRooms(data);

      if (selectedRoom) {
        const stillExists = data.some((room) => room._id === selectedRoom._id);
        if (!stillExists) {
          setSelectedRoom(null);
          setIsDetailOpen(false);
        }
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  const visibleRooms = statusFilter
    ? rooms.filter((room) =>
        statusFilter === 'deleted'
          ? Boolean(room.deletedAt)
          : !room.deletedAt && room.status === statusFilter,
      )
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
    setIsFormOpen(false);
  }

  function startCreate() {
    setFormData(emptyForm);
    setEditingRoomId('');
    setError('');
    setIsFormOpen(true);
  }

  function startEdit(room) {
    setEditingRoomId(room._id);
    setFormData(toFormData(room));
    setError('');
    setIsDetailOpen(false);
    setIsFormOpen(true);
  }

  function closeDetail() {
    setIsDetailOpen(false);
  }

  async function loadRoomDetail(roomId) {
    setIsDetailLoading(true);
    setIsDetailOpen(true);
    setSelectedRoom(null);
    setError('');

    try {
      const data = await getRoom(roomId);
      setSelectedRoom(data);
    } catch (err) {
      setError(err.message);
      showError(err.message);
      setIsDetailOpen(false);
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
      showSuccess(text.saved);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(room) {
    if (room.deletedAt) return;

    const confirmed = await confirm({
      confirmLabel: text.delete,
      message: text.confirmDelete(room.name),
      title: text.confirmDeleteTitle,
    });

    if (!confirmed) return;

    let isUndone = false;
    setError('');
    setRooms((currentRooms) =>
      currentRooms.filter((currentRoom) => currentRoom._id !== room._id),
    );
    if (editingRoomId === room._id) resetForm();
    if (selectedRoom?._id === room._id) {
      setSelectedRoom(null);
      setIsDetailOpen(false);
    }

    showToast({
      actionLabel: text.undo,
      message: text.confirmDelete(room.name),
      onAction: () => {
        isUndone = true;
        loadRooms();
        showSuccess(text.restored);
      },
      title: text.deleteScheduled,
      type: 'info',
    });

    window.setTimeout(async () => {
      if (isUndone) return;

      try {
        await deleteRoom(room._id);
        await loadRooms();
      } catch (err) {
        setError(err.message);
        showError(err.message);
        await loadRooms();
      }
    }, 5000);
  }

  async function handleRestore(room) {
    setError('');

    try {
      await restoreRoom(room._id);
      await loadRooms();
      showSuccess(text.restoredRecord);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    }
  }

  return (
    <section>
      <div className="page-heading compact-page-heading">
        <h1>{text.pageTitle}</h1>
        <div className="page-actions room-page-actions">
          <span className="page-summary">
            {rooms.length} {text.rooms}
          </span>
          <select
            className="compact-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {text.statusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={startCreate}>
            <Plus className="button-icon" size={16} strokeWidth={2.5} />
            {text.addRoom}
          </button>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadRooms}
          >
            <RefreshCw className="button-icon" size={16} strokeWidth={2.5} />
            {isLoading ? text.loading : text.reload}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <Modal
        isOpen={isFormOpen}
        title={isEditing ? text.updateRoom : text.addRoom}
        onClose={resetForm}
      >
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2>{isEditing ? text.updateRoom : text.addRoom}</h2>

          <label>
            {text.fieldName}
            <input
              required
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>

          <label>
            {text.fieldFloor}
            <input
              min="1"
              required
              type="number"
              value={formData.floor}
              onChange={(event) => updateField('floor', event.target.value)}
            />
          </label>

          <label>
            {text.fieldPrice}
            <input
              inputMode="numeric"
              required
              value={formatMoneyInput(formData.price)}
              onChange={(event) =>
                updateField('price', parseMoneyInput(event.target.value))
              }
            />
          </label>

          <label>
            {text.fieldMaxOccupants}
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
            {text.fieldStatus}
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
            <span className="field-help">{text.helpStatus}</span>
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

      <Modal
        isOpen={isDetailOpen}
        title={text.roomDetails}
        onClose={closeDetail}
      >
        {isDetailLoading ? (
          <p className="empty-note">{text.loadingDetails}</p>
        ) : null}

        {!isDetailLoading && selectedRoom ? (
          <div className="room-detail-modal">
            <div className="room-detail-hero">
              <div>
                <span className="eyebrow">{text.room}</span>
                <h2>{selectedRoom.name}</h2>
                <p>
                  {text.fieldFloor} {selectedRoom.floor} ·{' '}
                  {language === 'en' ? 'Up to' : 'Tối đa'}{' '}
                  {selectedRoom.maxOccupants || 2} {text.people}
                </p>
              </div>
              {selectedRoom.deletedAt ? (
                <span className="status status-deleted">
                  {text.statusOptions.find(
                    (option) => option.value === 'deleted',
                  )?.label || 'Deleted'}
                </span>
              ) : (
                <RoomStatusBadge status={selectedRoom.status} />
              )}
            </div>

            <div className="room-detail-stats">
              <div>
                <span>{text.rent}</span>
                <strong>
                  {formatMoney(selectedRoom.price)}/{text.month}
                </strong>
              </div>
              <div>
                <span>{text.currentTenants}</span>
                <strong>{selectedRoom.currentTenants?.length || 0}</strong>
              </div>
            </div>

            <section className="room-detail-section">
              <h3>{text.currentTenants}</h3>
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
                <p className="empty-note">{text.emptyAssigned}</p>
              )}
            </section>

            {selectedRoom.activeContract ? (
              <section className="room-detail-section">
                <h3>{text.occupants}</h3>
                <ul className="detail-list">
                  <li>
                    <strong>{text.representativeTenant}</strong>
                    <span>
                      {selectedRoom.activeContract.tenant?.fullName ||
                        text.emptyAssigned}
                    </span>
                  </li>
                  <li>
                    <strong>So xe</strong>
                    <span>
                      {Number(selectedRoom.activeContract.vehicleCount || 0)}
                    </span>
                  </li>
                  {selectedRoom.activeContract.occupants?.map(
                    (occupant, index) => (
                      <li key={`${occupant.fullName}-${index}`}>
                        <strong>{occupant.fullName}</strong>
                        <span>
                          {[
                            occupant.phone,
                            occupant.identityNumber
                              ? `${text.occupantIdentityNumber}: ${occupant.identityNumber}`
                              : '',
                            occupant.note
                              ? `${text.occupantNote}: ${occupant.note}`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </section>
            ) : null}

            <div className="modal-footer-actions">
              {selectedRoom.deletedAt ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleRestore(selectedRoom)}
                >
                  {text.restore}
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(selectedRoom)}>
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
                    onClick={() => handleDelete(selectedRoom)}
                  >
                    <Trash2
                      className="button-icon"
                      size={16}
                      strokeWidth={2.5}
                    />
                    {text.delete}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <div className="split-layout">
        <div className="room-management-panel rooms-only-panel">
          {isLoading ? <p>{text.loadingData}</p> : null}

          {!isLoading && !error && visibleRooms.length === 0 ? (
            <p>{text.emptyList}</p>
          ) : null}

          {!error && visibleRooms.length > 0 ? (
            <div className="room-grid">
              {visibleRooms.map((room) => (
                <article
                  className={`room-card ${room.deletedAt ? 'deleted-record' : ''}`}
                  key={room._id}
                >
                  <div className="room-card-header">
                    <div>
                      <span className="eyebrow">{text.room}</span>
                      <h2>{room.name}</h2>
                    </div>
                    {room.deletedAt ? (
                      <span className="status status-deleted">
                        {text.statusOptions.find(
                          (option) => option.value === 'deleted',
                        )?.label || 'Deleted'}
                      </span>
                    ) : (
                      <RoomStatusBadge status={room.status} />
                    )}
                  </div>
                  <div className="room-card-price">
                    <strong>{formatMoney(room.price)}</strong>
                    <span>/{text.month}</span>
                  </div>
                  <div className="room-card-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => loadRoomDetail(room._id)}
                    >
                      <Eye
                        className="button-icon"
                        size={16}
                        strokeWidth={2.5}
                      />
                      {text.details}
                    </button>
                    {room.deletedAt ? (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleRestore(room)}
                      >
                        {text.restore}
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(room)}>
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
                          onClick={() => handleDelete(room)}
                        >
                          <Trash2
                            className="button-icon"
                            size={16}
                            strokeWidth={2.5}
                          />
                          {text.delete}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
