import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUser } from './store/slices/authSlice';
import { addNotification } from './store/slices/notificationSlice';
import { addTaskLocal, updateTaskLocal } from './store/slices/taskSlice';
import io from 'socket.io-client';

// Components
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// App Component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token, loading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token]);

  // Socket.io setup
  useEffect(() => {
    if (user?.id) {
      const socket = io('http://localhost:5000');
      
      socket.emit('join-user', user.id);

      socket.on('new-notification', (notification) => {
        dispatch(addNotification(notification));
      });

      socket.on('task-created', (task) => {
        dispatch(addTaskLocal(task));
      });

      socket.on('task-updated', (task) => {
        dispatch(updateTaskLocal(task));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?.id, dispatch]);

  if (loading && token) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard\" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;