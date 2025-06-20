import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch notifications từ server
  const fetchNotifications = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Xóa thông báo
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setUnreadCount(prev => {
        const notif = notifications.find(n => n._id === notificationId);
        return notif && !notif.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Lắng nghe real-time notifications từ Socket.IO
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Hiển thị browser notification nếu được phép
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification._id
        });
      }
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket, user]);

  // Fetch notifications khi user login
  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      
      // Request permission cho browser notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [token, user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 