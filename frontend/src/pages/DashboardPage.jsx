import React from 'react';

export function DashboardPage() {
  return (
    <section>
      <h1>Tổng quan</h1>
      <div className="metric-grid">
        <article className="metric-card">
          <span>Phòng trống</span>
          <strong>3</strong>
        </article>
        <article className="metric-card">
          <span>Đã thuê</span>
          <strong>1</strong>
        </article>
        <article className="metric-card">
          <span>Bảo trì</span>
          <strong>1</strong>
        </article>
      </div>
    </section>
  );
}
