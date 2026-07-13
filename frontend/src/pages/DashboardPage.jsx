import React, { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/dashboardService.js';

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
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function getRevenueDelta(currentMonth, previousMonth) {
  if (!previousMonth) {
    return currentMonth
      ? 'Tháng trước chưa ghi nhận doanh thu'
      : 'Chưa có dữ liệu doanh thu';
  }

  const delta = currentMonth - previousMonth;
  const percent = Math.round((delta / previousMonth) * 100);

  if (delta === 0) return 'Bằng tháng trước';
  return `${delta > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(percent)}% so với tháng trước`;
}

function getRevenueBarHeight(value, maxValue) {
  if (!maxValue) return 12;
  return Math.max(Math.round((value / maxValue) * 132), 12);
}

function getPaymentStatusLabel(status) {
  const labels = {
    pending: 'Chờ thu',
    paid: 'Đã thanh toán',
    overdue: 'Quá hạn',
    cancelled: 'Đã hủy',
  };

  return labels[status] || 'Không rõ';
}

export function DashboardPage() {
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
          <span className="eyebrow">Tổng quan vận hành</span>
          <h1>Quản lý khu trọ</h1>
          <p>
            Theo dõi phòng, hợp đồng và khoản thu theo tháng{' '}
            {summary.payments.month}/{summary.payments.year}.
          </p>
        </div>
        <div className="hero-actions">
          <div className="hero-status">
            <span>Cần xử lý</span>
            <strong>{actionCount}</strong>
            <small>hợp đồng/khoản thu</small>
          </div>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={loadSummary}
          >
            {isLoading ? 'Đang tải...' : 'Tải lại dữ liệu'}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}
      {isLoading ? (
        <p className="loading-note">Đang tải số liệu mới nhất...</p>
      ) : null}

      <div className="dashboard-grid">
        <article className="metric-card metric-card-primary">
          <span>Doanh thu tháng này</span>
          <strong>{formatMoney(summary.revenue.currentMonth)}đ</strong>
          <small>
            {getRevenueDelta(
              summary.revenue.currentMonth,
              summary.revenue.previousMonth,
            )}
          </small>
        </article>
        <article className="metric-card">
          <span>Tổng phòng</span>
          <strong>{summary.rooms.total}</strong>
          <small>
            {summary.rooms.available} trống, {summary.rooms.occupied} đã thuê
          </small>
        </article>
        <article className="metric-card">
          <span>Khách đang ở</span>
          <strong>{summary.tenants.active}</strong>
          <small>khách thuê còn hoạt động</small>
        </article>
        <article className="metric-card metric-card-warning">
          <span>Quá hạn</span>
          <strong>{summary.payments.overdueCount}</strong>
          <small>khoản cần kiểm tra</small>
        </article>
      </div>

      <div className="insight-grid">
        <section className="dashboard-panel revenue-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Dòng tiền</span>
              <h2>So sánh doanh thu</h2>
            </div>
            <span className="panel-meta">
              {summary.payments.paidCount} khoản đã thu
            </span>
          </div>
          <div className="revenue-chart" aria-label="So sánh doanh thu tháng">
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
              <strong>{formatMoney(summary.revenue.previousMonth)}đ</strong>
              <span>Tháng trước</span>
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
              <strong>{formatMoney(summary.revenue.currentMonth)}đ</strong>
              <span>Tháng này</span>
            </div>
          </div>
        </section>

        <section className="dashboard-panel payment-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Thu tiền</span>
              <h2>Tình trạng thanh toán</h2>
            </div>
          </div>
          <div className="payment-summary-grid">
            <div>
              <span>Đã thu</span>
              <strong>{formatMoney(summary.payments.paidAmount)}đ</strong>
              <small>{summary.payments.paidCount} khoản</small>
            </div>
            <div>
              <span>Chờ thu</span>
              <strong>{formatMoney(summary.payments.pendingAmount)}đ</strong>
              <small>{summary.payments.pendingCount} khoản</small>
            </div>
          </div>
        </section>
      </div>

      <div className="work-queue-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Hợp đồng</span>
              <h2>Sắp hết hạn trong 30 ngày</h2>
            </div>
            <span className="panel-meta">
              {summary.alerts.expiringContracts.length} mục
            </span>
          </div>
          {summary.alerts.expiringContracts.length === 0 ? (
            <p className="empty-note">
              Không có hợp đồng cần gia hạn trong 30 ngày.
            </p>
          ) : (
            <div className="alert-list">
              {summary.alerts.expiringContracts.map((contract) => (
                <article className="alert-item" key={contract._id}>
                  <strong>{contract.room?.name || 'Chưa có phòng'}</strong>
                  <span>{contract.tenant?.fullName || 'Chưa có khách'}</span>
                  <small>Hết hạn: {formatDate(contract.endDate)}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Khoản thu</span>
              <h2>Cần xử lý</h2>
            </div>
            <span className="panel-meta">
              {summary.alerts.unpaidPayments.length} mục
            </span>
          </div>
          {summary.alerts.unpaidPayments.length === 0 ? (
            <p className="empty-note">
              Không có khoản thu đang chờ hoặc quá hạn.
            </p>
          ) : (
            <div className="alert-list">
              {summary.alerts.unpaidPayments.map((payment) => (
                <article className="alert-item" key={payment._id}>
                  <strong>{formatMoney(payment.amount)}đ</strong>
                  <span>
                    {payment.contract?.room?.name || 'Chưa có phòng'} -{' '}
                    {payment.contract?.tenant?.fullName || 'Chưa có khách'}
                  </span>
                  <small>
                    Hạn: {formatDate(payment.dueDate)} -{' '}
                    {getPaymentStatusLabel(payment.status)}
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
