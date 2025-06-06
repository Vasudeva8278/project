import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  taskModalOpen: boolean;
  selectedTaskId: string | null;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  }>;
}

const initialState: UIState = {
  sidebarOpen: true,
  taskModalOpen: false,
  selectedTaskId: null,
  theme: 'light',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openTaskModal: (state, action: PayloadAction<string | null>) => {
      state.taskModalOpen = true;
      state.selectedTaskId = action.payload;
    },
    closeTaskModal: (state) => {
      state.taskModalOpen = false;
      state.selectedTaskId = null;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openTaskModal,
  closeTaskModal,
  setTheme,
  addNotification,
  removeNotification,
} = uiSlice.actions;

export default uiSlice.reducer;