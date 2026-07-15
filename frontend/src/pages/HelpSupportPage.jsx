import React from 'react';
import { usePreferences } from '../hooks/usePreferences.js';

const copy = {
  en: {
    pageTitle: 'Help & Support',
    pageSummary: 'Notes for operations, demos, and common troubleshooting.',
    support: 'Support',
    items: [
      {
        title: 'Quick demo flow',
        description:
          'Sign in, create rooms, add tenants, create contracts, record payments, and review the dashboard.',
      },
      {
        title: 'Sample data',
        description:
          'Use seed data to prepare rooms, tenants, contracts, and payments before the presentation.',
      },
      {
        title: 'Technical support',
        description:
          'When an error occurs, check the backend API, auth token, environment variables, and MongoDB Atlas connection.',
      },
    ],
  },
  vi: {
    pageTitle: 'Trợ giúp & Hỗ trợ',
    pageSummary: 'Ghi chú hỗ trợ vận hành, demo và xử lý lỗi thường gặp.',
    support: 'Hỗ trợ',
    items: [
      {
        title: 'Quy trình demo nhanh',
        description:
          'Đăng nhập, tạo phòng, thêm khách thuê, lập hợp đồng, ghi nhận thanh toán và xem dashboard.',
      },
      {
        title: 'Dữ liệu mẫu',
        description:
          'Dùng seed data để chuẩn bị phòng, khách thuê, hợp đồng và khoản thu trước khi thuyết trình.',
      },
      {
        title: 'Hỗ trợ kỹ thuật',
        description:
          'Khi gặp lỗi, kiểm tra API backend, token đăng nhập, biến môi trường và kết nối MongoDB Atlas.',
      },
    ],
  },
};

export function HelpSupportPage() {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{text.pageTitle}</h1>
          <p className="page-summary">{text.pageSummary}</p>
        </div>
      </div>

      <div className="settings-grid">
        {text.items.map((item) => (
          <article className="settings-panel" key={item.title}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{text.support}</span>
                <h2>{item.title}</h2>
              </div>
            </div>
            <p className="empty-note">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
