import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Eye,
  FilePlus2,
  RefreshCw,
  StopCircle,
  X,
} from 'lucide-react';
import { Modal } from '../components/Modal.jsx';
import {
  createContract,
  deleteContract,
  downloadContractPdf,
  getContracts,
  updateContract,
} from '../services/contractService.js';
import { usePreferences } from '../hooks/usePreferences.js';
import { formatCurrency } from '../services/preferences.js';
import { getRooms } from '../services/roomService.js';
import { getTenants } from '../services/tenantService.js';

const emptyForm = {
  room: '',
  tenant: '',
  startDate: '',
  durationMonths: '12',
  endDate: '',
  monthlyPrice: '',
  depositMonths: '1',
  status: 'active',
};

const copy = {
  en: {
    activeHelp: 'Active: in use. Ended/cancelled: view only.',
    add: 'Add',
    addContract: 'Add contract',
    actions: 'Actions',
    cancel: 'Cancel',
    capacityHelp: 'Select a room to view capacity.',
    confirmEnd: (name) => `End the contract for ${name || 'this tenant'}?`,
    contract: 'Contract',
    contracts: 'Contracts',
    deposit: 'Deposit',
    download: 'Download PDF',
    depositAmount: (amount) => `Deposit amount: ${amount}.`,
    downloadLoading: 'Loading',
    end: 'End',
    endDateHelp: (date) => `End date is calculated as ${date || 'not set'}.`,
    edit: 'Edit',
    financials: 'Financials',
    loading: 'Loading...',
    loadingData: 'Loading data...',
    managed: 'managed contracts',
    month: 'month',
    monthlyRent: 'Monthly rent',
    noContract: 'No contracts yet.',
    noRoom: 'No room',
    noTenant: 'No tenant',
    notAvailable: 'Not available',
    people: 'people',
    priceHelp: (price) =>
      `Listed price${price ? `: ${price}.` : '.'} This is the final contract price.`,
    reload: 'Reload',
    room: 'Room',
    saving: 'Saving...',
    tempAccountTitle: 'New tenant account created',
    tempPassword: 'Temporary password',
    passwordDeadline: 'Password change deadline',
    username: 'Username',
    selectRoom: 'Select room',
    selectTenant: 'Select tenant',
    startDate: 'Start date',
    status: 'Status',
    tenant: 'Tenant',
    term: 'Term',
    to: 'To',
    update: 'Update',
    updateContract: 'Update contract',
    upTo: 'Up to',
    view: 'View',
    viewContract: 'View contract',
    viewPdf: 'Preview contract PDF',
    durationOptions: [
      { value: '3', label: '3 months' },
      { value: '6', label: '6 months' },
      { value: '12', label: '12 months' },
      { value: '24', label: '24 months' },
    ],
    depositOptions: [
      { value: '1', label: '1 month' },
      { value: '2', label: '2 months' },
      { value: '3', label: '3 months' },
    ],
    statusOptions: [
      { value: 'active', label: 'Active' },
      { value: 'ended', label: 'Ended' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  vi: {
    activeHelp: 'Đang hiệu lực: còn dùng. Kết thúc/hủy: chỉ xem.',
    add: 'Thêm',
    addContract: 'Thêm hợp đồng',
    actions: 'Thao tác',
    cancel: 'Hủy',
    capacityHelp: 'Chọn phòng để xem sức chứa.',
    confirmEnd: (name) => `Kết thúc hợp đồng của ${name || 'khách thuê này'}?`,
    contract: 'Hợp đồng',
    contracts: 'Hợp đồng',
    deposit: 'Tiền cọc',
    download: 'Tải PDF',
    depositAmount: (amount) => `Số tiền cọc: ${amount}.`,
    downloadLoading: 'Đang tải',
    end: 'Kết thúc',
    endDateHelp: (date) => `Ngày kết thúc tự tính là ${date || 'chưa có'}.`,
    edit: 'Sửa',
    financials: 'Tài chính',
    loading: 'Đang tải...',
    loadingData: 'Đang tải dữ liệu...',
    managed: 'hợp đồng đang quản lý',
    month: 'tháng',
    monthlyRent: 'Giá thuê mỗi tháng',
    noContract: 'Chưa có hợp đồng nào.',
    noRoom: 'Chưa có phòng',
    noTenant: 'Chưa có khách thuê',
    notAvailable: 'Chưa có',
    people: 'người',
    priceHelp: (price) =>
      `Giá niêm yết${price ? `: ${price}.` : '.'} Đây là giá chốt trong hợp đồng.`,
    reload: 'Tải lại',
    room: 'Phòng',
    saving: 'Đang lưu...',
    tempAccountTitle: 'Tài khoản khách thuê vừa tạo',
    tempPassword: 'Mật khẩu tạm',
    passwordDeadline: 'Hạn đổi mật khẩu',
    username: 'Tên đăng nhập',
    selectRoom: 'Chọn phòng',
    selectTenant: 'Chọn khách thuê',
    startDate: 'Ngày bắt đầu',
    status: 'Trạng thái',
    tenant: 'Khách thuê',
    term: 'Thời hạn',
    to: 'Đến',
    update: 'Cập nhật',
    updateContract: 'Cập nhật hợp đồng',
    upTo: 'Tối đa',
    view: 'Xem',
    viewContract: 'Xem hợp đồng',
    viewPdf: 'Xem trước file PDF hợp đồng',
    durationOptions: [
      { value: '3', label: '3 tháng' },
      { value: '6', label: '6 tháng' },
      { value: '12', label: '12 tháng' },
      { value: '24', label: '24 tháng' },
    ],
    depositOptions: [
      { value: '1', label: '1 tháng' },
      { value: '2', label: '2 tháng' },
      { value: '3', label: '3 tháng' },
    ],
    statusOptions: [
      { value: 'active', label: 'Đang hiệu lực' },
      { value: 'ended', label: 'Đã kết thúc' },
      { value: 'cancelled', label: 'Đã hủy' },
    ],
  },
};

function formatDate(value, text) {
  if (!value) return text.notAvailable;
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatLocalDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addMonthsToDateInput(dateInput, months) {
  if (!dateInput || !months) return '';

  const [year, month, day] = dateInput.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + Number(months));

  return formatLocalDateInput(date);
}

function formatMoney(value) {
  return formatCurrency(value);
}

function getStatusLabel(status, text) {
  return (
    text.statusOptions.find((option) => option.value === status)?.label ||
    status
  );
}

function getContractLabel(contract, text) {
  const roomName = contract?.room?.name || text.noRoom;
  const tenantName = contract?.tenant?.fullName || text.noTenant;

  return `${roomName} - ${tenantName}`;
}

function getDurationMonths(startDate, endDate) {
  if (!startDate || !endDate) return '12';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth();
  const value = String(months);

  return ['3', '6', '12', '24'].includes(value) ? value : '12';
}

function getDepositMonths(deposit, monthlyPrice) {
  if (!deposit || !monthlyPrice) return '1';

  const months = String(Math.round(Number(deposit) / Number(monthlyPrice)));

  return ['1', '2', '3'].includes(months) ? months : '1';
}

function toFormData(contract) {
  const startDate = formatDateInput(contract.startDate);
  const endDate = formatDateInput(contract.endDate);

  return {
    room: contract.room?._id || contract.room || '',
    tenant: contract.tenant?._id || contract.tenant || '',
    startDate,
    durationMonths: getDurationMonths(startDate, endDate),
    endDate,
    monthlyPrice: String(contract.monthlyPrice ?? ''),
    depositMonths: getDepositMonths(contract.deposit, contract.monthlyPrice),
    status: contract.status || 'active',
  };
}

function toPayload(formData) {
  const monthlyPrice = Number(formData.monthlyPrice);

  return {
    room: formData.room,
    tenant: formData.tenant,
    startDate: formData.startDate,
    endDate:
      formData.endDate ||
      addMonthsToDateInput(formData.startDate, formData.durationMonths),
    monthlyPrice,
    deposit: monthlyPrice * Number(formData.depositMonths || 1),
    status: formData.status,
  };
}

export function ContractsPage() {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingContractId, setEditingContractId] = useState('');
  const [viewingContractId, setViewingContractId] = useState('');
  const [temporaryAccount, setTemporaryAccount] = useState(null);
  const [error, setError] = useState('');
  const [downloadingContractId, setDownloadingContractId] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isEditing = Boolean(editingContractId);
  const isViewing = Boolean(viewingContractId);

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) window.URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  const roomOptions = useMemo(() => {
    return rooms.filter((room) => room.status !== 'maintenance');
  }, [rooms]);

  const selectedRoom = useMemo(() => {
    return rooms.find((room) => room._id === formData.room);
  }, [formData.room, rooms]);

  const calculatedEndDate = useMemo(() => {
    return addMonthsToDateInput(formData.startDate, formData.durationMonths);
  }, [formData.durationMonths, formData.startDate]);

  const calculatedDeposit = useMemo(() => {
    return Number(formData.monthlyPrice || 0) * Number(formData.depositMonths);
  }, [formData.depositMonths, formData.monthlyPrice]);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [contractData, roomData, tenantData] = await Promise.all([
        getContracts(),
        getRooms(),
        getTenants(),
      ]);
      setContracts(contractData);
      setRooms(roomData);
      setTenants(tenantData);
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
      endDate:
        field === 'startDate' || field === 'durationMonths'
          ? addMonthsToDateInput(
              field === 'startDate' ? value : current.startDate,
              field === 'durationMonths' ? value : current.durationMonths,
            )
          : current.endDate,
    }));
  }

  function updateRoom(roomId) {
    const room = rooms.find((item) => item._id === roomId);

    setFormData((current) => ({
      ...current,
      room: roomId,
      monthlyPrice: room ? String(room.price) : current.monthlyPrice,
    }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingContractId('');
    setViewingContractId('');
    setIsFormOpen(false);
  }

  function closePdfPreview() {
    if (pdfPreview?.url) window.URL.revokeObjectURL(pdfPreview.url);
    setPdfPreview(null);
  }

  function startCreate() {
    setFormData(emptyForm);
    setEditingContractId('');
    setViewingContractId('');
    setTemporaryAccount(null);
    setError('');
    setIsFormOpen(true);
  }

  function startEdit(contract) {
    setEditingContractId(contract._id);
    setViewingContractId('');
    setTemporaryAccount(null);
    setFormData(toFormData(contract));
    setError('');
    setIsFormOpen(true);
  }

  async function startView(contract) {
    setEditingContractId('');
    setViewingContractId('');
    setTemporaryAccount(null);
    setError('');

    if (pdfPreview?.url) window.URL.revokeObjectURL(pdfPreview.url);

    try {
      setDownloadingContractId(contract._id);
      const pdfBlob = await downloadContractPdf(contract._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const roomName = contract.room?.name || 'hop-dong';

      setPdfPreview({
        contract,
        filename: `hop-dong-${roomName}.pdf`,
        url,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingContractId('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updateContract(editingContractId, toPayload(formData));
        setTemporaryAccount(null);
      } else {
        const createdContract = await createContract(toPayload(formData));
        setTemporaryAccount(createdContract.temporaryAccount || null);
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(contract) {
    if (contract.status !== 'active') return;

    const confirmed = window.confirm(
      text.confirmEnd(contract.tenant?.fullName),
    );

    if (!confirmed) return;

    setError('');

    try {
      await deleteContract(contract._id);
      if (editingContractId === contract._id) resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDownloadPdf(contract) {
    if (pdfPreview?.url && pdfPreview.contract?._id === contract._id) {
      const link = document.createElement('a');

      link.href = pdfPreview.url;
      link.download = pdfPreview.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    setDownloadingContractId(contract._id);
    setError('');

    try {
      const pdfBlob = await downloadContractPdf(contract._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const roomName = contract.room?.name || 'hop-dong';

      link.href = url;
      link.download = `hop-dong-${roomName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingContractId('');
    }
  }

  return (
    <section>
      <div className="page-heading">
        <h1>{text.contracts}</h1>
        <div className="page-actions">
          <span className="page-summary">
            {contracts.length} {text.managed}
          </span>
          <button type="button" onClick={startCreate}>
            <FilePlus2 className="button-icon" size={16} strokeWidth={2.5} />
            {text.addContract}
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
        isOpen={Boolean(pdfPreview)}
        panelClassName="pdf-modal-panel"
        title={text.viewPdf}
        onClose={closePdfPreview}
      >
        {pdfPreview ? (
          <div className="pdf-preview-panel">
            <div className="pdf-preview-toolbar">
              <strong>{getContractLabel(pdfPreview.contract, text)}</strong>
              <button
                type="button"
                onClick={() => handleDownloadPdf(pdfPreview.contract)}
              >
                <Download className="button-icon" size={16} strokeWidth={2.5} />
                {text.download}
              </button>
            </div>
            <div className="pdf-preview-viewport">
              <iframe
                className="pdf-preview-frame"
                src={`${pdfPreview.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                title={text.viewPdf}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isFormOpen}
        title={
          isViewing
            ? text.viewContract
            : isEditing
              ? text.updateContract
              : text.addContract
        }
        onClose={resetForm}
      >
        <form className="form-panel compact-form-panel" onSubmit={handleSubmit}>
          <h2>
            {isViewing
              ? text.viewContract
              : isEditing
                ? text.updateContract
                : text.addContract}
          </h2>

          {temporaryAccount ? (
            <div className="credential-panel">
              <strong>{text.tempAccountTitle}</strong>
              <span>
                {text.username}: {temporaryAccount.user.username}
              </span>
              <span>Email: {temporaryAccount.user.email}</span>
              <span>
                {text.tempPassword}: {temporaryAccount.temporaryPassword}
              </span>
              <span>
                {text.passwordDeadline}:{' '}
                {formatDate(
                  temporaryAccount.user.temporaryPasswordExpiresAt,
                  text,
                )}
              </span>
            </div>
          ) : null}

          <label>
            {text.room}
            <select
              disabled={isViewing}
              required
              value={formData.room}
              onChange={(event) => updateRoom(event.target.value)}
            >
              <option value="">{text.selectRoom}</option>
              {roomOptions.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} - {language === 'en' ? 'floor' : 'tầng'}{' '}
                  {room.floor} - {text.upTo} {room.maxOccupants || 2}{' '}
                  {text.people} - {formatMoney(room.price)}
                </option>
              ))}
            </select>
            <span className="field-help">
              {selectedRoom
                ? `${text.upTo} ${selectedRoom.maxOccupants || 2} ${text.people}.`
                : text.capacityHelp}
            </span>
          </label>

          <label>
            {text.tenant}
            <select
              disabled={isViewing}
              required
              value={formData.tenant}
              onChange={(event) => updateField('tenant', event.target.value)}
            >
              <option value="">{text.selectTenant}</option>
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.fullName} - {tenant.phone}
                </option>
              ))}
            </select>
          </label>

          <label>
            {text.startDate}
            <input
              disabled={isViewing}
              required
              type="date"
              value={formData.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </label>

          <label>
            {text.term}
            <select
              disabled={isViewing}
              value={formData.durationMonths}
              onChange={(event) =>
                updateField('durationMonths', event.target.value)
              }
            >
              {text.durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">
              {text.endDateHelp(
                calculatedEndDate ? formatDate(calculatedEndDate, text) : '',
              )}
            </span>
          </label>

          <label>
            {text.monthlyRent}
            <input
              disabled={isViewing}
              min="0"
              required
              type="number"
              value={formData.monthlyPrice}
              onChange={(event) =>
                updateField('monthlyPrice', event.target.value)
              }
            />
            <span className="field-help">
              {text.priceHelp(
                selectedRoom ? formatMoney(selectedRoom.price) : '',
              )}
            </span>
          </label>

          <label>
            {text.deposit}
            <select
              disabled={isViewing}
              value={formData.depositMonths}
              onChange={(event) =>
                updateField('depositMonths', event.target.value)
              }
            >
              {text.depositOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">
              {text.depositAmount(formatMoney(calculatedDeposit))}
            </span>
          </label>

          <label>
            {text.status}
            <select
              disabled={isViewing}
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {text.statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">{text.activeHelp}</span>
          </label>

          <div className="form-actions">
            {!isViewing ? (
              <button disabled={isSubmitting} type="submit">
                {isEditing ? (
                  <Edit3 className="button-icon" size={16} strokeWidth={2.5} />
                ) : (
                  <FilePlus2
                    className="button-icon"
                    size={16}
                    strokeWidth={2.5}
                  />
                )}
                {isSubmitting
                  ? text.saving
                  : isEditing
                    ? text.update
                    : text.add}
              </button>
            ) : null}
            {isEditing || isViewing ? (
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
        <div className="table-panel compact-data-table">
          {isLoading ? <p>{text.loadingData}</p> : null}

          {!isLoading && contracts.length === 0 ? (
            <p>{text.noContract}</p>
          ) : null}

          {!isLoading && contracts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.contract}</th>
                  <th>{text.term}</th>
                  <th>{text.financials}</th>
                  <th>{text.status}</th>
                  <th>{text.actions}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const isActiveContract = contract.status === 'active';

                  return (
                    <tr
                      className={
                        isActiveContract ? undefined : 'inactive-table-row'
                      }
                      key={contract._id}
                    >
                      <td>
                        <strong>{contract.room?.name || text.noRoom}</strong>
                        <span>
                          {contract.tenant?.fullName || text.noTenant}
                        </span>
                      </td>
                      <td>
                        <strong>{formatDate(contract.startDate, text)}</strong>
                        <span>
                          {text.to} {formatDate(contract.endDate, text)}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {formatMoney(contract.monthlyPrice)}/{text.month}
                        </strong>
                        <span>
                          {text.deposit} {formatMoney(contract.deposit)}
                        </span>
                      </td>
                      <td>
                        <strong>{getStatusLabel(contract.status, text)}</strong>
                      </td>
                      <td>
                        <div className="row-actions">
                          {isActiveContract ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(contract)}
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
                                onClick={() => handleDelete(contract)}
                              >
                                <StopCircle
                                  className="button-icon"
                                  size={16}
                                  strokeWidth={2.5}
                                />
                                {text.end}
                              </button>
                            </>
                          ) : null}
                          <button
                            className="secondary-button"
                            disabled={downloadingContractId === contract._id}
                            type="button"
                            onClick={() => startView(contract)}
                          >
                            <Eye
                              className="button-icon"
                              size={16}
                              strokeWidth={2.5}
                            />
                            {downloadingContractId === contract._id
                              ? text.downloadLoading
                              : text.view}
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
