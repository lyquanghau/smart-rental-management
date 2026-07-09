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
    return currentMonth ? 'Tháng trước chưa có doanh thu' : 'Chưa có doanh thu';
  }

  const delta = currentMonth - previousMonth;
  const percent = Math.round((delta / previousMonth) * 100);

  if (delta === 0) return 'Bằng tháng trước';
  return `${delta > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(percent)}% so với tháng trước`;
}

function getRevenueBarHeight(value, maxValue) {
  if (!maxValue) return 8;
  return Math.max(Math.round((value / maxValue) * 120), 8);
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

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Tổng quan</h1>
          <span className="page-summary">
            Tháng {summary.payments.month}/{summary.payments.year}
          </span>
        </div>
        <button
          className="secondary-button"
          disabled={isLoading}
          type="button"
          onClick={loadSummary}
        >
          {isLoading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>

      {error ? <p className="error-message">{error}</p> : null}
      {isLoading ? <p className="page-summary">Đang tải dữ liệu...</p> : null}

      <div className="metric-grid">
        <article className="metric-card">
          <span>Tổng phòng</span>
          <strong>{summary.rooms.total}</strong>
        </article>
        <article className="metric-card">
          <span>Phòng trống</span>
          <strong>{summary.rooms.available}</strong>
        </article>
        <article className="metric-card">
          <span>Đã thuê</span>
          <strong>{summary.rooms.occupied}</strong>
        </article>
        <article className="metric-card">
          <span>Bảo trì</span>
          <strong>{summary.rooms.maintenance}</strong>
        </article>
        <article className="metric-card">
          <span>Khách thuê đang ở</span>
          <strong>{summary.tenants.active}</strong>
        </article>
        <article className="metric-card">
          <span>Hợp đồng hiệu lực</span>
          <strong>{summary.contracts.active}</strong>
        </article>
      </div>

      <div className="dashboard-section">
        <h2>Thanh toán trong tháng</h2>
        <div className="metric-grid">
          <article className="metric-card">
            <span>Đã thu</span>
            <strong>{formatMoney(summary.revenue.currentMonth)}đ</strong>
            <small>
              {summary.payments.paidCount} khoản.{' '}
              {getRevenueDelta(
                summary.revenue.currentMonth,
                summary.revenue.previousMonth,
              )}
            </small>
          </article>
          <article className="metric-card">
            <span>Tháng trước</span>
            <strong>{formatMoney(summary.revenue.previousMonth)}đ</strong>
            <small>{summary.revenue.previousMonthPaidCount} khoản</small>
          </article>
          <article className="metric-card">
            <span>Chưa thu</span>
            <strong>{formatMoney(summary.payments.pendingAmount)}đ</strong>
            <small>{summary.payments.pendingCount} khoản</small>
          </article>
          <article className="metric-card">
            <span>Quá hạn</span>
            <strong>{summary.payments.overdueCount}</strong>
            <small>khoản cần kiểm tra</small>
          </article>
        </div>
      </div>

      <section className="dashboard-section dashboard-list-panel">
        <h2>So sánh doanh thu</h2>
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

      <div className="dashboard-details">
        <section className="dashboard-section dashboard-list-panel">
          <h2>Hợp đồng sắp hết hạn</h2>
          {summary.alerts.expiringContracts.length === 0 ? (
            <p className="empty-note">
              Không có hợp đồng hết hạn trong 30 ngày.
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

        <section className="dashboard-section dashboard-list-panel">
          <h2>Khoản thu cần xử lý</h2>
          {summary.alerts.unpaidPayments.length === 0 ? (
            <p className="empty-note">
              Không có khoản thu đang chờ hoặc quá hạn.
            </p>
          ) : (
            <div className="alert-list">
              {summary.alerts.unpaidPayments.map((payment) => (
                <article className="alert-item" key={payment._id}>
                  <strong>{formatMoney(payment.amount)}d</strong>
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
