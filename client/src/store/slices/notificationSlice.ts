import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationAPI } from '../../services/api';

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue';
  title: string;
  message: string;
  task?: {
    _id: string;
    title: string;
  };
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getNotifications();
      return response.data.notifications;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      return response.data.notification;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationAPI.markAllAsRead();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n: Notification) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (!action.payload.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }));
        state.unreadCount = 0;
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n._id === action.payload);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n._id !== action.payload);
      });
  },
});

export const { addNotification, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;