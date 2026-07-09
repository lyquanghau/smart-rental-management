import React, { useEffect, useMemo, useState } from 'react';
import {
  createContract,
  deleteContract,
  downloadContractPdf,
  getContracts,
  updateContract,
} from '../services/contractService.js';
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

const durationOptions = [
  { value: '3', label: '3 tháng' },
  { value: '6', label: '6 tháng' },
  { value: '12', label: '12 tháng' },
  { value: '24', label: '24 tháng' },
];

const depositMonthOptions = [
  { value: '1', label: '1 tháng' },
  { value: '2', label: '2 tháng' },
  { value: '3', label: '3 tháng' },
];

const statusOptions = [
  { value: 'active', label: 'Đang hiệu lực' },
  { value: 'ended', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' },
];

function formatDate(value) {
  if (!value) return 'Chưa có';
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
  return Number(value || 0).toLocaleString('vi-VN');
}

function getStatusLabel(status) {
  return (
    statusOptions.find((option) => option.value === status)?.label || 'Không rõ'
  );
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

  return durationOptions.some((option) => option.value === value)
    ? value
    : '12';
}

function getDepositMonths(deposit, monthlyPrice) {
  if (!deposit || !monthlyPrice) return '1';

  const months = String(Math.round(Number(deposit) / Number(monthlyPrice)));

  return depositMonthOptions.some((option) => option.value === months)
    ? months
    : '1';
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
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingContractId, setEditingContractId] = useState('');
  const [viewingContractId, setViewingContractId] = useState('');
  const [error, setError] = useState('');
  const [downloadingContractId, setDownloadingContractId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingContractId);
  const isViewing = Boolean(viewingContractId);

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
  }

  function startEdit(contract) {
    setEditingContractId(contract._id);
    setViewingContractId('');
    setFormData(toFormData(contract));
    setError('');
  }

  function startView(contract) {
    setEditingContractId('');
    setViewingContractId(contract._id);
    setFormData(toFormData(contract));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updateContract(editingContractId, toPayload(formData));
      } else {
        await createContract(toPayload(formData));
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
      `Kết thúc hợp đồng của ${contract.tenant?.fullName || 'khách thuê này'}?`,
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
        <h1>Hợp đồng</h1>
        <div className="page-actions">
          <span className="page-summary">
            {contracts.length} hợp đồng đang quản lý
          </span>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadData}
          >
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="split-layout">
        <form className="form-panel compact-form-panel" onSubmit={handleSubmit}>
          <h2>
            {isViewing
              ? 'Xem hợp đồng'
              : isEditing
                ? 'Cập nhật hợp đồng'
                : 'Thêm hợp đồng'}
          </h2>

          <label>
            Phòng
            <select
              disabled={isViewing}
              required
              value={formData.room}
              onChange={(event) => updateRoom(event.target.value)}
            >
              <option value="">Chọn phòng</option>
              {roomOptions.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} - tầng {room.floor} - tối đa{' '}
                  {room.maxOccupants || 2} người - {formatMoney(room.price)}đ
                </option>
              ))}
            </select>
            <span className="field-help">
              {selectedRoom
                ? `Tối đa ${selectedRoom.maxOccupants || 2} người.`
                : 'Chọn phòng để xem sức chứa.'}
            </span>
          </label>

          <label>
            Khách thuê
            <select
              disabled={isViewing}
              required
              value={formData.tenant}
              onChange={(event) => updateField('tenant', event.target.value)}
            >
              <option value="">Chọn khách thuê</option>
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.fullName} - {tenant.phone}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ngày bắt đầu
            <input
              disabled={isViewing}
              required
              type="date"
              value={formData.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </label>

          <label>
            Thời hạn hợp đồng
            <select
              disabled={isViewing}
              value={formData.durationMonths}
              onChange={(event) =>
                updateField('durationMonths', event.target.value)
              }
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">
              Ngày kết thúc tự tính là{' '}
              {calculatedEndDate ? formatDate(calculatedEndDate) : 'chưa có'}.
            </span>
          </label>

          <label>
            Giá thuê mỗi tháng
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
              Giá niêm yết
              {selectedRoom ? `: ${formatMoney(selectedRoom.price)}đ.` : '.'} Ô
              này là giá chốt trong hợp đồng.
            </span>
          </label>

          <label>
            Tiền cọc
            <select
              disabled={isViewing}
              value={formData.depositMonths}
              onChange={(event) =>
                updateField('depositMonths', event.target.value)
              }
            >
              {depositMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">
              Số tiền cọc: {formatMoney(calculatedDeposit)}đ.
            </span>
          </label>

          <label>
            Trạng thái
            <select
              disabled={isViewing}
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-help">
              Đang hiệu lực: còn dùng. Kết thúc/hủy: chỉ xem.
            </span>
          </label>

          <div className="form-actions">
            {!isViewing ? (
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm'}
              </button>
            ) : null}
            {isEditing || isViewing ? (
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

          {!isLoading && contracts.length === 0 ? (
            <p>Chưa có hợp đồng nào.</p>
          ) : null}

          {!isLoading && contracts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Hợp đồng</th>
                  <th>Thời hạn</th>
                  <th>Tài chính</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
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
                        <strong>
                          {contract.room?.name || 'Chưa có phòng'}
                        </strong>
                        <span>
                          {contract.tenant?.fullName || 'Chưa có khách thuê'}
                        </span>
                      </td>
                      <td>
                        <strong>{formatDate(contract.startDate)}</strong>
                        <span>Đến {formatDate(contract.endDate)}</span>
                      </td>
                      <td>
                        <strong>
                          {formatMoney(contract.monthlyPrice)}đ/tháng
                        </strong>
                        <span>Cọc {formatMoney(contract.deposit)}đ</span>
                      </td>
                      <td>
                        <strong>{getStatusLabel(contract.status)}</strong>
                      </td>
                      <td>
                        <div className="row-actions">
                          {isActiveContract ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(contract)}
                              >
                                Sửa
                              </button>
                              <button
                                className="danger-button"
                                type="button"
                                onClick={() => handleDelete(contract)}
                              >
                                Kết thúc
                              </button>
                            </>
                          ) : (
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => startView(contract)}
                            >
                              Xem
                            </button>
                          )}
                          <button
                            className="secondary-button"
                            disabled={downloadingContractId === contract._id}
                            type="button"
                            onClick={() => handleDownloadPdf(contract)}
                          >
                            {downloadingContractId === contract._id
                              ? 'Đang tải'
                              : 'PDF'}
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
