import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  Filter,
  AlertCircle,
  FileText,
  Plus
} from 'lucide-react'
import { 
  fetchFiles, 
  uploadFile, 
  deleteFile, 
  setSearchTerm, 
  setSortBy, 
  setSortOrder,
  clearError 
} from '../store/filesSlice'
import { filesAPI } from '../services/api'
import { formatFileSize, formatDate, getFileTypeIcon, downloadFile, debounce } from '../utils/helpers'

const Files = () => {
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [orphanedInfo, setOrphanedInfo] = useState(null)
  
  const { 
    files, 
    loading, 
    uploading, 
    uploadProgress, 
    error, 
    searchTerm, 
    sortBy, 
    sortOrder 
  } = useSelector((state) => state.files)

  useEffect(() => {
    dispatch(fetchFiles())
    // Check for orphaned files
    checkOrphanedFiles()
  }, [dispatch])

  const checkOrphanedFiles = async () => {
    try {
      const response = await filesAPI.getOrphanedFiles()
      setOrphanedInfo(response.data)
    } catch (error) {
      console.error('Failed to check orphaned files:', error)
    }
  }

  // Debounced search
  const debouncedSearch = debounce((term) => {
    dispatch(setSearchTerm(term))
  }, 300)

  const handleSearch = (e) => {
    debouncedSearch(e.target.value)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))
    } else {
      dispatch(setSortBy(field))
      dispatch(setSortOrder('desc'))
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleUpload = async (file) => {
    try {
      await dispatch(uploadFile({
        file,
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress}%`)
        }
      })).unwrap()
      // Refresh files list after successful upload
      dispatch(fetchFiles())
      // Refresh orphaned files check
      checkOrphanedFiles()
    } catch (error) {
      console.error('Upload failed:', error)
      // Error is handled by the slice
    }
  }

  const handleDownload = async (file) => {
    try {
      const response = await filesAPI.downloadFile(file._id)
      downloadFile(response.data, file.fileName)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await dispatch(deleteFile(fileId)).unwrap()
        // Refresh orphaned files check after deletion
        checkOrphanedFiles()
      } catch (error) {
        // Error is handled by the slice
      }
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter(file => 
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Files</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload, manage, and download your files stored across cloud providers
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => dispatch(clearError())}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 mb-6 transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
              </span>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Any file type up to 10MB
            </p>
          </div>
          
          {uploading && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm text-gray-600">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => dispatch(setSortBy(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="fileName">Name</option>
            <option value="size">Size</option>
            <option value="createdAt">Date</option>
          </select>
          
          <button
            onClick={() => dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredAndSortedFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No files match your search.' : 'Get started by uploading a file.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedFiles.map((file) => (
              <li key={file._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="text-2xl mr-3">
                      {getFileTypeIcon(file.fileName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Files
