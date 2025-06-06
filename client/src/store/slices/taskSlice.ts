import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { taskAPI } from '../../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'work' | 'personal' | 'shopping' | 'health' | 'education' | 'other';
  dueDate?: string;
  tags: string[];
  subtasks: Subtask[];
  order: number;
  color: string;
  customFields: Record<string, string>;
  createdBy: User;
  assignedTo: User;
  createdAt: string;
  updatedAt: string;
}

interface TaskFilters {
  status?: string;
  category?: string;
  priority?: string;
  dueDate?: string;
  search?: string;
  view?: 'all' | 'assigned' | 'created';
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filters: { view: 'all' },
};

// Load tasks from localStorage
const loadTasksFromStorage = (): Task[] => {
  try {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  } catch {
    return [];
  }
};

// Save tasks to localStorage
const saveTasksToStorage = (tasks: Task[]) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: TaskFilters = {}, { rejectWithValue }) => {
    try {
      const response = await taskAPI.getTasks(filters);
      return response.data.tasks;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      const response = await taskAPI.createTask(taskData);
      return response.data.task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }: { id: string; data: Partial<Task> }, { rejectWithValue }) => {
    try {
      const response = await taskAPI.updateTask(id, data);
      return response.data.task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await taskAPI.deleteTask(taskId);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const reorderTasks = createAsyncThunk(
  'tasks/reorderTasks',
  async (updates: Array<{ id: string; status: string; order: number }>, { rejectWithValue }) => {
    try {
      await taskAPI.reorderTasks(updates);
      return updates;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder tasks');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { view: 'all' };
    },
    updateTaskLocal: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
        saveTasksToStorage(state.tasks);
      }
    },
    addTaskLocal: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      saveTasksToStorage(state.tasks);
    },
    reorderTasksLocal: (state, action: PayloadAction<Array<{ id: string; status: string; order: number }>>) => {
      action.payload.forEach(update => {
        const taskIndex = state.tasks.findIndex(task => task._id === update.id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].status = update.status as Task['status'];
          state.tasks[taskIndex].order = update.order;
        }
      });
      saveTasksToStorage(state.tasks);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
        saveTasksToStorage(action.payload);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Load from localStorage if API fails
        state.tasks = loadTasksFromStorage();
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        saveTasksToStorage(state.tasks);
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
          saveTasksToStorage(state.tasks);
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
        saveTasksToStorage(state.tasks);
      })
      // Reorder tasks
      .addCase(reorderTasks.fulfilled, (state, action) => {
        action.payload.forEach(update => {
          const taskIndex = state.tasks.findIndex(task => task._id === update.id);
          if (taskIndex !== -1) {
            state.tasks[taskIndex].status = update.status as Task['status'];
            state.tasks[taskIndex].order = update.order;
          }
        });
        saveTasksToStorage(state.tasks);
      });
  },
});

export const { setFilters, clearFilters, updateTaskLocal, addTaskLocal, reorderTasksLocal } = taskSlice.actions;
export default taskSlice.reducer;