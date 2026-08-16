import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Car,
  Copy,
  Download,
  Droplets,
  History,
  Home,
  QrCode,
  ReceiptText,
  RefreshCw,
  Trash2,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { downloadContractPdf } from '../services/contractService.js';
import {
  createSepayPaymentCode,
  downloadInvoicePdf,
} from '../services/invoiceService.js';
import { formatCurrency } from '../services/preferences.js';
import { getTenantPortalSummary } from '../services/tenantPortalService.js';
import sepayQrImage from '../assets/payment/sepay-qr-qronly.png';

const emptySummary = {
  activeContract: null,
  contracts: [],
  invoices: [],
  paymentInstructions: {
    bankAccountName: '',
    bankAccountNumber: '',
    bankCode: '',
    bankName: '',
    isConfigured: false,
    paymentNote: '',
    transferContentTemplate: '',
  },
  payments: [],
  room: null,
  serviceRates: {
    electricityUnitPrice: 0,
    internetFee: 0,
    parkingFeePerVehicle: 0,
    trashFee: 0,
    waterUnitPrice: 0,
  },
  tenant: null,
  totals: {
    openInvoiceAmount: 0,
    openInvoiceCount: 0,
    openPaymentAmount: 0,
    openPaymentCount: 0,
  },
};

const copy = {
  en: {
    activeContract: 'Active contract',
    billing: 'Billing',
    bankAccountName: 'Account holder',
    bankAccountNumber: 'Account number',
    bankName: 'Bank',
    contractDeposit: 'Deposit',
    contractHistory: 'Contract history',
    copiedTransferContent: 'Transfer content copied.',
    copyTransferContent: 'Copy content',
    downloadPdf: 'Download PDF',
    dueDate: 'Due date',
    emptyContract: 'No contract data yet.',
    emptyInvoice: 'No invoices yet.',
    emptyPaidInvoice: 'No paid invoices yet.',
    emptyUnpaidInvoice: 'No unpaid invoices.',
    emptyPayment: 'No payment records yet.',
    electricity: 'Electricity',
    electricityIndex: 'Electricity index',
    invoicePdfDownloaded: 'Invoice PDF downloaded.',
    invoicePeriod: 'Period',
    invoiceServices: 'Service details',
    invoiceTotal: 'Invoice total',
    items: 'items',
    internet: 'Internet',
    maxOccupants: 'Capacity',
    sepayPaymentCreated: 'SePay payment code created.',
    momoPaymentFailed: 'MoMo payment was not completed.',
    momoPaymentReturned:
      'MoMo returned a successful result. Waiting for IPN confirmation.',
    paymentAmount: 'Amount',
    paymentCode: 'Payment content',
    scanToPay: 'Scan this QR to pay',
    sepayPay: 'Show payment QR',
    sepayCode: 'Payment code',
    floor: 'Floor',
    invoice: 'Invoice',
    loading: 'Loading...',
    monthlyRent: 'Monthly rent',
    monthlyCostSummary: 'Monthly costs',
    myRoom: 'My room',
    newIndex: 'New index',
    noBreakdown: 'No service breakdown for this invoice yet.',
    noMonthlyCost: 'No monthly cost data yet.',
    noRoom: 'No room assigned',
    oldIndex: 'Old index',
    occupants: 'Occupants',
    openAmount: 'Open amount',
    paidAt: 'Paid at',
    paymentInstructions: 'Payment instructions',
    paymentInstructionsMissing:
      'Payment account information has not been configured yet.',
    paymentQr: 'Payment QR',
    paymentQrNote:
      'Note: Please transfer the exact amount and keep the payment content unchanged.',
    paymentHistory: 'Payment history',
    paymentMethodCash: 'Cash',
    paymentMethodBankTransfer: 'Bank transfer',
    paymentMethodMomo: 'MoMo',
    paymentMethodVnpay: 'VNPay',
    parking: 'Parking',
    people: 'people',
    statusActive: 'Active',
    statusCancelled: 'Cancelled',
    statusDraft: 'Draft',
    statusEnded: 'Ended',
    statusIssued: 'Issued',
    statusOverdue: 'Overdue',
    statusPaid: 'Paid',
    statusPending: 'Pending',
    portalTitle: 'Tenant portal',
    reload: 'Reload',
    rent: 'Rent',
    roomAndContract: 'Room and contract',
    services: 'Services',
    serviceRates: 'Service rates',
    status: 'Status',
    showContractHistory: 'View contracts',
    showPaidInvoices: 'Paid invoices',
    subtitle: 'View your room, contract, invoices, and payment history.',
    term: 'Term',
    tenant: 'Tenant',
    to: 'to',
    transferContent: 'Transfer content',
    trash: 'Trash',
    usage: 'Usage',
    water: 'Water',
    waterIndex: 'Water index',
  },
  vi: {
    activeContract: 'Hợp đồng đang hiệu lực',
    billing: 'Hóa đơn',
    bankAccountName: 'Chủ tài khoản',
    bankAccountNumber: 'Số tài khoản',
    bankName: 'Ngân hàng',
    contractDeposit: 'Tiền cọc',
    contractHistory: 'Lịch sử hợp đồng',
    copiedTransferContent: 'Đã sao chép nội dung chuyển khoản.',
    copyTransferContent: 'Sao chép nội dung',
    downloadPdf: 'Tải PDF',
    dueDate: 'Hạn thanh toán',
    emptyContract: 'Chưa có dữ liệu hợp đồng.',
    emptyInvoice: 'Chưa có hóa đơn.',
    emptyPaidInvoice: 'Chưa có hóa đơn đã thanh toán.',
    emptyUnpaidInvoice: 'Không có hóa đơn cần thanh toán.',
    emptyPayment: 'Chưa có lịch sử thanh toán.',
    electricity: 'Điện',
    electricityIndex: 'Chỉ số điện',
    invoicePdfDownloaded: 'Đã tải PDF hóa đơn.',
    invoicePeriod: 'Kỳ hóa đơn',
    invoiceServices: 'Chi tiết dịch vụ',
    invoiceTotal: 'Tổng hóa đơn',
    items: 'mục',
    internet: 'Internet',
    maxOccupants: 'Sức chứa',
    sepayPaymentCreated: 'Đã tạo mã thanh toán SePay.',
    momoPaymentFailed: 'Giao dịch MoMo chưa hoàn tất.',
    momoPaymentReturned:
      'MoMo trả về kết quả thành công. Đang chờ IPN xác nhận.',
    paymentAmount: 'Số tiền',
    paymentCode: 'Nội dung thanh toán',
    scanToPay: 'Quét QR này để thanh toán',
    sepayPay: 'Hiện QR thanh toán',
    sepayCode: 'Mã thanh toán',
    floor: 'Tầng',
    invoice: 'Hóa đơn',
    loading: 'Đang tải...',
    monthlyRent: 'Tiền phòng mỗi tháng',
    monthlyCostSummary: 'Chi phí trong tháng',
    myRoom: 'Phòng của tôi',
    newIndex: 'Số mới',
    noBreakdown: 'Hóa đơn này chưa có chi tiết dịch vụ.',
    noMonthlyCost: 'Chưa có dữ liệu chi phí tháng.',
    noRoom: 'Chưa gán phòng',
    oldIndex: 'Số cũ',
    occupants: 'Người ở',
    openAmount: 'Số tiền cần thanh toán',
    paidAt: 'Ngày thu',
    paymentInstructions: 'Hướng dẫn thanh toán',
    paymentInstructionsMissing: 'Chủ trọ chưa cấu hình thông tin nhận tiền.',
    paymentQr: 'QR thanh toán',
    paymentQrNote:
      'Lưu ý: Vui lòng chuyển đúng số tiền và giữ nguyên nội dung chuyển khoản.',
    paymentHistory: 'Lịch sử thanh toán',
    paymentMethodCash: 'Tiền mặt',
    paymentMethodBankTransfer: 'Chuyển khoản',
    paymentMethodMomo: 'MoMo',
    paymentMethodVnpay: 'VNPay',
    parking: 'Gửi xe',
    people: 'người',
    statusActive: 'Đang hiệu lực',
    statusCancelled: 'Đã hủy',
    statusDraft: 'Bản nháp',
    statusEnded: 'Đã kết thúc',
    statusIssued: 'Đã phát hành',
    statusOverdue: 'Quá hạn',
    statusPaid: 'Đã thanh toán',
    statusPending: 'Chờ thu',
    portalTitle: 'Cổng khách thuê',
    reload: 'Tải lại',
    rent: 'Tiền phòng',
    roomAndContract: 'Phòng và hợp đồng',
    services: 'Dịch vụ',
    serviceRates: 'Đơn giá dịch vụ',
    status: 'Trạng thái',
    showContractHistory: 'Xem hợp đồng',
    showPaidInvoices: 'Hóa đơn đã thanh toán',
    subtitle: 'Xem phòng, hợp đồng, hóa đơn và lịch sử thanh toán của bạn.',
    term: 'Thời hạn',
    tenant: 'Khách thuê',
    to: 'đến',
    transferContent: 'Nội dung chuyển khoản',
    trash: 'Rác',
    usage: 'Sử dụng',
    water: 'Nước',
    waterIndex: 'Chỉ số nước',
  },
};

function formatDate(value, fallback = '') {
  if (!value) return fallback;
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatMoney(value) {
  return formatCurrency(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatInvoiceCode(invoice) {
  if (!invoice) return '';
  return `${invoice.month}/${invoice.year}`;
}

function getOccupantCount(contract) {
  return contract ? 1 + (contract.occupants?.length || 0) : 0;
}

function getVehicleCount(contract) {
  return Number(contract?.vehicleCount || 0);
}

function buildTransferContent(template, room, invoice) {
  if (!invoice) return '';
  const fallback = 'Thanh toán phòng {room} tháng {month}-{year}';

  return (template || fallback)
    .replaceAll('{room}', room?.name || 'N/A')
    .replaceAll('{month}', String(invoice.month || ''))
    .replaceAll('{year}', String(invoice.year || ''));
}

function getStatusLabel(status, text) {
  const labels = {
    active: text.statusActive,
    cancelled: text.statusCancelled,
    draft: text.statusDraft,
    ended: text.statusEnded,
    issued: text.statusIssued,
    overdue: text.statusOverdue,
    paid: text.statusPaid,
    pending: text.statusPending,
  };

  return labels[status] || status || text.statusPending;
}

function getPaymentMethodLabel(method, text) {
  const labels = {
    bank_transfer: text.paymentMethodBankTransfer,
    cash: text.paymentMethodCash,
    momo: text.paymentMethodMomo,
    vnpay: text.paymentMethodVnpay,
  };

  return labels[method] || method || text.paymentMethodCash;
}

function getPaymentReference(payment) {
  return (
    payment.providerOrderId ||
    payment.providerReference ||
    payment.invoice?.paymentOrderId ||
    payment.invoice?.paidReference ||
    ''
  );
}

export function TenantPortalPage({ defaultTab = 'overview' }) {
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const text = copy[language] || copy.vi;
  const [summary, setSummary] = useState(emptySummary);
  const [error, setError] = useState('');
  const [downloadingContractId, setDownloadingContractId] = useState('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState('');
  const [isContractHistoryOpen, setIsContractHistoryOpen] = useState(false);
  const [isPaidInvoiceOpen, setIsPaidInvoiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentActionId, setPaymentActionId] = useState('');
  const [sepayPayment, setSepayPayment] = useState(null);
  const activeTab = defaultTab;

  async function loadSummary() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getTenantPortalSummary();
      setSummary({
        ...emptySummary,
        ...data,
        totals: {
          ...emptySummary.totals,
          ...(data.totals || {}),
        },
        serviceRates: {
          ...emptySummary.serviceRates,
          ...(data.serviceRates || {}),
        },
      });
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');

    if (!resultCode && !orderId) return;

    if (resultCode === '0') {
      showSuccess(text.momoPaymentReturned);
    } else {
      showError(text.momoPaymentFailed);
    }

    loadSummary();
    setSearchParams({}, { replace: true });
  }, []);

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
      showSuccess(text.downloadPdf);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setDownloadingContractId('');
    }
  }

  async function handleDownloadInvoicePdf(invoice) {
    setDownloadingInvoiceId(invoice._id);
    setError('');

    try {
      const pdfBlob = await downloadInvoicePdf(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const roomName = invoice.room?.name || summary.room?.name || 'hoa-don';

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
      setDownloadingInvoiceId('');
    }
  }

  const room = summary.room;
  const activeContract = summary.activeContract;
  const activeContracts = useMemo(
    () =>
      summary.contracts.filter(
        (contract) => contract.status === 'active' && !contract.deletedAt,
      ),
    [summary.contracts],
  );
  const unpaidInvoices = useMemo(
    () =>
      summary.invoices.filter((invoice) =>
        ['draft', 'issued', 'overdue'].includes(invoice.status),
      ),
    [summary.invoices],
  );
  const paidInvoices = useMemo(
    () => summary.invoices.filter((invoice) => invoice.status === 'paid'),
    [summary.invoices],
  );
  const openInvoice = useMemo(
    () => unpaidInvoices[0] || null,
    [unpaidInvoices],
  );
  const billingCostInvoice = openInvoice || summary.invoices[0] || null;
  const billingReading = billingCostInvoice?.utilityReading || null;
  const occupantCount = getOccupantCount(activeContract);
  const vehicleCount = getVehicleCount(activeContract);
  const paymentInstructions = summary.paymentInstructions;
  const serviceRates = summary.serviceRates || emptySummary.serviceRates;
  const transferContent = buildTransferContent(
    paymentInstructions.transferContentTemplate,
    room,
    openInvoice,
  );
  const payableTransferContent = sepayPayment?.paymentCode || transferContent;
  const paymentQrUrl = sepayPayment?.qrCodeUrl || sepayQrImage;
  const sepayInvoiceId = sepayPayment?.invoiceId || '';
  async function handleCopyTransferContent() {
    if (!payableTransferContent) return;

    await navigator.clipboard.writeText(payableTransferContent);
    showSuccess(text.copiedTransferContent);
  }

  async function handleCreateSepayPayment(invoice) {
    setPaymentActionId(invoice._id);
    setError('');

    try {
      const payment = await createSepayPaymentCode(invoice._id);
      setSepayPayment(payment);
      showSuccess(text.sepayPaymentCreated);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setPaymentActionId('');
    }
  }

  const metricCards = (
    <div className="dashboard-grid tenant-metric-grid">
      <article className="metric-card metric-card-primary">
        <div className="metric-card-icon">
          <Home size={18} strokeWidth={2.5} />
        </div>
        <span>{text.myRoom}</span>
        <strong>{room?.name || text.noRoom}</strong>
        <small>{room ? `${text.floor} ${room.floor}` : text.noRoom}</small>
      </article>
      <article className="metric-card">
        <div className="metric-card-icon">
          <Banknote size={18} strokeWidth={2.5} />
        </div>
        <span>{text.monthlyRent}</span>
        <strong>{formatMoney(activeContract?.monthlyPrice || 0)}</strong>
        <small>
          {activeContract
            ? getStatusLabel(activeContract.status, text)
            : text.emptyContract}
        </small>
      </article>
      <article className="metric-card metric-card-warning">
        <div className="metric-card-icon">
          <QrCode size={18} strokeWidth={2.5} />
        </div>
        <span>{text.openAmount}</span>
        <strong>{formatMoney(summary.totals.openPaymentAmount)}</strong>
        <small>
          {summary.totals.openPaymentCount} {text.items}
        </small>
      </article>
      <article className="metric-card">
        <div className="metric-card-icon">
          <ReceiptText size={18} strokeWidth={2.5} />
        </div>
        <span>{text.invoiceTotal}</span>
        <strong>{formatMoney(summary.totals.openInvoiceAmount)}</strong>
        <small>
          {summary.totals.openInvoiceCount} {text.items}
        </small>
      </article>
    </div>
  );

  const monthlyCostPanel = (
    <section className="dashboard-panel tenant-monthly-cost-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{text.billing}</span>
          <h2>{text.monthlyCostSummary}</h2>
        </div>
        <ReceiptText size={20} strokeWidth={2.4} />
      </div>

      {billingCostInvoice ? (
        <div className="monthly-cost-text">
          <p>
            <strong>{text.invoicePeriod}</strong>:{' '}
            {formatInvoiceCode(billingCostInvoice)} - {text.dueDate}:{' '}
            {formatDate(billingCostInvoice.dueDate)}
          </p>
          <p>
            <strong>{text.rent}</strong>:{' '}
            {formatMoney(billingCostInvoice.rentAmount)}
          </p>
          <p>
            <strong>{text.electricity}</strong>: {text.oldIndex}{' '}
            {formatNumber(billingReading?.electricityPrevious)}, {text.newIndex}{' '}
            {formatNumber(billingReading?.electricityCurrent)}, {text.usage}{' '}
            {formatNumber(billingReading?.electricityUsage)} kWh ={' '}
            {formatMoney(billingReading?.electricityAmount)}
          </p>
          <p>
            <strong>{text.water}</strong>: {text.usage}{' '}
            {formatNumber(billingReading?.waterUsage)} {text.people} ={' '}
            {formatMoney(billingReading?.waterAmount)}
          </p>
          <p>
            <strong>{text.internet}</strong>:{' '}
            {formatMoney(billingReading?.internetAmount)} -{' '}
            <strong>{text.trash}</strong>:{' '}
            {formatMoney(billingReading?.trashAmount)} -{' '}
            <strong>{text.parking}</strong>:{' '}
            {formatNumber(billingReading?.parkingVehicleCount || vehicleCount)}{' '}
            xe = {formatMoney(billingReading?.parkingAmount)}
          </p>
          <p>
            <strong>{text.services}</strong>:{' '}
            {formatMoney(billingCostInvoice.serviceAmount)}
          </p>
          <p className="monthly-cost-total-line">
            <strong>{text.invoiceTotal}</strong>:{' '}
            {formatMoney(billingCostInvoice.totalAmount)}
          </p>
        </div>
      ) : (
        <p className="empty-note">{text.noMonthlyCost}</p>
      )}
    </section>
  );

  return (
    <section className="dashboard-page tenant-portal-page">
      <div className="dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">{text.tenant}</span>
          <h1>{text.portalTitle}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="hero-actions">
          <div className="hero-status">
            <span>{text.openAmount}</span>
            <strong>{formatMoney(summary.totals.openPaymentAmount)}</strong>
            <small>
              {summary.totals.openPaymentCount} {text.invoice}
            </small>
          </div>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadSummary}
          >
            <RefreshCw className="button-icon" size={16} strokeWidth={2.5} />
            {isLoading ? text.loading : text.reload}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <Modal
        isOpen={isContractHistoryOpen}
        panelClassName="tenant-history-modal"
        title={text.contractHistory}
        onClose={() => setIsContractHistoryOpen(false)}
      >
        <div className="table-panel compact-data-table modal-table-panel">
          {summary.contracts.length === 0 ? <p>{text.emptyContract}</p> : null}

          {summary.contracts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.myRoom}</th>
                  <th>{text.term}</th>
                  <th>{text.monthlyRent}</th>
                  <th>{text.status}</th>
                  <th>{text.downloadPdf}</th>
                </tr>
              </thead>
              <tbody>
                {summary.contracts.map((contract) => (
                  <tr key={contract._id}>
                    <td>
                      <strong>{contract.room?.name || text.noRoom}</strong>
                      <span>
                        {contract.room
                          ? `${text.floor} ${contract.room.floor}`
                          : text.noRoom}
                      </span>
                    </td>
                    <td>
                      <strong>{formatDate(contract.startDate)}</strong>
                      <span>
                        {text.to} {formatDate(contract.endDate)}
                      </span>
                    </td>
                    <td>
                      <strong>{formatMoney(contract.monthlyPrice)}</strong>
                    </td>
                    <td>
                      <strong>{getStatusLabel(contract.status, text)}</strong>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        disabled={downloadingContractId === contract._id}
                        type="button"
                        onClick={() => handleDownloadPdf(contract)}
                      >
                        <Download
                          className="button-icon"
                          size={16}
                          strokeWidth={2.5}
                        />
                        {downloadingContractId === contract._id
                          ? text.loading
                          : text.downloadPdf}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={isPaidInvoiceOpen}
        panelClassName="tenant-history-modal"
        title={text.showPaidInvoices}
        onClose={() => setIsPaidInvoiceOpen(false)}
      >
        <div className="table-panel compact-data-table modal-table-panel">
          {paidInvoices.length === 0 ? <p>{text.emptyPaidInvoice}</p> : null}

          {paidInvoices.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.invoice}</th>
                  <th>{text.dueDate}</th>
                  <th>{text.invoiceTotal}</th>
                  <th>{text.status}</th>
                  <th>{text.downloadPdf}</th>
                </tr>
              </thead>
              <tbody>
                {paidInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <strong>
                        {text.invoice} {formatInvoiceCode(invoice)}
                      </strong>
                      <span>
                        {invoice.room?.name || room?.name || text.noRoom}
                      </span>
                    </td>
                    <td>
                      <strong>{formatDate(invoice.dueDate)}</strong>
                      <span>
                        {text.paidAt}: {formatDate(invoice.paidAt, '-')}
                      </span>
                    </td>
                    <td>
                      <strong>{formatMoney(invoice.totalAmount)}</strong>
                    </td>
                    <td>
                      <strong>{getStatusLabel(invoice.status, text)}</strong>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        disabled={downloadingInvoiceId === invoice._id}
                        type="button"
                        onClick={() => handleDownloadInvoicePdf(invoice)}
                      >
                        <Download
                          className="button-icon"
                          size={16}
                          strokeWidth={2.5}
                        />
                        {downloadingInvoiceId === invoice._id
                          ? text.loading
                          : text.downloadPdf}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </Modal>

      {activeTab === 'overview' ? (
        <>
          {metricCards}

          <div className="tenant-overview-grid">
            <section className="dashboard-panel tenant-info-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">{text.myRoom}</span>
                  <h2>{text.roomAndContract}</h2>
                </div>
                <Home size={20} strokeWidth={2.4} />
              </div>
              <div className="tenant-info-list">
                <div>
                  <span>{text.myRoom}</span>
                  <strong>{room?.name || text.noRoom}</strong>
                </div>
                <div>
                  <span>{text.floor}</span>
                  <strong>{room ? room.floor : '-'}</strong>
                </div>
                <div>
                  <span>{text.maxOccupants}</span>
                  <strong>
                    {room?.maxOccupants
                      ? `${room.maxOccupants} ${text.people}`
                      : '-'}
                  </strong>
                </div>
                <div>
                  <span>{text.occupants}</span>
                  <strong>{occupantCount || '-'}</strong>
                </div>
                <div>
                  <span>So xe</span>
                  <strong>{vehicleCount}</strong>
                </div>
                <div>
                  <span>{text.contractDeposit}</span>
                  <strong>{formatMoney(activeContract?.deposit || 0)}</strong>
                </div>
                <div>
                  <span>{text.term}</span>
                  <strong>
                    {activeContract
                      ? `${formatDate(activeContract.startDate)} ${text.to} ${formatDate(
                          activeContract.endDate,
                        )}`
                      : '-'}
                  </strong>
                </div>
              </div>
            </section>

            <section className="dashboard-panel tenant-info-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">{text.services}</span>
                  <h2>{text.serviceRates}</h2>
                </div>
                <Wrench size={20} strokeWidth={2.4} />
              </div>
              <div className="tenant-info-list service-rate-list">
                <div>
                  <Zap
                    className="service-rate-icon"
                    size={18}
                    strokeWidth={2.4}
                  />
                  <span>{text.electricity}</span>
                  <strong>
                    {formatMoney(serviceRates.electricityUnitPrice)} / kWh
                  </strong>
                </div>
                <div>
                  <Droplets
                    className="service-rate-icon"
                    size={18}
                    strokeWidth={2.4}
                  />
                  <span>{text.water}</span>
                  <strong>
                    {formatMoney(serviceRates.waterUnitPrice)} / {text.people}
                  </strong>
                </div>
                <div>
                  <Wifi
                    className="service-rate-icon"
                    size={18}
                    strokeWidth={2.4}
                  />
                  <span>{text.internet}</span>
                  <strong>{formatMoney(serviceRates.internetFee)}</strong>
                </div>
                <div>
                  <Trash2
                    className="service-rate-icon"
                    size={18}
                    strokeWidth={2.4}
                  />
                  <span>{text.trash}</span>
                  <strong>{formatMoney(serviceRates.trashFee)}</strong>
                </div>
                <div>
                  <Car
                    className="service-rate-icon"
                    size={18}
                    strokeWidth={2.4}
                  />
                  <span>{text.parking}</span>
                  <strong>
                    {formatMoney(serviceRates.parkingFeePerVehicle)} / xe
                  </strong>
                </div>
              </div>
            </section>
          </div>

          <div className="work-queue-grid">
            <section className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">{text.activeContract}</span>
                  <h2>{text.activeContract}</h2>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIsContractHistoryOpen(true)}
                >
                  <History
                    className="button-icon"
                    size={16}
                    strokeWidth={2.5}
                  />
                  {text.showContractHistory} ({summary.contracts.length})
                </button>
              </div>
              {activeContracts.length === 0 ? (
                <p className="empty-note">{text.emptyContract}</p>
              ) : (
                <div className="alert-list">
                  {activeContracts.map((contract) => (
                    <article className="alert-item" key={contract._id}>
                      <strong>{contract.room?.name || text.noRoom}</strong>
                      <span>
                        {text.term}: {formatDate(contract.startDate)} {text.to}{' '}
                        {formatDate(contract.endDate)}
                      </span>
                      <small>
                        {text.monthlyRent}: {formatMoney(contract.monthlyPrice)}
                      </small>
                      <button
                        className="secondary-button"
                        disabled={downloadingContractId === contract._id}
                        type="button"
                        onClick={() => handleDownloadPdf(contract)}
                      >
                        <Download
                          className="button-icon"
                          size={16}
                          strokeWidth={2.5}
                        />
                        {downloadingContractId === contract._id
                          ? text.loading
                          : text.downloadPdf}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="tenant-billing-layout">
            <aside className="tenant-billing-summary">{monthlyCostPanel}</aside>

            <div className="tenant-billing-main">
              <section className="dashboard-panel tenant-open-invoice-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">{text.billing}</span>
                    <h2>{text.invoice}</h2>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setIsPaidInvoiceOpen(true)}
                  >
                    <History
                      className="button-icon"
                      size={16}
                      strokeWidth={2.5}
                    />
                    {text.showPaidInvoices} ({paidInvoices.length})
                  </button>
                </div>
                {unpaidInvoices.length === 0 ? (
                  <p className="empty-note">{text.emptyUnpaidInvoice}</p>
                ) : (
                  <div className="tenant-invoice-payment-grid">
                    <div className="alert-list">
                      {unpaidInvoices.map((invoice) => (
                        <article className="alert-item" key={invoice._id}>
                          <strong>
                            {text.invoice} {formatInvoiceCode(invoice)}
                          </strong>
                          <span>
                            {text.rent}: {formatMoney(invoice.rentAmount)} -{' '}
                            {text.services}:{' '}
                            {formatMoney(invoice.serviceAmount)}
                          </span>
                          <small>
                            {text.dueDate}: {formatDate(invoice.dueDate)} -{' '}
                            {getStatusLabel(invoice.status, text)}
                          </small>
                          <button
                            className="secondary-button"
                            disabled={downloadingInvoiceId === invoice._id}
                            type="button"
                            onClick={() => handleDownloadInvoicePdf(invoice)}
                          >
                            <Download
                              className="button-icon"
                              size={16}
                              strokeWidth={2.5}
                            />
                            {downloadingInvoiceId === invoice._id
                              ? text.loading
                              : text.downloadPdf}
                          </button>
                          {['draft', 'issued', 'overdue'].includes(
                            invoice.status,
                          ) ? (
                            <button
                              className="secondary-button"
                              disabled={paymentActionId === invoice._id}
                              type="button"
                              onClick={() => handleCreateSepayPayment(invoice)}
                            >
                              <QrCode
                                className="button-icon"
                                size={16}
                                strokeWidth={2.5}
                              />
                              {paymentActionId === invoice._id
                                ? text.loading
                                : text.sepayPay}
                            </button>
                          ) : null}
                        </article>
                      ))}
                    </div>
                    <div className="tenant-qr-slot">
                      {sepayInvoiceId ? (
                        <>
                          <img
                            alt={`${text.paymentQr} ${room?.name || text.invoice}`}
                            src={paymentQrUrl}
                          />
                          <div>
                            <span>{text.sepayCode}</span>
                            <strong>{payableTransferContent}</strong>
                            <small>{text.paymentQrNote}</small>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={handleCopyTransferContent}
                            >
                              <Copy
                                className="button-icon"
                                size={16}
                                strokeWidth={2.5}
                              />
                              {text.copyTransferContent}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <QrCode size={42} strokeWidth={1.9} />
                          <span>{text.paymentQr}</span>
                          <small>{text.paymentQrNote}</small>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          <section className="table-panel tenant-payment-history-panel">
            <div className="table-panel-header">
              <div>
                <span className="eyebrow">{text.billing}</span>
                <h2>{text.paymentHistory}</h2>
              </div>
              <History size={20} strokeWidth={2.4} />
            </div>

            {summary.payments.length === 0 ? (
              <p>{text.emptyPayment}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{text.invoice}</th>
                    <th>{text.dueDate}</th>
                    <th>{text.openAmount}</th>
                    <th>{text.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        <strong>
                          {payment.invoice
                            ? formatInvoiceCode(payment.invoice)
                            : payment.note || text.invoice}
                        </strong>
                        <span>
                          {getPaymentMethodLabel(payment.method, text)}
                        </span>
                      </td>
                      <td>
                        <strong>{formatDate(payment.dueDate)}</strong>
                        <span>
                          {text.paidAt}: {formatDate(payment.paidAt, '-')}
                        </span>
                      </td>
                      <td>
                        <strong>{formatMoney(payment.amount)}</strong>
                        {getPaymentReference(payment) ? (
                          <span>
                            {text.paymentCode}: {getPaymentReference(payment)}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <strong>{getStatusLabel(payment.status, text)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </section>
  );
}
