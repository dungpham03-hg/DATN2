import React, { useState } from 'react';
import { Card, Badge, Button, Dropdown } from 'react-bootstrap';
import { FaBell, FaCheck, FaTimes, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './NotificationPopup.css';

const NotificationPopup = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNotificationClick = async (notification) => {
    // Đánh dấu đã đọc
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate tùy theo loại thông báo
    if (notification.type === 'meeting_invite' && notification.data?.meetingId) {
      navigate(`/meetings/${notification.data.meetingId._id || notification.data.meetingId}`);
    }
    
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting_invite':
        return <FaCalendarAlt className="text-primary" />;
      default:
        return <FaBell className="text-secondary" />;
    }
  };

  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  };

  return (
    <Dropdown 
      show={showDropdown} 
      onToggle={(isOpen) => setShowDropdown(isOpen)}
      className="notification-dropdown"
    >
      <Dropdown.Toggle 
        variant="light" 
        className="notification-toggle position-relative"
        id="notification-dropdown"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.7rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu align="end" className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Thông báo</h6>
          {unreadCount > 0 && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={markAllAsRead}
              className="p-0 text-primary"
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              Không có thông báo nào
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div 
                  className="notification-content"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-body">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      title="Đánh dấu đã đọc"
                    >
                      <FaCheck />
                    </Button>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Xóa thông báo"
                    className="text-danger"
                  >
                    <FaTimes />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 10 && (
          <div className="notification-footer">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => {
                navigate('/notifications');
                setShowDropdown(false);
              }}
            >
              Xem tất cả thông báo
            </Button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationPopup; 