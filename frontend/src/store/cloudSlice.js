import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cloudAPI } from '../services/api'

// Async thunks
export const fetchCloudStatus = createAsyncThunk(
  'cloud/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching cloud status, token:', localStorage.getItem('token'))
      const response = await cloudAPI.getStatus()
      console.log('Cloud status response:', response.data)
      return response.data
    } catch (error) {
      console.error('Cloud status error:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cloud status')
    }
  }
)

const cloudSlice = createSlice({
  name: 'cloud',
  initialState: {
    linkedAccounts: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCloudStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCloudStatus.fulfilled, (state, action) => {
        state.loading = false
        state.linkedAccounts = action.payload.linkedAccounts || []
        state.error = null
      })
      .addCase(fetchCloudStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = cloudSlice.actions
export default cloudSlice.reducer
