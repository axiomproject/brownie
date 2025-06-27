import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import type { Notification } from '@/types/notification';
import { API_URL } from '@/config';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  useEffect(() => {
    const socketInstance = io(API_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
    });

    socketInstance.on('connect_error', () => {
    });

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
        `${API_URL}/api/users/notifications?page=${currentPage}&limit=${LIMIT}`
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
    }
  };

  const loadMore = () => {
    if (hasMore) {
      fetchNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`${API_URL}/api/users/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`${API_URL}/api/users/notifications`);
      setNotifications([]);
    } catch (error) {
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
