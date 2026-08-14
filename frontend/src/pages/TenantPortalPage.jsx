import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Download, History, QrCode, RefreshCw } from 'lucide-react';
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
    invoicePdfDownloaded: 'Invoice PDF downloaded.',
    items: 'items',
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
    invoiceTotal: 'Invoice total',
    loading: 'Loading...',
    loadingData: 'Loading tenant data...',
    monthlyRent: 'Monthly rent',
    myRoom: 'My room',
    noRoom: 'No room assigned',
    openAmount: 'Open amount',
    paidAt: 'Paid at',
    paymentInstructions: 'Payment instructions',
    paymentInstructionsMissing:
      'Payment account information has not been configured yet.',
    paymentQr: 'Payment QR',
    paymentHistory: 'Payment history',
    paymentMethodCash: 'Cash',
    paymentMethodBankTransfer: 'Bank transfer',
    paymentMethodMomo: 'MoMo',
    paymentMethodVnpay: 'VNPay',
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
    services: 'Services',
    status: 'Status',
    showContractHistory: 'View contracts',
    showPaidInvoices: 'Paid invoices',
    subtitle: 'View your room, contract, invoices, and payment history.',
    term: 'Term',
    tenant: 'Tenant',
    to: 'to',
    transferContent: 'Transfer content',
  },
  vi: {
    activeContract: 'Hợp đồng đang hiệu lực',
    billing: 'Hóa đơn',
    bankAccountName: 'Chủ tài khoản',
    bankAccountNumber: 'Số tài khoản',
    bankName: 'Ngân hàng',
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
    invoicePdfDownloaded: 'Đã tải PDF hóa đơn.',
    items: 'mục',
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
    invoiceTotal: 'Tổng hóa đơn',
    loading: 'Đang tải...',
    loadingData: 'Đang tải dữ liệu khách thuê...',
    monthlyRent: 'Tiền phòng mỗi tháng',
    myRoom: 'Phòng của tôi',
    noRoom: 'Chưa gán phòng',
    openAmount: 'Số tiền cần thanh toán',
    paidAt: 'Ngày thu',
    paymentInstructions: 'Hướng dẫn thanh toán',
    paymentInstructionsMissing: 'Chủ trọ chưa cấu hình thông tin nhận tiền.',
    paymentQr: 'QR thanh toán',
    paymentHistory: 'Lịch sử thanh toán',
    paymentMethodCash: 'Tiền mặt',
    paymentMethodBankTransfer: 'Chuyển khoản',
    paymentMethodMomo: 'MoMo',
    paymentMethodVnpay: 'VNPay',
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
    services: 'Dịch vụ',
    status: 'Trạng thái',
    showContractHistory: 'Xem hợp đồng',
    showPaidInvoices: 'Hóa đơn đã thanh toán',
    subtitle: 'Xem phòng, hợp đồng, hóa đơn và lịch sử thanh toán của bạn.',
    term: 'Thời hạn',
    tenant: 'Khách thuê',
    to: 'đến',
    transferContent: 'Nội dung chuyển khoản',
  },
};

function formatDate(value, fallback = '') {
  if (!value) return fallback;
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatMoney(value) {
  return formatCurrency(value);
}

function formatInvoiceCode(invoice) {
  if (!invoice) return '';
  return `${invoice.month}/${invoice.year}`;
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

export function TenantPortalPage() {
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
  const paymentInstructions = summary.paymentInstructions;
  const hasPaymentTarget = Boolean(openInvoice);
  const transferContent = buildTransferContent(
    paymentInstructions.transferContentTemplate,
    room,
    openInvoice,
  );
  const payableTransferContent = sepayPayment?.paymentCode || transferContent;
  const paymentQrUrl = sepayPayment?.qrCodeUrl || sepayQrImage;
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
      {isLoading ? <p className="loading-note">{text.loadingData}</p> : null}

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

      <div className="dashboard-grid">
        <article className="metric-card metric-card-primary">
          <span>{text.myRoom}</span>
          <strong>{room?.name || text.noRoom}</strong>
          <small>{room ? `${text.floor} ${room.floor}` : text.noRoom}</small>
        </article>
        <article className="metric-card">
          <span>{text.monthlyRent}</span>
          <strong>{formatMoney(activeContract?.monthlyPrice || 0)}</strong>
          <small>
            {activeContract
              ? getStatusLabel(activeContract.status, text)
              : text.emptyContract}
          </small>
        </article>
        <article className="metric-card metric-card-warning">
          <span>{text.openAmount}</span>
          <strong>{formatMoney(summary.totals.openPaymentAmount)}</strong>
          <small>
            {summary.totals.openPaymentCount} {text.items}
          </small>
        </article>
        <article className="metric-card">
          <span>{text.invoiceTotal}</span>
          <strong>{formatMoney(summary.totals.openInvoiceAmount)}</strong>
          <small>
            {summary.totals.openInvoiceCount} {text.items}
          </small>
        </article>
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
              <History className="button-icon" size={16} strokeWidth={2.5} />
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

        <section className="dashboard-panel">
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
              <History className="button-icon" size={16} strokeWidth={2.5} />
              {text.showPaidInvoices} ({paidInvoices.length})
            </button>
          </div>
          {unpaidInvoices.length === 0 ? (
            <p className="empty-note">{text.emptyUnpaidInvoice}</p>
          ) : (
            <div className="alert-list">
              {unpaidInvoices.map((invoice) => (
                <article className="alert-item" key={invoice._id}>
                  <strong>
                    {text.invoice} {formatInvoiceCode(invoice)}
                  </strong>
                  <span>
                    {text.rent}: {formatMoney(invoice.rentAmount)} -{' '}
                    {text.services}: {formatMoney(invoice.serviceAmount)}
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
                  {['draft', 'issued', 'overdue'].includes(invoice.status) ? (
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
          )}
        </section>
      </div>

      <section className="payment-instruction-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{text.billing}</span>
            <h2>{text.paymentInstructions}</h2>
          </div>
        </div>
        {hasPaymentTarget ? (
          <div className="payment-instruction-grid">
            <div className="payment-qr-box">
              <span>{text.paymentQr}</span>
              <img
                alt={`${text.paymentQr} ${paymentInstructions.bankAccountName || text.invoice}`}
                src={paymentQrUrl}
              />
            </div>
            <div>
              <span>{text.bankName}</span>
              <strong>{paymentInstructions.bankName}</strong>
            </div>
            <div>
              <span>{text.bankAccountNumber}</span>
              <strong>{paymentInstructions.bankAccountNumber}</strong>
            </div>
            <div>
              <span>{text.bankAccountName}</span>
              <strong>{paymentInstructions.bankAccountName}</strong>
            </div>
            <div>
              <span>{text.invoice}</span>
              <strong>
                {openInvoice ? formatInvoiceCode(openInvoice) : '-'}
              </strong>
            </div>
            <div className="transfer-content-box">
              <span>{text.transferContent}</span>
              <strong>{payableTransferContent || '-'}</strong>
              {payableTransferContent ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleCopyTransferContent}
                >
                  <Copy className="button-icon" size={16} strokeWidth={2.5} />
                  {text.copyTransferContent}
                </button>
              ) : null}
            </div>
            {paymentInstructions.paymentNote ? (
              <p>{paymentInstructions.paymentNote}</p>
            ) : null}
            {sepayPayment ? (
              <div className="momo-payment-box">
                <span>{text.sepayCode}</span>
                <strong>{sepayPayment.paymentCode}</strong>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="empty-note">{text.paymentInstructionsMissing}</p>
        )}
      </section>

      <section className="table-panel">
        <div className="table-panel-header">
          <div>
            <span className="eyebrow">{text.billing}</span>
            <h2>{text.paymentHistory}</h2>
          </div>
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
                    <span>{getPaymentMethodLabel(payment.method, text)}</span>
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
    </section>
  );
}
