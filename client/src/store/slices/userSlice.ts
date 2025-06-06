import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserState {
  users: User[];
  searchResults: User[];
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  searchResults: [],
  loading: false,
  searchLoading: false,
  error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getAllUsers();
      return response.data.users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await userAPI.searchUsers(query);
      return response.data.users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSearchResults, clearError } = userSlice.actions;
export default userSlice.reducer;