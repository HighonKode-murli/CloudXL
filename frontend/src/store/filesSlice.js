import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { filesAPI } from '../services/api'

// Async thunks
export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await filesAPI.getFiles()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch files')
    }
  }
)

export const uploadFile = createAsyncThunk(
  'files/uploadFile',
  async ({ file, onProgress }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setUploadProgress(0))
      const response = await filesAPI.uploadFile(file, (progress) => {
        dispatch(setUploadProgress(progress))
        if (onProgress) onProgress(progress)
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error || 'Failed to upload file')
    }
  }
)

export const deleteFile = createAsyncThunk(
  'files/deleteFile',
  async (fileId, { rejectWithValue }) => {
    try {
      await filesAPI.deleteFile(fileId)
      return fileId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete file')
    }
  }
)

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    files: [],
    loading: false,
    uploading: false,
    uploadProgress: 0,
    error: null,
    searchTerm: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch files
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false
        state.files = action.payload
        state.error = null
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true
        state.uploadProgress = 0
        state.error = null
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false
        state.uploadProgress = 100
        state.error = null
        // Add the new file to the list (we'll need to refetch to get complete data)
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false
        state.uploadProgress = 0
        state.error = action.payload
      })
      // Delete file
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter(file => file._id !== action.payload)
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearError, setSearchTerm, setSortBy, setSortOrder, setUploadProgress } = filesSlice.actions
export default filesSlice.reducer
