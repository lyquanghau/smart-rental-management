import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Modal } from '../components/Modal.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { getContracts } from '../services/contractService.js';
import { formatCurrency } from '../services/preferences.js';
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

const copy = {
  en: {
    actions: 'Actions',
    add: 'Add',
    addPayment: 'Add payment',
    amount: 'Amount',
    cancel: 'Cancel',
    collected: 'Collected',
    confirmCancel: (label) => `Cancel the payment for ${label}?`,
    confirmPaid: (amount, label) =>
      `Confirm ${amount} has been collected for ${label}?`,
    contract: 'Contract',
    contractRent: (amount) => `Contract rent: ${amount}/month.`,
    dueDate: 'Due date',
    duePaid: 'Due / paid date',
    edit: 'Edit',
    filterLabel: 'Filter payment status',
    loading: 'Loading...',
    loadingData: 'Loading data...',
    method: 'Method',
    noNote: 'No note',
    noRoom: 'No room',
    noTenant: 'No tenant',
    notAvailable: 'Not available',
    note: 'Note',
    paid: 'Paid',
    payment: 'Payment',
    payments: 'Payments',
    reload: 'Reload',
    saving: 'Saving...',
    selectContract: 'Select contract',
    selectContractHelp: 'Select an active contract to create a payment.',
    status: 'Status',
    update: 'Update',
    updatePayment: 'Update payment',
    visible: 'visible payments',
    empty: 'No payments yet.',
    statusOptions: [
      { value: '', label: 'All statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    methods: [
      { value: 'cash', label: 'Cash' },
      { value: 'bank_transfer', label: 'Bank transfer' },
      { value: 'momo', label: 'MoMo' },
      { value: 'vnpay', label: 'VNPay' },
    ],
  },
  vi: {
    actions: 'Thao tác',
    add: 'Thêm',
    addPayment: 'Thêm khoản thu',
    amount: 'Số tiền',
    cancel: 'Hủy',
    collected: 'Đã thu',
    confirmCancel: (label) => `Hủy khoản thu của ${label}?`,
    confirmPaid: (amount, label) => `Xác nhận đã thu ${amount} cho ${label}?`,
    contract: 'Hợp đồng',
    contractRent: (amount) => `Giá thuê theo hợp đồng: ${amount}/tháng.`,
    dueDate: 'Hạn thanh toán',
    duePaid: 'Hạn / ngày thu',
    edit: 'Sửa',
    filterLabel: 'Lọc trạng thái thanh toán',
    loading: 'Đang tải...',
    loadingData: 'Đang tải dữ liệu...',
    method: 'Phương thức',
    noNote: 'Không có ghi chú',
    noRoom: 'Chưa có phòng',
    noTenant: 'Chưa có khách thuê',
    notAvailable: 'Chưa có',
    note: 'Ghi chú',
    paid: 'Thu',
    payment: 'Khoản thu',
    payments: 'Thanh toán',
    reload: 'Tải lại',
    saving: 'Đang lưu...',
    selectContract: 'Chọn hợp đồng',
    selectContractHelp: 'Chọn hợp đồng active để tạo khoản thu.',
    status: 'Trạng thái',
    update: 'Cập nhật',
    updatePayment: 'Cập nhật khoản thu',
    visible: 'khoản thu đang hiển thị',
    empty: 'Chưa có khoản thu nào.',
    statusOptions: [
      { value: '', label: 'Tất cả trạng thái' },
      { value: 'pending', label: 'Chờ thu' },
      { value: 'paid', label: 'Đã thanh toán' },
      { value: 'overdue', label: 'Quá hạn' },
      { value: 'cancelled', label: 'Đã hủy' },
    ],
    methods: [
      { value: 'cash', label: 'Tiền mặt' },
      { value: 'bank_transfer', label: 'Chuyển khoản' },
      { value: 'momo', label: 'MoMo' },
      { value: 'vnpay', label: 'VNPay' },
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

function formatMoney(value) {
  return formatCurrency(value);
}

function getMethodLabel(method, text) {
  return (
    text.methods.find((option) => option.value === method)?.label || method
  );
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
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingPaymentId, setEditingPaymentId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    setIsFormOpen(false);
  }

  function startCreate() {
    setFormData(emptyForm);
    setEditingPaymentId('');
    setError('');
    setIsFormOpen(true);
  }

  function startEdit(payment) {
    setEditingPaymentId(payment._id);
    setFormData(toFormData(payment));
    setError('');
    setIsFormOpen(true);
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
      text.confirmPaid(
        formatMoney(payment.amount),
        getContractLabel(payment.contract, text),
      ),
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
      text.confirmCancel(getContractLabel(payment.contract, text)),
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
        <h1>{text.payments}</h1>
        <div className="page-actions room-page-actions payment-page-actions">
          <span className="page-summary">
            {payments.length} {text.visible}
          </span>
          <button type="button" onClick={startCreate}>
            <Plus className="button-icon" size={16} strokeWidth={2.5} />
            {text.addPayment}
          </button>
          <select
            className="compact-filter payment-status-filter"
            aria-label={text.filterLabel}
            value={statusFilter}
            onChange={(event) => handleStatusFilterChange(event.target.value)}
          >
            {text.statusOptions.map((option) => (
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
            {isLoading ? text.loading : text.reload}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <Modal
        isOpen={isFormOpen}
        title={isEditing ? text.updatePayment : text.addPayment}
        onClose={resetForm}
      >
        <form className="form-panel compact-form-panel" onSubmit={handleSubmit}>
          <h2>{isEditing ? text.updatePayment : text.addPayment}</h2>

          <label>
            {text.contract}
            <select
              required
              value={formData.contract}
              onChange={(event) => updateContract(event.target.value)}
            >
              <option value="">{text.selectContract}</option>
              {activeContracts.map((contract) => (
                <option key={contract._id} value={contract._id}>
                  {getContractLabel(contract, text)} -{' '}
                  {formatMoney(contract.monthlyPrice)}
                </option>
              ))}
            </select>
            <span className="field-help">
              {selectedContract
                ? text.contractRent(formatMoney(selectedContract.monthlyPrice))
                : text.selectContractHelp}
            </span>
          </label>

          <label>
            {text.amount}
            <input
              min="0"
              required
              type="number"
              value={formData.amount}
              onChange={(event) => updateField('amount', event.target.value)}
            />
          </label>

          <label>
            {text.dueDate}
            <input
              required
              type="date"
              value={formData.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
          </label>

          <label>
            {text.method}
            <select
              value={formData.method}
              onChange={(event) => updateField('method', event.target.value)}
            >
              {text.methods.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            {text.status}
            <select
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {text.statusOptions
                .filter((option) => option.value)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <label>
            {text.note}
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
        <div className="table-panel compact-data-table">
          {isLoading ? <p>{text.loadingData}</p> : null}

          {!isLoading && payments.length === 0 ? <p>{text.empty}</p> : null}

          {!isLoading && payments.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.payment}</th>
                  <th>{text.duePaid}</th>
                  <th>{text.amount}</th>
                  <th>{text.status}</th>
                  <th>{text.actions}</th>
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
                        <strong>
                          {getContractLabel(payment.contract, text)}
                        </strong>
                        <span>{payment.note || text.noNote}</span>
                      </td>
                      <td>
                        <strong>{formatDate(payment.dueDate, text)}</strong>
                        <span>
                          {text.paid}: {formatDate(payment.paidAt, text)}
                        </span>
                      </td>
                      <td>
                        <strong>{formatMoney(payment.amount)}</strong>
                        <span>{getMethodLabel(payment.method, text)}</span>
                      </td>
                      <td>
                        <span className={`status status-${payment.status}`}>
                          {getStatusLabel(payment.status, text)}
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
                            {text.edit}
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
                                {text.collected}
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
                                {text.cancel}
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
