import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences.js';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';
import { getStoredUser } from '../services/sessionStorage.js';

const labels = {
  en: {
    closeNotifications: 'Close notifications',
    emptyNotifications: 'No notifications yet.',
    eyebrow: 'Dashboard',
    markAllRead: 'Mark all read',
    newNotifications: 'new',
    notifications: 'Notifications',
    title: 'Rental operations today',
    unreadNotifications: 'Unread notifications',
  },
  vi: {
    closeNotifications: 'Đóng thông báo',
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

function getLocalizedNotification(notification, language) {
  if (language !== 'vi') return notification;

  if (notification.type === 'payment_success') {
    return {
      ...notification,
      message: notification.message
        ?.replaceAll('Hoa don', 'Hóa đơn')
        .replaceAll('phong', 'phòng')
        .replaceAll('thang', 'tháng')
        .replaceAll('da duoc thanh toan', 'đã được thanh toán'),
      title: 'Hóa đơn đã thanh toán',
    };
  }

  const supportTitleMap = {
    'Yeu cau ho tro da dong': 'Yêu cầu hỗ trợ đã đóng',
    'Yeu cau ho tro da duoc cap nhat': 'Yêu cầu hỗ trợ đã được cập nhật',
    'Yeu cau ho tro moi': 'Yêu cầu hỗ trợ mới',
  };

  if (notification.type === 'support_request') {
    return {
      ...notification,
      message: notification.message
        ?.replaceAll('Khach thue', 'Khách thuê')
        .replaceAll('Chu tro', 'Chủ trọ')
        .replaceAll('da gui yeu cau', 'đã gửi yêu cầu')
        .replaceAll('da cap nhat yeu cau', 'đã cập nhật yêu cầu')
        .replaceAll('da dong yeu cau', 'đã đóng yêu cầu'),
      title: supportTitleMap[notification.title] || notification.title,
    };
  }

  return notification;
}

export function Header() {
  const { language } = usePreferences();
  const text = labels[language] || labels.vi;
  const user = getStoredUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationMenuRef = useRef(null);
  const canUseNotifications = ['landlord', 'tenant'].includes(user?.role);

  async function loadNotifications() {
    if (!canUseNotifications) return;

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

    if (!canUseNotifications) return undefined;

    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [canUseNotifications]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleDocumentPointerDown(event) {
      if (notificationMenuRef.current?.contains(event.target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
      {canUseNotifications ? (
        <div className="notification-menu" ref={notificationMenuRef}>
          <button
            aria-expanded={isOpen}
            aria-label={text.notifications}
            className="notification-trigger"
            type="button"
            onClick={() => {
              setIsOpen((current) => !current);
              loadNotifications();
            }}
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
            <div className="notification-popover" role="menu">
              <div className="notification-popover-header">
                <strong>{text.notifications}</strong>
                <div className="notification-popover-actions">
                  <button
                    className="notification-mark-read-button"
                    disabled={unreadCount === 0}
                    type="button"
                    onClick={handleMarkAllRead}
                  >
                    <CheckCheck size={16} strokeWidth={2.5} />
                    {text.markAllRead}
                  </button>
                  <button
                    aria-label={text.closeNotifications}
                    className="notification-close-button"
                    type="button"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <p className="empty-note">{text.emptyNotifications}</p>
              ) : (
                <div className="notification-list">
                  {notifications.map((notification) => {
                    const displayNotification = getLocalizedNotification(
                      notification,
                      language,
                    );

                    return (
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
                          <strong>{displayNotification.title}</strong>
                          <time>
                            {formatNotificationTime(
                              notification.createdAt,
                              language,
                            )}
                          </time>
                        </span>
                        <span>{displayNotification.message}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
