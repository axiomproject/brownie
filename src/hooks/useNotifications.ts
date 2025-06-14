import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import type { Notification } from '@/types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    fetchNotifications();

    socketInstance.on('notification', (newNotification: Notification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchNotifications = async (reset = true) => {
    try {
      const currentPage = reset ? 1 : page;
      const response = await axios.get<Notification[]>(
        `http://localhost:5000/api/users/notifications?page=${currentPage}&limit=${LIMIT}`
      );
      
      if (reset) {
        setNotifications(response.data);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === LIMIT);
      if (!reset) setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const loadMore = () => {
    if (hasMore) {
      fetchNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/users/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete('http://localhost:5000/api/users/notifications');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    loadMore,
    hasMore,
    clearAll
  };
}
