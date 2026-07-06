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
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN');
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
      setSummary(data);
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
            <strong>{formatMoney(summary.payments.paidAmount)}đ</strong>
            <small>{summary.payments.paidCount} khoản</small>
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
    </section>
  );
}
