// Format file size in human readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatStorageSize = (bytes) => {
  if (bytes === 0) return '0 GB'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // For storage stats, prefer GB and TB for readability
  if (i < 3) {
    return parseFloat((bytes / Math.pow(k, 3)).toFixed(2)) + ' GB'
  }

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const calculateStoragePercentage = (used, total) => {
  if (total === 0) return 0
  return Math.round((used / total) * 100)
}

// Format date in human readable format
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get file extension from filename
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

// Get file type icon based on extension
export const getFileTypeIcon = (filename) => {
  const extension = getFileExtension(filename)
  
  const iconMap = {
    // Images
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    // Documents
    pdf: '📄', doc: '📝', docx: '📝', txt: '📝', rtf: '📝',
    // Spreadsheets
    xls: '📊', xlsx: '📊', csv: '📊',
    // Presentations
    ppt: '📊', pptx: '📊',
    // Archives
    zip: '🗜️', rar: '🗜️', '7z': '🗜️', tar: '🗜️', gz: '🗜️',
    // Code
    js: '💻', html: '💻', css: '💻', json: '💻', xml: '💻', py: '💻', java: '💻',
    // Media
    mp4: '🎥', avi: '🎥', mov: '🎥', wmv: '🎥',
    mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵',
  }
  
  return iconMap[extension] || '📁'
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export const validatePassword = (password) => {
  const errors = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Download file helper
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
