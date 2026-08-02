import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { downloadContractPdf } from '../services/contractService.js';
import { downloadInvoicePdf } from '../services/invoiceService.js';
import { formatCurrency } from '../services/preferences.js';
import { getTenantPortalSummary } from '../services/tenantPortalService.js';

const emptySummary = {
  activeContract: null,
  contracts: [],
  invoices: [],
  paymentInstructions: {
    bankAccountName: '',
    bankAccountNumber: '',
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
    emptyPayment: 'No payment records yet.',
    invoicePdfDownloaded: 'Invoice PDF downloaded.',
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
    paymentHistory: 'Payment history',
    portalTitle: 'Tenant portal',
    reload: 'Reload',
    rent: 'Rent',
    services: 'Services',
    status: 'Status',
    subtitle: 'View your room, contract, invoices, and payment history.',
    term: 'Term',
    tenant: 'Tenant',
    to: 'to',
    transferContent: 'Transfer content',
  },
  vi: {
    activeContract: 'Hop dong dang hieu luc',
    billing: 'Hoa don',
    bankAccountName: 'Chu tai khoan',
    bankAccountNumber: 'So tai khoan',
    bankName: 'Ngan hang',
    contractHistory: 'Lich su hop dong',
    copiedTransferContent: 'Da copy noi dung chuyen khoan.',
    copyTransferContent: 'Copy noi dung',
    downloadPdf: 'Tai PDF',
    dueDate: 'Han thanh toan',
    emptyContract: 'Chua co du lieu hop dong.',
    emptyInvoice: 'Chua co hoa don.',
    emptyPayment: 'Chua co lich su thanh toan.',
    invoicePdfDownloaded: 'Da tai PDF hoa don.',
    floor: 'Tang',
    invoice: 'Hoa don',
    invoiceTotal: 'Tong hoa don',
    loading: 'Dang tai...',
    loadingData: 'Dang tai du lieu khach thue...',
    monthlyRent: 'Tien phong moi thang',
    myRoom: 'Phong cua toi',
    noRoom: 'Chua gan phong',
    openAmount: 'So tien can thanh toan',
    paidAt: 'Ngay thu',
    paymentInstructions: 'Huong dan thanh toan',
    paymentInstructionsMissing: 'Chu tro chua cau hinh thong tin nhan tien.',
    paymentHistory: 'Lich su thanh toan',
    portalTitle: 'Cong khach thue',
    reload: 'Tai lai',
    rent: 'Tien phong',
    services: 'Dich vu',
    status: 'Trang thai',
    subtitle: 'Xem phong, hop dong, hoa don va lich su thanh toan cua ban.',
    term: 'Thoi han',
    tenant: 'Khach thue',
    to: 'den',
    transferContent: 'Noi dung chuyen khoan',
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
  const fallback = 'Thanh toan phong {room} thang {month}-{year}';

  return (template || fallback)
    .replaceAll('{room}', room?.name || 'N/A')
    .replaceAll('{month}', String(invoice.month || ''))
    .replaceAll('{year}', String(invoice.year || ''));
}

export function TenantPortalPage() {
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const text = copy[language] || copy.vi;
  const [summary, setSummary] = useState(emptySummary);
  const [error, setError] = useState('');
  const [downloadingContractId, setDownloadingContractId] = useState('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
  const openInvoice = useMemo(
    () =>
      summary.invoices.find((invoice) =>
        ['draft', 'issued', 'overdue'].includes(invoice.status),
      ) || null,
    [summary.invoices],
  );
  const paymentInstructions = summary.paymentInstructions;
  const transferContent = buildTransferContent(
    paymentInstructions.transferContentTemplate,
    room,
    openInvoice,
  );

  async function handleCopyTransferContent() {
    if (!transferContent) return;

    await navigator.clipboard.writeText(transferContent);
    showSuccess(text.copiedTransferContent);
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

      <div className="dashboard-grid">
        <article className="metric-card metric-card-primary">
          <span>{text.myRoom}</span>
          <strong>{room?.name || text.noRoom}</strong>
          <small>{room ? `${text.floor} ${room.floor}` : text.noRoom}</small>
        </article>
        <article className="metric-card">
          <span>{text.monthlyRent}</span>
          <strong>{formatMoney(activeContract?.monthlyPrice || 0)}</strong>
          <small>{activeContract?.status || text.emptyContract}</small>
        </article>
        <article className="metric-card metric-card-warning">
          <span>{text.openAmount}</span>
          <strong>{formatMoney(summary.totals.openPaymentAmount)}</strong>
          <small>{summary.totals.openPaymentCount} items</small>
        </article>
        <article className="metric-card">
          <span>{text.invoiceTotal}</span>
          <strong>{formatMoney(summary.totals.openInvoiceAmount)}</strong>
          <small>{summary.totals.openInvoiceCount} items</small>
        </article>
      </div>

      <div className="work-queue-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.activeContract}</span>
              <h2>{text.contractHistory}</h2>
            </div>
          </div>
          {summary.contracts.length === 0 ? (
            <p className="empty-note">{text.emptyContract}</p>
          ) : (
            <div className="alert-list">
              {summary.contracts.map((contract) => (
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
          </div>
          {summary.invoices.length === 0 ? (
            <p className="empty-note">{text.emptyInvoice}</p>
          ) : (
            <div className="alert-list">
              {summary.invoices.map((invoice) => (
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
                    {invoice.status}
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
        {paymentInstructions.isConfigured ? (
          <div className="payment-instruction-grid">
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
              <strong>{transferContent || '-'}</strong>
              {transferContent ? (
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
                    <span>{payment.method}</span>
                  </td>
                  <td>
                    <strong>{formatDate(payment.dueDate)}</strong>
                    <span>
                      {text.paidAt}: {formatDate(payment.paidAt, '-')}
                    </span>
                  </td>
                  <td>
                    <strong>{formatMoney(payment.amount)}</strong>
                  </td>
                  <td>
                    <strong>{payment.status}</strong>
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
