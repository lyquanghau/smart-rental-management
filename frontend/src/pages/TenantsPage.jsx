import React, { useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  Edit3,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { unlockUser } from '../services/authService.js';
import { getContracts } from '../services/contractService.js';
import { getRooms } from '../services/roomService.js';
import {
  createTenant,
  deleteTenant,
  getTenants,
  restoreTenant,
  updateTenant,
} from '../services/tenantService.js';

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  identityNumber: '',
  dateOfBirth: '',
  permanentAddress: '',
  room: '',
};

const copy = {
  en: {
    add: 'Add',
    addTenant: 'Add tenant',
    actions: 'Actions',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Delete tenant',
    confirmResetPasswordTitle: 'Reset password',
    confirmDelete: (name) =>
      `Delete tenant ${name}? The record will be hidden from the list.`,
    contact: 'Contact',
    close: 'Close',
    delete: 'Delete',
    deletedTenants: 'Deleted tenants',
    edit: 'Edit',
    empty: 'No tenants yet.',
    floor: 'Floor',
    floorOption: 'floor',
    dateOfBirth: 'Date of birth',
    fullName: 'Full name',
    loading: 'Loading...',
    loadingData: 'Loading data...',
    managed: 'managed tenants',
    noEmail: 'No email',
    noId: 'No ID number',
    noOccupants: 'No additional occupants',
    phone: 'Phone number',
    permanentAddress: 'Permanent address',
    reload: 'Reload',
    room: 'Room',
    roomOccupants: 'Room occupants',
    saving: 'Saving...',
    saved: 'Tenant saved.',
    deleted: 'Tenant deleted.',
    deleteScheduled: 'Tenant will be deleted.',
    restored: 'Tenant deletion undone.',
    deletedStatus: 'Deleted',
    restore: 'Restore',
    restoredRecord: 'Tenant restored.',
    representativeTenant: 'Representative tenant',
    showDeletedTenants: 'Deleted tenants',
    tenant: 'Tenant',
    tenants: 'Tenants',
    unassigned: 'Unassigned',
    undo: 'Undo',
    update: 'Update',
    updateTenant: 'Update tenant',
  },
  vi: {
    add: 'Thêm',
    addTenant: 'Thêm khách',
    actions: 'Thao tác',
    cancel: 'Hủy',
    confirmDeleteTitle: 'Xóa khách thuê',
    confirmResetPasswordTitle: 'Cấp lại mật khẩu',
    confirmDelete: (name) =>
      `Xóa khách thuê ${name}? Dữ liệu sẽ được ẩn khỏi danh sách.`,
    contact: 'Liên hệ',
    delete: 'Xóa',
    edit: 'Sửa',
    empty: 'Chưa có khách thuê nào.',
    floor: 'Tầng',
    floorOption: 'tầng',
    dateOfBirth: 'Ngày sinh',
    fullName: 'Họ tên',
    loading: 'Đang tải...',
    loadingData: 'Đang tải dữ liệu...',
    managed: 'khách đang quản lý',
    noEmail: 'Chưa có email',
    noId: 'Chưa có CCCD/CMND',
    phone: 'Số điện thoại',
    permanentAddress: 'Địa chỉ thường trú',
    reload: 'Tải lại',
    room: 'Phòng',
    saving: 'Đang lưu...',
    saved: 'Đã lưu thông tin khách thuê.',
    deleted: 'Đã xóa khách thuê.',
    deleteScheduled: 'Khách thuê sẽ được xóa.',
    restored: 'Đã hoàn tác xóa khách thuê.',
    deletedStatus: 'Đã xóa',
    restore: 'Khôi phục',
    restoredRecord: 'Đã khôi phục khách thuê.',
    tenant: 'Khách thuê',
    tenants: 'Khách thuê',
    unassigned: 'Chưa gán phòng',
    undo: 'Hoàn tác',
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
      `Send a temporary login password to ${name}? The password will be emailed to the tenant.`,
    credentialNote:
      'The tenant must use the login information sent to their email.',
    newCredentialTitle: 'Login information emailed to tenant',
    resetPassword: 'Send temporary password',
    resetPasswordSuccess: 'Temporary password email sent.',
    emailSent: 'Credentials email sent.',
    emailSkipped: 'SMTP is not configured. No password was sent.',
    emailFailed: 'Credentials email failed. No password was sent.',
    tempPassword: 'Temporary password',
  },
  vi: {
    account: 'Tài khoản',
    accountActive: 'Đang hoạt động',
    accountLocked: 'Đang bị khóa',
    accountNoLogin: 'Chưa có tài khoản',
    accountTemporary: 'Mật khẩu tạm',
    confirmResetPassword: (name) =>
      `Gửi mật khẩu tạm cho ${name}? Mật khẩu sẽ được gửi qua email khách thuê.`,
    credentialNote: 'Khách thuê sử dụng thông tin đăng nhập đã gửi về email.',
    newCredentialTitle: 'Đã gửi thông tin đăng nhập qua email',
    resetPassword: 'Gửi mật khẩu tạm',
    resetPasswordSuccess: 'Đã gửi email cấp lại mật khẩu.',
    emailSent: 'Đã gửi email thông tin đăng nhập.',
    emailSkipped: 'Chưa cấu hình SMTP. Mật khẩu chưa được gửi.',
    emailFailed: 'Gửi email thất bại. Mật khẩu chưa được gửi.',
    tempPassword: 'Mật khẩu tạm',
  },
};

function toFormData(tenant) {
  return {
    fullName: tenant.fullName || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    identityNumber: tenant.identityNumber || '',
    dateOfBirth: tenant.dateOfBirth
      ? new Date(tenant.dateOfBirth).toISOString().slice(0, 10)
      : '',
    permanentAddress: tenant.permanentAddress || '',
    room: tenant.room?._id || tenant.room || '',
  };
}

function toPayload(formData) {
  return {
    fullName: formData.fullName.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim() || null,
    identityNumber: formData.identityNumber.trim() || null,
    dateOfBirth: formData.dateOfBirth || null,
    permanentAddress: formData.permanentAddress.trim() || null,
    room: formData.room || null,
  };
}

function getAccountStatus(tenant, text) {
  if (!tenant.user) return text.accountNoLogin;
  if (!tenant.user.isActive) return text.accountLocked;
  if (tenant.user.mustChangePassword) return text.accountTemporary;
  return text.accountActive;
}

export function TenantsPage() {
  const { language } = usePreferences();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { showError, showSuccess, showToast } = useToast();
  const text = {
    ...(copy[language] || copy.vi),
    ...(accountCopy[language] || accountCopy.vi),
  };
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTenantId, setEditingTenantId] = useState('');
  const [credential, setCredential] = useState(null);
  const [resettingUserId, setResettingUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isEditing = Boolean(editingTenantId);

  const activeTenants = useMemo(
    () => tenants.filter((tenant) => !tenant.deletedAt),
    [tenants],
  );

  const deletedTenants = useMemo(
    () => tenants.filter((tenant) => tenant.deletedAt),
    [tenants],
  );

  const tenantRows = useMemo(() => {
    const activeTenantMap = new Map(
      activeTenants.map((tenant) => [tenant._id, tenant]),
    );
    const representedTenantIds = new Set();
    const activeContractRows = contracts
      .filter((contract) => contract.status === 'active' && !contract.deletedAt)
      .map((contract) => {
        const tenantId = contract.tenant?._id || contract.tenant;
        const representative = activeTenantMap.get(tenantId) || contract.tenant;

        if (tenantId) representedTenantIds.add(tenantId);

        return {
          contract,
          key: contract._id,
          occupants: contract.occupants || [],
          room: contract.room,
          tenant: representative,
        };
      })
      .filter((row) => row.tenant);

    const unassignedRows = activeTenants
      .filter((tenant) => !representedTenantIds.has(tenant._id))
      .map((tenant) => ({
        contract: null,
        key: tenant._id,
        occupants: [],
        room: tenant.room,
        tenant,
      }));

    return [...activeContractRows, ...unassignedRows];
  }, [activeTenants, contracts]);

  const availableRoomOptions = useMemo(() => {
    return rooms.filter(
      (room) =>
        (!room.deletedAt && room.status !== 'maintenance') ||
        activeTenants.some(
          (tenant) =>
            tenant._id === editingTenantId &&
            (tenant.room?._id || tenant.room) === room._id,
        ),
    );
  }, [activeTenants, editingTenantId, rooms]);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [tenantData, roomData, contractData] = await Promise.all([
        getTenants({ includeDeleted: true }),
        getRooms({ includeDeleted: true }),
        getContracts(),
      ]);
      setTenants(tenantData);
      setRooms(roomData);
      setContracts(contractData);
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
    setCredential(null);

    try {
      let savedTenant;

      if (isEditing) {
        savedTenant = await updateTenant(editingTenantId, toPayload(formData));
      } else {
        savedTenant = await createTenant(toPayload(formData));
      }

      if (savedTenant?.loginAccount) {
        setCredential({
          emailDelivery: savedTenant.loginAccount.emailDelivery,
          user: savedTenant.loginAccount.user,
        });
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
    if (tenant.deletedAt) return;

    const confirmed = await confirm({
      confirmLabel: text.delete,
      message: text.confirmDelete(tenant.fullName),
      title: text.confirmDeleteTitle,
    });

    if (!confirmed) return;

    let isUndone = false;
    setError('');
    setTenants((currentTenants) =>
      currentTenants.filter(
        (currentTenant) => currentTenant._id !== tenant._id,
      ),
    );
    if (editingTenantId === tenant._id) resetForm();

    showToast({
      actionLabel: text.undo,
      message: text.confirmDelete(tenant.fullName),
      onAction: () => {
        isUndone = true;
        loadData();
        showSuccess(text.restored);
      },
      title: text.deleteScheduled,
      type: 'info',
    });

    window.setTimeout(async () => {
      if (isUndone) return;

      try {
        await deleteTenant(tenant._id);
        await loadData();
      } catch (err) {
        setError(err.message);
        showError(err.message);
        await loadData();
      }
    }, 5000);
  }

  async function handleRestore(tenant) {
    setError('');

    try {
      const restoredTenant = await restoreTenant(tenant._id);
      await loadData();
      showSuccess(text.restoredRecord);
      setIsDeletedModalOpen(false);
      navigate('/contracts', {
        state: {
          createContractForTenant: {
            roomId: restoredTenant.room?._id || restoredTenant.room || '',
            tenantId: restoredTenant._id,
          },
        },
      });
    } catch (err) {
      setError(err.message);
      showError(err.message);
    }
  }

  async function handleResetPassword(tenant) {
    if (!tenant.user?._id) return;

    const confirmed = await confirm({
      confirmLabel: text.resetPassword,
      message: text.confirmResetPassword(tenant.fullName),
      title: text.confirmResetPasswordTitle,
    });

    if (!confirmed) return;

    setError('');
    setResettingUserId(tenant.user._id);
    setCredential(null);

    try {
      const data = await unlockUser(tenant.user._id);
      setCredential({
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
            {activeTenants.length} {text.managed}
          </span>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setIsDeletedModalOpen(true)}
          >
            <ArchiveRestore
              className="button-icon"
              size={16}
              strokeWidth={2.5}
            />
            {text.showDeletedTenants || 'Khach da xoa'} ({deletedTenants.length}
            )
          </button>
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
          {credential.emailDelivery ? (
            <small>
              {credential.emailDelivery.sent
                ? text.emailSent
                : credential.emailDelivery.skipped
                  ? text.emailSkipped
                  : text.emailFailed}
            </small>
          ) : null}
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
              required={Boolean(formData.room)}
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
            {text.dateOfBirth}
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(event) =>
                updateField('dateOfBirth', event.target.value)
              }
            />
          </label>

          <label>
            {text.permanentAddress}
            <input
              value={formData.permanentAddress}
              onChange={(event) =>
                updateField('permanentAddress', event.target.value)
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

      <Modal
        isOpen={isDeletedModalOpen}
        panelClassName="deleted-tenants-modal"
        title={text.deletedTenants || 'Khach thue da xoa'}
        onClose={() => setIsDeletedModalOpen(false)}
      >
        <div className="table-panel compact-data-table modal-table-panel">
          {deletedTenants.length === 0 ? <p>{text.empty}</p> : null}

          {deletedTenants.length > 0 ? (
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
                {deletedTenants.map((tenant) => (
                  <tr className="deleted-record" key={tenant._id}>
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
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleRestore(tenant)}
                      >
                        {text.restore}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </Modal>

      <div className="split-layout">
        <div className="table-panel">
          {isLoading ? <p>{text.loadingData}</p> : null}

          {!isLoading && tenantRows.length === 0 ? <p>{text.empty}</p> : null}

          {!isLoading && tenantRows.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.room}</th>
                  <th>{text.representativeTenant || text.tenant}</th>
                  <th>{text.roomOccupants || 'Nguoi trong phong'}</th>
                  <th>{text.contact}</th>
                  <th>{text.account}</th>
                  <th>{text.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tenantRows.map((row) => {
                  const { contract, occupants, room, tenant } = row;
                  const occupantTotal = occupants.length + 1;

                  return (
                    <tr key={row.key}>
                      <td>
                        {room ? (
                          <>
                            <strong>{room.name}</strong>
                            <span>
                              {text.floor} {room.floor}
                            </span>
                          </>
                        ) : (
                          <span>{text.unassigned}</span>
                        )}
                      </td>
                      <td>
                        <strong>{tenant.fullName}</strong>
                        <span>{tenant.identityNumber || text.noId}</span>
                        {contract ? (
                          <>
                            <span>
                              <Users
                                className="inline-icon"
                                size={14}
                                strokeWidth={2.5}
                              />{' '}
                              {occupantTotal}{' '}
                              {text.roomOccupants || text.tenants}
                            </span>
                            <span>
                              So xe: {Number(contract.vehicleCount || 0)}
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td>
                        {occupants.length > 0 ? (
                          <div className="stacked-list">
                            {occupants.map((occupant, index) => (
                              <span key={`${row.key}-occupant-${index}`}>
                                <strong>{occupant.fullName}</strong>
                                {occupant.phone ? ` - ${occupant.phone}` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>
                            {text.noOccupants || 'Khong co nguoi o cung'}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{tenant.phone}</strong>
                        <span>{tenant.email || text.noEmail}</span>
                      </td>
                      <td>
                        <strong>{getAccountStatus(tenant, text)}</strong>
                        {tenant.user ? (
                          <span>
                            {tenant.user.username || tenant.user.email}
                          </span>
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
                          <button
                            type="button"
                            onClick={() => startEdit(tenant)}
                          >
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
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </section>
  );
}
