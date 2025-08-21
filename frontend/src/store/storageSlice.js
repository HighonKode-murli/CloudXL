import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cloudAPI } from '../services/api'

// Async thunk for fetching storage statistics
export const fetchStorageStats = createAsyncThunk(
  'storage/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cloudAPI.getStorageStats()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch storage statistics')
    }
  }
)

const storageSlice = createSlice({
  name: 'storage',
  initialState: {
    stats: {
      totalAvailable: 0,
      totalUsed: 0,
      providers: []
    },
    loading: false,
    error: null,
    lastUpdated: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetStats: (state) => {
      state.stats = {
        totalAvailable: 0,
        totalUsed: 0,
        providers: []
      }
      state.error = null
      state.lastUpdated = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStorageStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStorageStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload
        state.lastUpdated = new Date().toISOString()
        state.error = null
      })
      .addCase(fetchStorageStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, resetStats } = storageSlice.actions
export default storageSlice.reducer
