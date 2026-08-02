import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Download,
  Eye,
  FilePlus2,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Zap,
} from 'lucide-react';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { getContracts } from '../services/contractService.js';
import {
  cancelInvoice,
  downloadInvoicePdf,
  generateMonthlyInvoices,
  getInvoices,
  markInvoicePaid,
} from '../services/invoiceService.js';
import { formatCurrency } from '../services/preferences.js';
import {
  getServiceSetting,
  updateServiceSetting,
} from '../services/serviceSettingService.js';
import {
  getUtilityReadings,
  saveUtilityReading,
} from '../services/utilityReadingService.js';

const currentDate = new Date();

const emptySetting = {
  bankAccountName: '',
  bankAccountNumber: '',
  bankName: '',
  electricityUnitPrice: '',
  waterUnitPrice: '',
  internetFee: '',
  trashFee: '',
  parkingFeePerVehicle: '',
  paymentNote: '',
  transferContentTemplate: '',
};

const emptyReadingForm = {
  contract: '',
  electricityPrevious: '',
  electricityCurrent: '',
  waterPrevious: '',
  waterCurrent: '',
  internetAmount: '',
  trashAmount: '',
  parkingVehicleCount: '0',
  note: '',
};

const copy = {
  en: {
    activeContracts: 'active contracts',
    actions: 'Actions',
    bankAccountName: 'Account holder',
    bankAccountNumber: 'Account number',
    bankName: 'Bank',
    calculator: 'Monthly service calculator',
    cancel: 'Cancel invoice',
    cancelled: 'Invoice cancelled.',
    close: 'Close',
    confirmCancel: (label) => `Cancel invoice ${label}?`,
    confirmPaid: (label) => `Mark invoice ${label} as collected?`,
    dueDate: 'Invoice due date',
    electricity: 'Electricity',
    electricityCurrent: 'Current electricity index',
    electricityPrevious: 'Previous electricity index',
    electricityUnitPrice: 'Electricity price / kWh',
    emptyInvoices: 'No invoices for this month.',
    emptyReadings: 'No utility readings for this month.',
    generate: 'Generate monthly invoices',
    generated: 'Generated invoices',
    invoicedAmount: 'Invoiced amount',
    internetFee: 'Internet fee',
    invoiceDetail: 'Invoice detail',
    invoiceItems: 'Cost breakdown',
    invoicePdfDownloaded: 'Invoice PDF downloaded.',
    invoiceMarkedPaid: 'Invoice marked as collected.',
    invoiceSummary: 'Invoice summary',
    loading: 'Loading...',
    markPaid: 'Mark collected',
    month: 'Month',
    note: 'Note',
    parkingFeePerVehicle: 'Parking fee / vehicle',
    parkingVehicleCount: 'Vehicles',
    readingForm: 'Record utility reading',
    readings: 'Utility readings',
    reload: 'Reload',
    rent: 'Rent',
    roomTenant: 'Room / tenant',
    saveReading: 'Save reading',
    saveSetting: 'Save service prices',
    saving: 'Saving...',
    settingsSaved: 'Service prices saved.',
    readingSaved: 'Utility reading saved.',
    invoicesGenerated: 'Monthly invoices generated.',
    selectContract: 'Select active contract',
    serviceAmount: 'Services',
    serviceSettings: 'Service prices',
    serviceTotal: 'Service total',
    transferContentTemplate: 'Transfer content template',
    transferNote: 'Payment note for tenants',
    status: 'Status',
    total: 'Total',
    trashFee: 'Trash fee',
    unitPrice: 'Unit price',
    view: 'View detail',
    visibleInvoices: 'visible invoices',
    water: 'Water',
    waterCurrent: 'Current water index',
    waterPrevious: 'Previous water index',
    waterUnitPrice: 'Water price / m3',
    year: 'Year',
  },
  vi: {
    bankAccountName: 'Chu tai khoan',
    bankAccountNumber: 'So tai khoan',
    bankName: 'Ngan hang',
    transferContentTemplate: 'Mau noi dung chuyen khoan',
    transferNote: 'Ghi chu thanh toan cho khach thue',
    activeContracts: 'hợp đồng đang hiệu lực',
    calculator: 'Tính dịch vụ hằng tháng',
    dueDate: 'Hạn thanh toán hóa đơn',
    electricity: 'Điện',
    electricityCurrent: 'Chỉ số điện mới',
    electricityPrevious: 'Chỉ số điện cũ',
    electricityUnitPrice: 'Đơn giá điện / kWh',
    emptyInvoices: 'Chưa có hóa đơn tháng này.',
    emptyReadings: 'Chưa có chỉ số dịch vụ tháng này.',
    generate: 'Tạo hóa đơn tháng',
    generated: 'Hóa đơn đã tạo',
    invoicedAmount: 'Tổng hóa đơn',
    internetFee: 'Phí internet',
    invoiceSummary: 'Tổng hợp hóa đơn',
    loading: 'Đang tải...',
    month: 'Tháng',
    note: 'Ghi chú',
    parkingFeePerVehicle: 'Phí gửi xe / xe',
    parkingVehicleCount: 'Số xe',
    readingForm: 'Ghi chỉ số điện nước',
    readings: 'Chỉ số dịch vụ',
    reload: 'Tải lại',
    rent: 'Tiền phòng',
    roomTenant: 'Phòng / khách thuê',
    saveReading: 'Lưu chỉ số',
    saveSetting: 'Lưu đơn giá',
    saving: 'Đang lưu...',
    settingsSaved: 'Đã lưu đơn giá dịch vụ.',
    readingSaved: 'Đã lưu chỉ số điện nước.',
    invoicesGenerated: 'Đã tạo hóa đơn tháng.',
    selectContract: 'Chọn hợp đồng active',
    serviceAmount: 'Dịch vụ',
    serviceSettings: 'Đơn giá dịch vụ',
    serviceTotal: 'Tổng dịch vụ',
    total: 'Tổng cộng',
    trashFee: 'Phí rác',
    visibleInvoices: 'hóa đơn đang hiển thị',
    water: 'Nước',
    waterCurrent: 'Chỉ số nước mới',
    waterPrevious: 'Chỉ số nước cũ',
    waterUnitPrice: 'Đơn giá nước / m3',
    year: 'Năm',
  },
};

const invoiceCopy = {
  en: {
    actions: 'Actions',
    cancel: 'Cancel invoice',
    cancelled: 'Invoice cancelled.',
    close: 'Close',
    confirmCancel: (label) => `Cancel invoice ${label}?`,
    confirmPaid: (label) => `Mark invoice ${label} as collected?`,
    invoiceDetail: 'Invoice detail',
    invoiceItems: 'Cost breakdown',
    invoiceMarkedPaid: 'Invoice marked as collected.',
    invoicePdfDownloaded: 'Da tai PDF hoa don.',
    markPaid: 'Mark collected',
    quantity: 'Quantity',
    status: 'Status',
    unitPrice: 'Unit price',
    view: 'View detail',
  },
  vi: {
    actions: 'Thao tac',
    cancel: 'Huy hoa don',
    cancelled: 'Da huy hoa don.',
    close: 'Dong',
    confirmCancel: (label) => `Huy hoa don ${label}?`,
    confirmPaid: (label) => `Xac nhan da thu hoa don ${label}?`,
    invoiceDetail: 'Chi tiet hoa don',
    invoiceItems: 'Bang ke chi phi',
    invoiceMarkedPaid: 'Da ghi nhan hoa don da thu.',
    markPaid: 'Da thu',
    quantity: 'So luong',
    status: 'Trang thai',
    unitPrice: 'Don gia',
    view: 'Xem chi tiet',
  },
};

function formatMoney(value) {
  return formatCurrency(value || 0);
}

function getContractLabel(contract) {
  const roomName = contract?.room?.name || 'N/A';
  const tenantName = contract?.tenant?.fullName || 'N/A';

  return `${roomName} - ${tenantName}`;
}

function toNumber(value) {
  return Number(value || 0);
}

function toSettingForm(setting) {
  return {
    bankAccountName: setting?.bankAccountName || '',
    bankAccountNumber: setting?.bankAccountNumber || '',
    bankName: setting?.bankName || '',
    electricityUnitPrice: String(setting?.electricityUnitPrice ?? ''),
    waterUnitPrice: String(setting?.waterUnitPrice ?? ''),
    internetFee: String(setting?.internetFee ?? ''),
    trashFee: String(setting?.trashFee ?? ''),
    parkingFeePerVehicle: String(setting?.parkingFeePerVehicle ?? ''),
    paymentNote: setting?.paymentNote || '',
    transferContentTemplate: setting?.transferContentTemplate || '',
  };
}

function toSettingPayload(form) {
  return {
    bankAccountName: form.bankAccountName,
    bankAccountNumber: form.bankAccountNumber,
    bankName: form.bankName,
    electricityUnitPrice: toNumber(form.electricityUnitPrice),
    waterUnitPrice: toNumber(form.waterUnitPrice),
    internetFee: toNumber(form.internetFee),
    trashFee: toNumber(form.trashFee),
    parkingFeePerVehicle: toNumber(form.parkingFeePerVehicle),
    paymentNote: form.paymentNote,
    transferContentTemplate: form.transferContentTemplate,
  };
}

function toReadingPayload(form, month, year) {
  return {
    contract: form.contract,
    month,
    year,
    electricityPrevious: toNumber(form.electricityPrevious),
    electricityCurrent: toNumber(form.electricityCurrent),
    waterPrevious: toNumber(form.waterPrevious),
    waterCurrent: toNumber(form.waterCurrent),
    internetAmount: toNumber(form.internetAmount),
    trashAmount: toNumber(form.trashAmount),
    parkingVehicleCount: toNumber(form.parkingVehicleCount),
    note: form.note,
  };
}

function formatDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatInvoiceCode(invoice) {
  if (!invoice) return '';
  return `${invoice.month}/${invoice.year}`;
}

function getStatusLabel(status, language) {
  const labels = {
    en: {
      cancelled: 'Cancelled',
      draft: 'Draft',
      issued: 'Issued',
      overdue: 'Overdue',
      paid: 'Paid',
    },
    vi: {
      cancelled: 'Da huy',
      draft: 'Ban nhap',
      issued: 'Da phat hanh',
      overdue: 'Qua han',
      paid: 'Da thanh toan',
    },
  };

  return labels[language]?.[status] || status;
}

export function ServicesPage() {
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const text = {
    ...(invoiceCopy[language] || invoiceCopy.vi),
    ...(copy[language] || copy.vi),
  };
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [dueDate, setDueDate] = useState(
    formatDateInput(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    ),
  );
  const [settingForm, setSettingForm] = useState(emptySetting);
  const [readingForm, setReadingForm] = useState(emptyReadingForm);
  const [contracts, setContracts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSetting, setIsSavingSetting] = useState(false);
  const [isSavingReading, setIsSavingReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceActionId, setInvoiceActionId] = useState('');
  const [invoiceDownloadId, setInvoiceDownloadId] = useState('');

  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === 'active'),
    [contracts],
  );

  const selectedContract = useMemo(
    () =>
      activeContracts.find((contract) => contract._id === readingForm.contract),
    [activeContracts, readingForm.contract],
  );

  const invoiceTotal = useMemo(
    () =>
      invoices.reduce(
        (total, invoice) => total + Number(invoice.totalAmount || 0),
        0,
      ),
    [invoices],
  );

  const preview = useMemo(() => {
    const setting = toSettingPayload(settingForm);
    const electricityUsage = Math.max(
      toNumber(readingForm.electricityCurrent) -
        toNumber(readingForm.electricityPrevious),
      0,
    );
    const waterUsage = Math.max(
      toNumber(readingForm.waterCurrent) - toNumber(readingForm.waterPrevious),
      0,
    );
    const electricityAmount = electricityUsage * setting.electricityUnitPrice;
    const waterAmount = waterUsage * setting.waterUnitPrice;
    const internetAmount = toNumber(readingForm.internetAmount);
    const trashAmount = toNumber(readingForm.trashAmount);
    const parkingAmount =
      toNumber(readingForm.parkingVehicleCount) * setting.parkingFeePerVehicle;

    return {
      electricityUsage,
      waterUsage,
      serviceTotal:
        electricityAmount +
        waterAmount +
        internetAmount +
        trashAmount +
        parkingAmount,
    };
  }, [readingForm, settingForm]);

  async function loadData(nextMonth = month, nextYear = year) {
    setIsLoading(true);
    setError('');

    try {
      const [setting, contractData, readingData, invoiceData] =
        await Promise.all([
          getServiceSetting(),
          getContracts(),
          getUtilityReadings({ month: nextMonth, year: nextYear }),
          getInvoices({ month: nextMonth, year: nextYear }),
        ]);

      setSettingForm(toSettingForm(setting));
      setContracts(contractData);
      setReadings(readingData);
      setInvoices(invoiceData);
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

  function updateSetting(field, value) {
    setSettingForm((current) => ({ ...current, [field]: value }));
  }

  function updateReading(field, value) {
    setReadingForm((current) => ({ ...current, [field]: value }));
  }

  function selectContract(contractId) {
    setReadingForm((current) => ({
      ...current,
      contract: contractId,
      internetAmount: settingForm.internetFee,
      trashAmount: settingForm.trashFee,
    }));
  }

  async function handleMonthChange(nextMonth, nextYear = year) {
    setMonth(nextMonth);
    await loadData(nextMonth, nextYear);
  }

  async function handleYearChange(nextYear) {
    setYear(nextYear);
    await loadData(month, nextYear);
  }

  async function handleSaveSetting(event) {
    event.preventDefault();
    setIsSavingSetting(true);
    setError('');

    try {
      const setting = await updateServiceSetting(toSettingPayload(settingForm));
      setSettingForm(toSettingForm(setting));
      showSuccess(text.settingsSaved);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSavingSetting(false);
    }
  }

  async function handleSaveReading(event) {
    event.preventDefault();
    setIsSavingReading(true);
    setError('');

    try {
      await saveUtilityReading(toReadingPayload(readingForm, month, year));
      setReadingForm(emptyReadingForm);
      await loadData();
      showSuccess(text.readingSaved);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSavingReading(false);
    }
  }

  async function handleGenerateInvoices() {
    setIsGenerating(true);
    setError('');

    try {
      await generateMonthlyInvoices({ month, year, dueDate });
      await loadData();
      showSuccess(text.invoicesGenerated);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleMarkInvoicePaid(invoice) {
    const confirmed = window.confirm(
      text.confirmPaid(formatInvoiceCode(invoice)),
    );

    if (!confirmed) return;

    setInvoiceActionId(invoice._id);
    setError('');

    try {
      const updatedInvoice = await markInvoicePaid(invoice._id);
      setSelectedInvoice(updatedInvoice);
      await loadData();
      showSuccess(text.invoiceMarkedPaid);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setInvoiceActionId('');
    }
  }

  async function handleCancelInvoice(invoice) {
    const confirmed = window.confirm(
      text.confirmCancel(formatInvoiceCode(invoice)),
    );

    if (!confirmed) return;

    setInvoiceActionId(invoice._id);
    setError('');

    try {
      const updatedInvoice = await cancelInvoice(invoice._id, {
        note: invoice.note,
      });
      setSelectedInvoice(updatedInvoice);
      await loadData();
      showSuccess(text.cancelled);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setInvoiceActionId('');
    }
  }

  async function handleDownloadInvoicePdf(invoice) {
    setInvoiceDownloadId(invoice._id);
    setError('');

    try {
      const pdfBlob = await downloadInvoicePdf(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const roomName = invoice.room?.name || 'hoa-don';

      link.href = url;
      link.download = `hoa-don-${roomName}-${invoice.month}-${invoice.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess(text.invoicePdfDownloaded);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setInvoiceDownloadId('');
    }
  }

  function canChangeInvoice(invoice) {
    return invoice?.status !== 'paid' && invoice?.status !== 'cancelled';
  }

  return (
    <section className="services-page">
      <div className="page-heading services-heading">
        <div>
          <span className="eyebrow">Services</span>
          <h1>{text.calculator}</h1>
        </div>
        <div className="page-actions services-period-actions">
          <label className="inline-field">
            {text.month}
            <input
              min="1"
              max="12"
              type="number"
              value={month}
              onChange={(event) =>
                handleMonthChange(Number(event.target.value))
              }
            />
          </label>
          <label className="inline-field">
            {text.year}
            <input
              min="2000"
              type="number"
              value={year}
              onChange={(event) => handleYearChange(Number(event.target.value))}
            />
          </label>
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
        isOpen={Boolean(selectedInvoice)}
        title={text.invoiceDetail}
        onClose={() => setSelectedInvoice(null)}
      >
        {selectedInvoice ? (
          <div className="invoice-detail-modal">
            <div className="invoice-detail-grid">
              <div>
                <span>{text.roomTenant}</span>
                <strong>{getContractLabel(selectedInvoice)}</strong>
              </div>
              <div>
                <span>{text.month}</span>
                <strong>{formatInvoiceCode(selectedInvoice)}</strong>
              </div>
              <div>
                <span>{text.dueDate}</span>
                <strong>{formatDate(selectedInvoice.dueDate)}</strong>
              </div>
              <div>
                <span>{text.status}</span>
                <strong>
                  {getStatusLabel(selectedInvoice.status, language)}
                </strong>
              </div>
              <div>
                <span>{text.total}</span>
                <strong>{formatMoney(selectedInvoice.totalAmount)}</strong>
              </div>
            </div>

            <div className="table-panel compact-data-table invoice-items-panel">
              <div className="table-panel-header">
                <h2>{text.invoiceItems}</h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{text.note}</th>
                    <th>{text.quantity}</th>
                    <th>{text.unitPrice}</th>
                    <th>{text.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item) => (
                    <tr key={`${item.name}-${item.amount}`}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unitPrice)}</td>
                      <td>
                        <strong>{formatMoney(item.amount)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer-actions">
              <button
                className="secondary-button"
                disabled={invoiceDownloadId === selectedInvoice._id}
                type="button"
                onClick={() => handleDownloadInvoicePdf(selectedInvoice)}
              >
                <Download className="button-icon" size={16} strokeWidth={2.5} />
                {invoiceDownloadId === selectedInvoice._id
                  ? text.loading
                  : 'PDF'}
              </button>
              {canChangeInvoice(selectedInvoice) ? (
                <>
                  <button
                    disabled={invoiceActionId === selectedInvoice._id}
                    type="button"
                    onClick={() => handleMarkInvoicePaid(selectedInvoice)}
                  >
                    <CheckCircle2
                      className="button-icon"
                      size={16}
                      strokeWidth={2.5}
                    />
                    {invoiceActionId === selectedInvoice._id
                      ? text.saving
                      : text.markPaid}
                  </button>
                  <button
                    className="danger-button"
                    disabled={invoiceActionId === selectedInvoice._id}
                    type="button"
                    onClick={() => handleCancelInvoice(selectedInvoice)}
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
              <button
                className="secondary-button"
                type="button"
                onClick={() => setSelectedInvoice(null)}
              >
                {text.close}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <div className="services-summary-grid">
        <article className="service-summary-card">
          <span>{text.activeContracts}</span>
          <strong>{activeContracts.length}</strong>
        </article>
        <article className="service-summary-card">
          <span>{text.readings}</span>
          <strong>{readings.length}</strong>
        </article>
        <article className="service-summary-card">
          <span>{text.visibleInvoices}</span>
          <strong>{invoices.length}</strong>
        </article>
        <article className="service-summary-card highlight">
          <span>{text.invoicedAmount}</span>
          <strong>{formatMoney(invoiceTotal)}</strong>
        </article>
      </div>

      <div className="services-workspace">
        <form
          className="form-panel compact-form-panel service-settings-panel"
          onSubmit={handleSaveSetting}
        >
          <h2>
            <Settings2 className="button-icon" size={18} strokeWidth={2.4} />
            {text.serviceSettings}
          </h2>
          <label>
            {text.electricityUnitPrice}
            <input
              min="0"
              type="number"
              value={settingForm.electricityUnitPrice}
              onChange={(event) =>
                updateSetting('electricityUnitPrice', event.target.value)
              }
            />
          </label>
          <label>
            {text.waterUnitPrice}
            <input
              min="0"
              type="number"
              value={settingForm.waterUnitPrice}
              onChange={(event) =>
                updateSetting('waterUnitPrice', event.target.value)
              }
            />
          </label>
          <label>
            {text.internetFee}
            <input
              min="0"
              type="number"
              value={settingForm.internetFee}
              onChange={(event) =>
                updateSetting('internetFee', event.target.value)
              }
            />
          </label>
          <label>
            {text.trashFee}
            <input
              min="0"
              type="number"
              value={settingForm.trashFee}
              onChange={(event) =>
                updateSetting('trashFee', event.target.value)
              }
            />
          </label>
          <label>
            {text.parkingFeePerVehicle}
            <input
              min="0"
              type="number"
              value={settingForm.parkingFeePerVehicle}
              onChange={(event) =>
                updateSetting('parkingFeePerVehicle', event.target.value)
              }
            />
          </label>
          <label>
            {text.bankName}
            <input
              maxLength="120"
              value={settingForm.bankName}
              onChange={(event) =>
                updateSetting('bankName', event.target.value)
              }
            />
          </label>
          <label>
            {text.bankAccountNumber}
            <input
              maxLength="40"
              value={settingForm.bankAccountNumber}
              onChange={(event) =>
                updateSetting('bankAccountNumber', event.target.value)
              }
            />
          </label>
          <label>
            {text.bankAccountName}
            <input
              maxLength="120"
              value={settingForm.bankAccountName}
              onChange={(event) =>
                updateSetting('bankAccountName', event.target.value)
              }
            />
          </label>
          <label>
            {text.transferContentTemplate}
            <input
              maxLength="160"
              value={settingForm.transferContentTemplate}
              onChange={(event) =>
                updateSetting('transferContentTemplate', event.target.value)
              }
            />
          </label>
          <label>
            {text.transferNote}
            <textarea
              maxLength="500"
              rows="3"
              value={settingForm.paymentNote}
              onChange={(event) =>
                updateSetting('paymentNote', event.target.value)
              }
            />
          </label>
          <button disabled={isSavingSetting} type="submit">
            <Save className="button-icon" size={16} strokeWidth={2.5} />
            {isSavingSetting ? text.saving : text.saveSetting}
          </button>
        </form>

        <form
          className="form-panel compact-form-panel service-reading-panel"
          onSubmit={handleSaveReading}
        >
          <h2>
            <Zap className="button-icon" size={18} strokeWidth={2.4} />
            {text.readingForm}
          </h2>
          <label>
            {text.roomTenant}
            <select
              required
              value={readingForm.contract}
              onChange={(event) => selectContract(event.target.value)}
            >
              <option value="">{text.selectContract}</option>
              {activeContracts.map((contract) => (
                <option key={contract._id} value={contract._id}>
                  {getContractLabel(contract)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.electricityPrevious}
            <input
              min="0"
              required
              type="number"
              value={readingForm.electricityPrevious}
              onChange={(event) =>
                updateReading('electricityPrevious', event.target.value)
              }
            />
          </label>
          <label>
            {text.electricityCurrent}
            <input
              min="0"
              required
              type="number"
              value={readingForm.electricityCurrent}
              onChange={(event) =>
                updateReading('electricityCurrent', event.target.value)
              }
            />
          </label>
          <label>
            {text.waterPrevious}
            <input
              min="0"
              required
              type="number"
              value={readingForm.waterPrevious}
              onChange={(event) =>
                updateReading('waterPrevious', event.target.value)
              }
            />
          </label>
          <label>
            {text.waterCurrent}
            <input
              min="0"
              required
              type="number"
              value={readingForm.waterCurrent}
              onChange={(event) =>
                updateReading('waterCurrent', event.target.value)
              }
            />
          </label>
          <label>
            {text.internetFee}
            <input
              min="0"
              type="number"
              value={readingForm.internetAmount}
              onChange={(event) =>
                updateReading('internetAmount', event.target.value)
              }
            />
          </label>
          <label>
            {text.trashFee}
            <input
              min="0"
              type="number"
              value={readingForm.trashAmount}
              onChange={(event) =>
                updateReading('trashAmount', event.target.value)
              }
            />
          </label>
          <label>
            {text.parkingVehicleCount}
            <input
              min="0"
              type="number"
              value={readingForm.parkingVehicleCount}
              onChange={(event) =>
                updateReading('parkingVehicleCount', event.target.value)
              }
            />
          </label>
          <label>
            {text.note}
            <input
              value={readingForm.note}
              onChange={(event) => updateReading('note', event.target.value)}
            />
          </label>
          <div className="metric-strip">
            <div>
              <span>{text.electricity}</span>
              <strong>{preview.electricityUsage} kWh</strong>
            </div>
            <div>
              <span>{text.water}</span>
              <strong>{preview.waterUsage} m3</strong>
            </div>
            <div>
              <span>{text.serviceTotal}</span>
              <strong>{formatMoney(preview.serviceTotal)}</strong>
            </div>
          </div>
          <button disabled={isSavingReading || !selectedContract} type="submit">
            <Save className="button-icon" size={16} strokeWidth={2.5} />
            {isSavingReading ? text.saving : text.saveReading}
          </button>
        </form>
      </div>

      <div className="table-panel compact-data-table services-table-panel">
        <div className="table-panel-header">
          <h2>
            <Calculator className="button-icon" size={18} strokeWidth={2.4} />
            {text.readings}
          </h2>
        </div>
        {isLoading ? <p>{text.loading}</p> : null}
        {!isLoading && readings.length === 0 ? (
          <p>{text.emptyReadings}</p>
        ) : null}
        {!isLoading && readings.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{text.roomTenant}</th>
                <th>{text.electricity}</th>
                <th>{text.water}</th>
                <th>{text.serviceTotal}</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading._id}>
                  <td>
                    <strong>{getContractLabel(reading.contract)}</strong>
                    <span>{reading.note || text.note}</span>
                  </td>
                  <td>
                    <strong>{reading.electricityUsage} kWh</strong>
                    <span>{formatMoney(reading.electricityAmount)}</span>
                  </td>
                  <td>
                    <strong>{reading.waterUsage} m3</strong>
                    <span>{formatMoney(reading.waterAmount)}</span>
                  </td>
                  <td>
                    <strong>{formatMoney(reading.serviceTotal)}</strong>
                    <span>
                      {text.parkingVehicleCount}: {reading.parkingVehicleCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="table-panel compact-data-table services-table-panel">
        <div className="table-panel-header invoice-toolbar">
          <div>
            <h2>
              <FilePlus2 className="button-icon" size={18} strokeWidth={2.4} />
              {text.invoiceSummary}
            </h2>
            <p className="page-summary">
              {invoices.length} {text.visibleInvoices}
            </p>
          </div>
          <label className="inline-field">
            {text.dueDate}
            <input
              required
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <button
            disabled={isGenerating || !dueDate}
            type="button"
            onClick={handleGenerateInvoices}
          >
            <FilePlus2 className="button-icon" size={16} strokeWidth={2.5} />
            {isGenerating ? text.saving : text.generate}
          </button>
        </div>
        {!isLoading && invoices.length === 0 ? (
          <p>{text.emptyInvoices}</p>
        ) : null}
        {!isLoading && invoices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{text.roomTenant}</th>
                <th>{text.rent}</th>
                <th>{text.serviceAmount}</th>
                <th>{text.total}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>
                    <strong>{getContractLabel(invoice)}</strong>
                    <span>
                      {invoice.month}/{invoice.year} - {invoice.status}
                    </span>
                  </td>
                  <td>{formatMoney(invoice.rentAmount)}</td>
                  <td>{formatMoney(invoice.serviceAmount)}</td>
                  <td>
                    <strong>{formatMoney(invoice.totalAmount)}</strong>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye
                          className="button-icon"
                          size={16}
                          strokeWidth={2.5}
                        />
                        {text.view}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={invoiceDownloadId === invoice._id}
                        type="button"
                        onClick={() => handleDownloadInvoicePdf(invoice)}
                      >
                        <Download
                          className="button-icon"
                          size={16}
                          strokeWidth={2.5}
                        />
                        {invoiceDownloadId === invoice._id
                          ? text.loading
                          : 'PDF'}
                      </button>
                      {canChangeInvoice(invoice) ? (
                        <>
                          <button
                            disabled={invoiceActionId === invoice._id}
                            type="button"
                            onClick={() => handleMarkInvoicePaid(invoice)}
                          >
                            <CheckCircle2
                              className="button-icon"
                              size={16}
                              strokeWidth={2.5}
                            />
                            {text.markPaid}
                          </button>
                          <button
                            className="danger-button"
                            disabled={invoiceActionId === invoice._id}
                            type="button"
                            onClick={() => handleCancelInvoice(invoice)}
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
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
