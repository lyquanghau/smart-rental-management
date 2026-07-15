import React, { useEffect, useState } from 'react';
import { usePreferences } from '../hooks/usePreferences.js';
import { getDashboardSummary } from '../services/dashboardService.js';
import { formatCurrency } from '../services/preferences.js';

const emptySummary = {
  rooms: {
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  },
  tenants: {
    active: 0,
  },
  contracts: {
    active: 0,
    ended: 0,
    cancelled: 0,
  },
  payments: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    pendingAmount: 0,
    paidAmount: 0,
    pendingCount: 0,
    paidCount: 0,
    overdueCount: 0,
  },
  revenue: {
    currentMonth: 0,
    previousMonth: 0,
    previousMonthPaidCount: 0,
  },
  alerts: {
    expiringContracts: [],
    unpaidPayments: [],
  },
};

function formatMoney(value) {
  return formatCurrency(value);
}

const copy = {
  en: {
    activeTenants: 'Active tenants',
    cashFlow: 'Cash flow',
    collected: 'Collected',
    collectedItems: (count) => `${count} collected items`,
    contractEmpty: 'No contracts need renewal within 30 days.',
    contracts: 'Contracts',
    contractsPayments: 'contracts/payments',
    dashboardTitle: 'Rental management',
    due: 'Due',
    expiring: 'Expiring within 30 days',
    expires: 'Expires',
    items: 'items',
    itemsToReview: 'items to review',
    lastMonth: 'Last month',
    loading: 'Loading...',
    loadingMetrics: 'Loading the latest metrics...',
    needsAttention: 'Needs attention',
    noPayment: 'No pending or overdue payments.',
    noRevenue: 'No revenue data yet',
    noRevenueLastMonth: 'No revenue recorded last month',
    noRoom: 'No room',
    noTenant: 'No tenant',
    notAvailable: 'Not available',
    occupied: 'occupied',
    operationsOverview: 'Operations overview',
    overdue: 'Overdue',
    paidStatus: 'Payment status',
    paymentPending: 'Pending',
    payments: 'Payments',
    receivables: 'Receivables',
    reload: 'Reload data',
    revenueComparison: 'Revenue comparison',
    revenueThisMonth: 'This month revenue',
    sameRevenue: 'Same as last month',
    thisMonth: 'This month',
    totalRooms: 'Total rooms',
    trackPrefix: 'Track rooms, contracts, and monthly receivables',
    available: 'available',
    trend: (delta, percent) =>
      `${delta > 0 ? 'Up' : 'Down'} ${Math.abs(percent)}% from last month`,
  },
  vi: {
    activeTenants: 'Khách đang ở',
    cashFlow: 'Dòng tiền',
    collected: 'Đã thu',
    collectedItems: (count) => `${count} khoản đã thu`,
    contractEmpty: 'Không có hợp đồng cần gia hạn trong 30 ngày.',
    contracts: 'Hợp đồng',
    contractsPayments: 'hợp đồng/khoản thu',
    dashboardTitle: 'Quản lý khu trọ',
    due: 'Hạn',
    expiring: 'Sắp hết hạn trong 30 ngày',
    expires: 'Hết hạn',
    items: 'mục',
    itemsToReview: 'khoản cần kiểm tra',
    lastMonth: 'Tháng trước',
    loading: 'Đang tải...',
    loadingMetrics: 'Đang tải số liệu mới nhất...',
    needsAttention: 'Cần xử lý',
    noPayment: 'Không có khoản thu đang chờ hoặc quá hạn.',
    noRevenue: 'Chưa có dữ liệu doanh thu',
    noRevenueLastMonth: 'Tháng trước chưa ghi nhận doanh thu',
    noRoom: 'Chưa có phòng',
    noTenant: 'Chưa có khách',
    notAvailable: 'Chưa có',
    occupied: 'đã thuê',
    operationsOverview: 'Tổng quan vận hành',
    overdue: 'Quá hạn',
    paidStatus: 'Tình trạng thanh toán',
    paymentPending: 'Chờ thu',
    payments: 'Thu tiền',
    receivables: 'Khoản thu',
    reload: 'Tải lại dữ liệu',
    revenueComparison: 'So sánh doanh thu',
    revenueThisMonth: 'Doanh thu tháng này',
    sameRevenue: 'Bằng tháng trước',
    thisMonth: 'Tháng này',
    totalRooms: 'Tổng phòng',
    trackPrefix: 'Theo dõi phòng, hợp đồng và khoản thu theo tháng',
    available: 'trống',
    trend: (delta, percent) =>
      `${delta > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(percent)}% so với tháng trước`,
  },
};

function formatDate(value, text) {
  if (!value) return text.notAvailable;
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function getRevenueDelta(currentMonth, previousMonth, text) {
  if (!previousMonth) {
    return currentMonth ? text.noRevenueLastMonth : text.noRevenue;
  }

  const delta = currentMonth - previousMonth;
  const percent = Math.round((delta / previousMonth) * 100);

  if (delta === 0) return text.sameRevenue;
  return text.trend(delta, percent);
}

function getRevenueBarHeight(value, maxValue) {
  if (!maxValue) return 12;
  return Math.max(Math.round((value / maxValue) * 132), 12);
}

function getPaymentStatusLabel(status, language) {
  const labels = {
    en: {
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
    },
    vi: {
      pending: 'Chờ thu',
      paid: 'Đã thanh toán',
      overdue: 'Quá hạn',
      cancelled: 'Đã hủy',
    },
  };

  return labels[language]?.[status] || labels.vi[status] || status;
}

export function DashboardPage() {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
  const [summary, setSummary] = useState(emptySummary);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadSummary() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getDashboardSummary();
      setSummary({
        ...emptySummary,
        ...data,
        revenue: {
          ...emptySummary.revenue,
          ...(data.revenue || {}),
        },
        alerts: {
          ...emptySummary.alerts,
          ...(data.alerts || {}),
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const maxRevenue = Math.max(
    summary.revenue.currentMonth,
    summary.revenue.previousMonth,
  );
  const actionCount =
    summary.alerts.expiringContracts.length +
    summary.alerts.unpaidPayments.length;

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">{text.operationsOverview}</span>
          <h1>{text.dashboardTitle}</h1>
          <p>
            {text.trackPrefix} {summary.payments.month}/{summary.payments.year}.
          </p>
        </div>
        <div className="hero-actions">
          <div className="hero-status">
            <span>{text.needsAttention}</span>
            <strong>{actionCount}</strong>
            <small>{text.contractsPayments}</small>
          </div>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadSummary}
          >
            {isLoading ? text.loading : text.reload}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}
      {isLoading ? <p className="loading-note">{text.loadingMetrics}</p> : null}

      <div className="dashboard-grid">
        <article className="metric-card metric-card-primary">
          <span>{text.revenueThisMonth}</span>
          <strong>{formatMoney(summary.revenue.currentMonth)}</strong>
          <small>
            {getRevenueDelta(
              summary.revenue.currentMonth,
              summary.revenue.previousMonth,
              text,
            )}
          </small>
        </article>
        <article className="metric-card">
          <span>{text.totalRooms}</span>
          <strong>{summary.rooms.total}</strong>
          <small>
            {summary.rooms.available} {text.available}, {summary.rooms.occupied}{' '}
            {text.occupied}
          </small>
        </article>
        <article className="metric-card">
          <span>{text.activeTenants}</span>
          <strong>{summary.tenants.active}</strong>
          <small>{text.activeTenants.toLowerCase()}</small>
        </article>
        <article className="metric-card metric-card-warning">
          <span>{text.overdue}</span>
          <strong>{summary.payments.overdueCount}</strong>
          <small>{text.itemsToReview}</small>
        </article>
      </div>

      <div className="insight-grid">
        <section className="dashboard-panel revenue-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.cashFlow}</span>
              <h2>{text.revenueComparison}</h2>
            </div>
            <span className="panel-meta">
              {text.collectedItems(summary.payments.paidCount)}
            </span>
          </div>
          <div className="revenue-chart" aria-label={text.revenueComparison}>
            <div className="revenue-bar-group">
              <div
                className="revenue-bar revenue-bar-muted"
                style={{
                  height: `${getRevenueBarHeight(
                    summary.revenue.previousMonth,
                    maxRevenue,
                  )}px`,
                }}
              />
              <strong>{formatMoney(summary.revenue.previousMonth)}</strong>
              <span>{text.lastMonth}</span>
            </div>
            <div className="revenue-bar-group">
              <div
                className="revenue-bar"
                style={{
                  height: `${getRevenueBarHeight(
                    summary.revenue.currentMonth,
                    maxRevenue,
                  )}px`,
                }}
              />
              <strong>{formatMoney(summary.revenue.currentMonth)}</strong>
              <span>{text.thisMonth}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-panel payment-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.payments}</span>
              <h2>{text.paidStatus}</h2>
            </div>
          </div>
          <div className="payment-summary-grid">
            <div>
              <span>{text.collected}</span>
              <strong>{formatMoney(summary.payments.paidAmount)}</strong>
              <small>
                {summary.payments.paidCount} {text.items}
              </small>
            </div>
            <div>
              <span>{text.paymentPending}</span>
              <strong>{formatMoney(summary.payments.pendingAmount)}</strong>
              <small>
                {summary.payments.pendingCount} {text.items}
              </small>
            </div>
          </div>
        </section>
      </div>

      <div className="work-queue-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.contracts}</span>
              <h2>{text.expiring}</h2>
            </div>
            <span className="panel-meta">
              {summary.alerts.expiringContracts.length} {text.items}
            </span>
          </div>
          {summary.alerts.expiringContracts.length === 0 ? (
            <p className="empty-note">{text.contractEmpty}</p>
          ) : (
            <div className="alert-list">
              {summary.alerts.expiringContracts.map((contract) => (
                <article className="alert-item" key={contract._id}>
                  <strong>{contract.room?.name || text.noRoom}</strong>
                  <span>{contract.tenant?.fullName || text.noTenant}</span>
                  <small>
                    {text.expires}: {formatDate(contract.endDate, text)}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.receivables}</span>
              <h2>{text.needsAttention}</h2>
            </div>
            <span className="panel-meta">
              {summary.alerts.unpaidPayments.length} {text.items}
            </span>
          </div>
          {summary.alerts.unpaidPayments.length === 0 ? (
            <p className="empty-note">{text.noPayment}</p>
          ) : (
            <div className="alert-list">
              {summary.alerts.unpaidPayments.map((payment) => (
                <article className="alert-item" key={payment._id}>
                  <strong>{formatMoney(payment.amount)}</strong>
                  <span>
                    {payment.contract?.room?.name || text.noRoom} -{' '}
                    {payment.contract?.tenant?.fullName || text.noTenant}
                  </span>
                  <small>
                    {text.due}: {formatDate(payment.dueDate, text)} -{' '}
                    {getPaymentStatusLabel(payment.status, language)}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
