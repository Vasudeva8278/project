import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { Menu, User, LogOut, Bell } from 'lucide-react';
import NotificationPanel from '../Notifications/NotificationPanel';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  useEffect(() => {
    // Fetch notifications on component mount
    dispatch(fetchNotifications());
    
    // Set up periodic refresh for notifications
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleNotificationClick = () => {
    setNotificationPanelOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 ease-in-out`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            {sidebarOpen && <span className="font-bold text-xl text-gray-800">TaskFlow</span>}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4">
            {sidebarOpen && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Workspace
                </div>
                <div className="space-y-1">
                  <a
                    href="#"
                    className="bg-blue-50 text-blue-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  >
                    Dashboard
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={handleNotificationClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />
    </div>
  );
};

export default Layout;