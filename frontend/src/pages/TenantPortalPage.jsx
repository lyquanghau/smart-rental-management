import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { downloadContractPdf } from '../services/contractService.js';
import { formatCurrency } from '../services/preferences.js';
import { getTenantPortalSummary } from '../services/tenantPortalService.js';

const emptySummary = {
  activeContract: null,
  contracts: [],
  invoices: [],
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
    contractHistory: 'Contract history',
    downloadPdf: 'Download PDF',
    dueDate: 'Due date',
    emptyContract: 'No contract data yet.',
    emptyInvoice: 'No invoices yet.',
    emptyPayment: 'No payment records yet.',
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
  },
  vi: {
    activeContract: 'Hop dong dang hieu luc',
    billing: 'Hoa don',
    contractHistory: 'Lich su hop dong',
    downloadPdf: 'Tai PDF',
    dueDate: 'Han thanh toan',
    emptyContract: 'Chua co du lieu hop dong.',
    emptyInvoice: 'Chua co hoa don.',
    emptyPayment: 'Chua co lich su thanh toan.',
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

export function TenantPortalPage() {
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const text = copy[language] || copy.vi;
  const [summary, setSummary] = useState(emptySummary);
  const [error, setError] = useState('');
  const [downloadingContractId, setDownloadingContractId] = useState('');
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

  const room = summary.room;
  const activeContract = summary.activeContract;

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
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

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
