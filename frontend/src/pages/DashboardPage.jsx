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
  if (!value) return 'Chua co';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function getRevenueDelta(currentMonth, previousMonth) {
  if (!previousMonth) {
    return currentMonth ? 'Thang truoc chua co doanh thu' : 'Chua co doanh thu';
  }

  const delta = currentMonth - previousMonth;
  const percent = Math.round((delta / previousMonth) * 100);

  if (delta === 0) return 'Bang thang truoc';
  return `${delta > 0 ? 'Tang' : 'Giam'} ${Math.abs(percent)}% so voi thang truoc`;
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
          <span>Khách thuê active</span>
          <strong>{summary.tenants.active}</strong>
        </article>
        <article className="metric-card">
          <span>Hợp đồng active</span>
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

      <div className="dashboard-details">
        <section className="dashboard-section dashboard-list-panel">
          <h2>Hop dong sap het han</h2>
          {summary.alerts.expiringContracts.length === 0 ? (
            <p className="empty-note">
              Khong co hop dong het han trong 30 ngay.
            </p>
          ) : (
            <div className="alert-list">
              {summary.alerts.expiringContracts.map((contract) => (
                <article className="alert-item" key={contract._id}>
                  <strong>{contract.room?.name || 'Chua co phong'}</strong>
                  <span>{contract.tenant?.fullName || 'Chua co khach'}</span>
                  <small>Het han: {formatDate(contract.endDate)}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section dashboard-list-panel">
          <h2>Khoan thu can xu ly</h2>
          {summary.alerts.unpaidPayments.length === 0 ? (
            <p className="empty-note">
              Khong co khoan thu dang cho hoac qua han.
            </p>
          ) : (
            <div className="alert-list">
              {summary.alerts.unpaidPayments.map((payment) => (
                <article className="alert-item" key={payment._id}>
                  <strong>{formatMoney(payment.amount)}d</strong>
                  <span>
                    {payment.contract?.room?.name || 'Chua co phong'} -{' '}
                    {payment.contract?.tenant?.fullName || 'Chua co khach'}
                  </span>
                  <small>
                    Han: {formatDate(payment.dueDate)} - {payment.status}
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
