import axios from 'axios'

const API_BASE_URL = 'https://cloudxl.onrender.com'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (email, password) => api.post('/auth/signup', { email, password }),
}

// Cloud API
export const cloudAPI = {
  getStatus: () => api.get('/cloud/status'),
  getStorageStats: () => api.get('/cloud/storage/stats'),
  connectGoogle: () => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    // Create a form and submit it to maintain session
    const form = document.createElement('form')
    form.method = 'GET'
    form.action = `${API_BASE_URL}/cloud/connect/google`

    const tokenInput = document.createElement('input')
    tokenInput.type = 'hidden'
    tokenInput.name = 'token'
    tokenInput.value = token
    form.appendChild(tokenInput)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  },
  connectDropbox: () => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    // Create a form and submit it to maintain session
    const form = document.createElement('form')
    form.method = 'GET'
    form.action = `${API_BASE_URL}/cloud/connect/dropbox`

    const tokenInput = document.createElement('input')
    tokenInput.type = 'hidden'
    tokenInput.name = 'token'
    tokenInput.value = token
    form.appendChild(tokenInput)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  },
  disconnect: (provider) => api.delete(`/cloud/disconnect/${provider}`),
  disconnectAccount: (provider, accountEmail) => api.delete(`/cloud/disconnect/${provider}/${encodeURIComponent(accountEmail)}`),
  getDisconnectImpact: (provider, accountEmail) => api.get(`/cloud/disconnect-impact/${provider}/${encodeURIComponent(accountEmail)}`),
}

// Files API
export const filesAPI = {
  getFiles: () => api.get('/files'),
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onUploadProgress(percentCompleted)
      } : undefined,
    })
  },
  downloadFile: (fileId) => {
    return api.get(`/files/${fileId}`, {
      responseType: 'blob',
    })
  },
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  getOrphanedFiles: () => api.get('/files/orphaned/list'),
}

export default api
