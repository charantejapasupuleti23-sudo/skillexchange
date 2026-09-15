import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [realtimeNotification, setRealtimeNotification] = useState(null);

  // Track the active socket in a ref so the cleanup function always has a stable
  // reference — avoids stale closure memory leaks when user._id changes
  const socketRef = useRef(null);

  useEffect(() => {
    // Disconnect any existing socket first (handles user switch / logout)
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!user) {
      setSocket(null);
      return;
    }

    const token = localStorage.getItem('skillloop_token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register_user', user._id);
      newSocket.emit('get_online_users');
    });

    newSocket.on('user_presence', ({ activeUsers }) => {
      if (activeUsers) {
        setOnlineUsers(activeUsers);
      }
    });

    newSocket.on('online_users_list', (users) => {
      setOnlineUsers(users || []);
    });

    newSocket.on('new_notification', (notification) => {
      setRealtimeNotification(notification);
    });

    return () => {
      // Use the ref, not the state value, to avoid stale closures
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isUserOnline,
        realtimeNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || { socket: null, onlineUsers: [], isUserOnline: () => false };
};
