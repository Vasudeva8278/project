import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../store/slices/notificationSlice';
import { X, Check, CheckCheck, Trash2, Clock, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { notifications, loading, unreadCount } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, dispatch]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'task_updated':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'task_completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'task_overdue':
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.task && (
                            <p className="text-xs text-blue-600 mt-1">
                              Task: {notification.task.title}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              from {notification.sender.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification._id)}
                            className="p-1 rounded hover:bg-red-100 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;