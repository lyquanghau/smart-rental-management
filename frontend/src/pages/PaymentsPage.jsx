import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { getContracts } from '../services/contractService.js';
import {
  cancelPayment,
  createPayment,
  getPayments,
  markPaymentPaid,
  updatePayment,
} from '../services/paymentService.js';

const emptyForm = {
  contract: '',
  amount: '',
  dueDate: '',
  method: 'cash',
  status: 'pending',
  note: '',
};

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thu' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'overdue', label: 'Quá hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const paymentStatusLabels = {
  pending: 'Chờ thu',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
  cancelled: 'Đã hủy',
};

const methodOptions = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'momo', label: 'MoMo' },
  { value: 'vnpay', label: 'VNPay' },
];

function formatDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function getMethodLabel(method) {
  return (
    methodOptions.find((option) => option.value === method)?.label || 'Không rõ'
  );
}

function getStatusLabel(status) {
  return paymentStatusLabels[status] || 'Không rõ';
}

function getContractLabel(contract) {
  const roomName = contract?.room?.name || 'Chưa có phòng';
  const tenantName = contract?.tenant?.fullName || 'Chưa có khách thuê';

  return `${roomName} - ${tenantName}`;
}

function toFormData(payment) {
  return {
    contract: payment.contract?._id || payment.contract || '',
    amount: String(payment.amount ?? ''),
    dueDate: formatDateInput(payment.dueDate),
    method: payment.method || 'cash',
    status: payment.status || 'pending',
    note: payment.note || '',
  };
}

function toPayload(formData) {
  return {
    contract: formData.contract,
    amount: Number(formData.amount),
    dueDate: formData.dueDate,
    method: formData.method,
    status: formData.status,
    note: formData.note,
  };
}

export function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingPaymentId, setEditingPaymentId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingPaymentId);

  const activeContracts = useMemo(() => {
    return contracts.filter((contract) => contract.status === 'active');
  }, [contracts]);

  const selectedContract = useMemo(() => {
    return contracts.find((contract) => contract._id === formData.contract);
  }, [contracts, formData.contract]);

  async function loadData(nextStatus = statusFilter) {
    setIsLoading(true);
    setError('');

    try {
      const [paymentData, contractData] = await Promise.all([
        getPayments(nextStatus ? { status: nextStatus } : {}),
        getContracts(),
      ]);

      setPayments(paymentData);
      setContracts(contractData);
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

  function updateContract(contractId) {
    const contract = contracts.find((item) => item._id === contractId);

    setFormData((current) => ({
      ...current,
      contract: contractId,
      amount: contract ? String(contract.monthlyPrice) : current.amount,
    }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingPaymentId('');
  }

  function startEdit(payment) {
    setEditingPaymentId(payment._id);
    setFormData(toFormData(payment));
    setError('');
  }

  async function handleStatusFilterChange(value) {
    setStatusFilter(value);
    await loadData(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updatePayment(editingPaymentId, toPayload(formData));
      } else {
        await createPayment(toPayload(formData));
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkPaid(payment) {
    if (payment.status === 'paid' || payment.status === 'cancelled') return;

    const confirmed = window.confirm(
      `Xác nhận đã thu ${formatMoney(payment.amount)}đ cho ${getContractLabel(
        payment.contract,
      )}?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await markPaymentPaid(payment._id, {
        method: payment.method,
        note: payment.note,
      });
      if (editingPaymentId === payment._id) resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel(payment) {
    if (payment.status === 'paid' || payment.status === 'cancelled') return;

    const confirmed = window.confirm(
      `Hủy khoản thu của ${getContractLabel(payment.contract)}?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await cancelPayment(payment._id, { note: payment.note });
      if (editingPaymentId === payment._id) resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <h1>Thanh toán</h1>
        <div className="page-actions">
          <span className="page-summary">
            {payments.length} khoản thu đang hiển thị
          </span>
          <select
            aria-label="Lọc trạng thái thanh toán"
            value={statusFilter}
            onChange={(event) => handleStatusFilterChange(event.target.value)}
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
            onClick={() => loadData()}
          >
            <RefreshCw className="button-icon" size={16} strokeWidth={2.5} />
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="split-layout">
        <form className="form-panel compact-form-panel" onSubmit={handleSubmit}>
          <h2>{isEditing ? 'Cập nhật khoản thu' : 'Thêm khoản thu'}</h2>

          <label>
            Hợp đồng
            <select
              required
              value={formData.contract}
              onChange={(event) => updateContract(event.target.value)}
            >
              <option value="">Chọn hợp đồng</option>
              {activeContracts.map((contract) => (
                <option key={contract._id} value={contract._id}>
                  {getContractLabel(contract)} -{' '}
                  {formatMoney(contract.monthlyPrice)}đ
                </option>
              ))}
            </select>
            <span className="field-help">
              {selectedContract
                ? `Giá thuê theo hợp đồng: ${formatMoney(
                    selectedContract.monthlyPrice,
                  )}đ/tháng.`
                : 'Chọn hợp đồng active để tạo khoản thu.'}
            </span>
          </label>

          <label>
            Số tiền
            <input
              min="0"
              required
              type="number"
              value={formData.amount}
              onChange={(event) => updateField('amount', event.target.value)}
            />
          </label>

          <label>
            Hạn thanh toán
            <input
              required
              type="date"
              value={formData.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
          </label>

          <label>
            Phương thức
            <select
              value={formData.method}
              onChange={(event) => updateField('method', event.target.value)}
            >
              {methodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Trạng thái
            <select
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {statusOptions
                .filter((option) => option.value)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Ghi chú
            <input
              value={formData.note}
              onChange={(event) => updateField('note', event.target.value)}
            />
          </label>

          <div className="form-actions">
            <button disabled={isSubmitting} type="submit">
              {isEditing ? (
                <Edit3 className="button-icon" size={16} strokeWidth={2.5} />
              ) : (
                <Plus className="button-icon" size={16} strokeWidth={2.5} />
              )}
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm'}
            </button>
            {isEditing ? (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                <X className="button-icon" size={16} strokeWidth={2.5} />
                Hủy
              </button>
            ) : null}
          </div>
        </form>

        <div className="table-panel">
          {isLoading ? <p>Đang tải dữ liệu...</p> : null}

          {!isLoading && payments.length === 0 ? (
            <p>Chưa có khoản thu nào.</p>
          ) : null}

          {!isLoading && payments.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Khoản thu</th>
                  <th>Hạn / ngày thu</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const isFinal =
                    payment.status === 'paid' || payment.status === 'cancelled';

                  return (
                    <tr
                      className={isFinal ? 'inactive-table-row' : undefined}
                      key={payment._id}
                    >
                      <td>
                        <strong>{getContractLabel(payment.contract)}</strong>
                        <span>{payment.note || 'Không có ghi chú'}</span>
                      </td>
                      <td>
                        <strong>{formatDate(payment.dueDate)}</strong>
                        <span>Thu: {formatDate(payment.paidAt)}</span>
                      </td>
                      <td>
                        <strong>{formatMoney(payment.amount)}đ</strong>
                        <span>{getMethodLabel(payment.method)}</span>
                      </td>
                      <td>
                        <span className={`status status-${payment.status}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => startEdit(payment)}
                          >
                            <Edit3
                              className="button-icon"
                              size={16}
                              strokeWidth={2.5}
                            />
                            Sửa
                          </button>
                          {!isFinal ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(payment)}
                              >
                                <CheckCircle2
                                  className="button-icon"
                                  size={16}
                                  strokeWidth={2.5}
                                />
                                Đã thu
                              </button>
                              <button
                                className="danger-button"
                                type="button"
                                onClick={() => handleCancel(payment)}
                              >
                                <Trash2
                                  className="button-icon"
                                  size={16}
                                  strokeWidth={2.5}
                                />
                                Hủy
                              </button>
                            </>
                          ) : null}
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
