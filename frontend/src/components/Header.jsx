import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences.js';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';
import { getStoredUser } from '../services/sessionStorage.js';

const labels = {
  en: {
    emptyNotifications: 'No notifications yet.',
    eyebrow: 'Dashboard',
    markAllRead: 'Mark all read',
    newNotifications: 'new',
    notifications: 'Notifications',
    title: 'Rental operations today',
    unreadNotifications: 'Unread notifications',
  },
  vi: {
    emptyNotifications: 'Chưa có thông báo.',
    eyebrow: 'Bảng điều hành',
    markAllRead: 'Đánh dấu đã đọc',
    newNotifications: 'mới',
    notifications: 'Thông báo',
    title: 'Vận hành khu trọ hôm nay',
    unreadNotifications: 'Thông báo chưa đọc',
  },
};

function formatNotificationTime(value, language) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function Header() {
  const { language } = usePreferences();
  const text = labels[language] || labels.vi;
  const user = getStoredUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadNotifications() {
    if (user?.role !== 'landlord') return;

    try {
      const result = await getNotifications({ limit: 8 });
      setNotifications(result.items || []);
      setUnreadCount(result.meta?.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    loadNotifications();

    if (user?.role !== 'landlord') return undefined;

    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [user?.role]);

  async function handleMarkRead(notification) {
    if (notification.readAt) return;
    await markNotificationRead(notification._id);
    await loadNotifications();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await loadNotifications();
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-title">
          <span className="eyebrow">{text.eyebrow}</span>
          <strong>{text.title}</strong>
        </div>
      </div>
      {user?.role === 'landlord' ? (
        <div className="notification-menu">
          <button
            aria-expanded={isOpen}
            aria-label={text.notifications}
            className="notification-trigger"
            type="button"
            onClick={() => setIsOpen((current) => !current)}
          >
            <Bell size={18} strokeWidth={2.5} />
            <span className="notification-trigger-label">
              {text.notifications}
            </span>
            {unreadCount > 0 ? (
              <span
                aria-label={`${unreadCount} ${text.unreadNotifications}`}
                className="notification-badge"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
          {isOpen ? (
            <div className="notification-popover">
              <div className="notification-popover-header">
                <strong>{text.notifications}</strong>
                <button
                  className="icon-button"
                  disabled={unreadCount === 0}
                  type="button"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck size={16} strokeWidth={2.5} />
                  {text.markAllRead}
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="empty-note">{text.emptyNotifications}</p>
              ) : (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <button
                      className={`notification-item ${
                        notification.readAt ? '' : 'is-unread'
                      }`}
                      key={notification._id}
                      type="button"
                      onClick={() => handleMarkRead(notification)}
                    >
                      <span className="notification-item-topline">
                        {!notification.readAt ? (
                          <span
                            aria-hidden="true"
                            className="notification-unread-dot"
                          />
                        ) : null}
                        <strong>{notification.title}</strong>
                        <time>
                          {formatNotificationTime(
                            notification.createdAt,
                            language,
                          )}
                        </time>
                      </span>
                      <span>{notification.message}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
