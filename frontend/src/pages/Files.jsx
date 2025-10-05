import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  Filter,
  AlertCircle,
  FileText,
  Plus,
  Users,
  Share2
} from 'lucide-react'
import { 
  fetchFiles, 
  uploadFile, 
  deleteFile, 
  shareFile,
  setSearchTerm, 
  setSortBy, 
  setSortOrder,
  clearError 
} from '../store/filesSlice'
import { fetchMyTeams } from '../store/teamsSlice'
import { filesAPI } from '../services/api'
import { formatFileSize, formatDate, getFileTypeIcon, downloadFile, debounce } from '../utils/helpers'

const Files = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [storageInfo, setStorageInfo] = useState(null)
  const [orphanedInfo, setOrphanedInfo] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [selectedProfiles, setSelectedProfiles] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [fileToShare, setFileToShare] = useState(null)
  const [teamContext, setTeamContext] = useState(null) // Store team context from navigation
  
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

  const { myTeams } = useSelector((state) => state.teams)

  const profiles = ['editors', 'content-writers', 'tech-devs', 'cross-section']

  // Handle navigation from Teams page
  useEffect(() => {
    if (location.state?.teamId) {
      setSelectedTeamId(location.state.teamId)
      setTeamContext({
        teamId: location.state.teamId,
        teamName: location.state.teamName,
        memberProfile: location.state.memberProfile
      })
      // For members, auto-select their profile
      if (location.state.memberProfile) {
        setSelectedProfiles([location.state.memberProfile])
      }
    }
  }, [location.state])

  useEffect(() => {
    dispatch(fetchMyTeams())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchFiles(selectedTeamId))
    // Check for orphaned files
    checkOrphanedFiles()
    // Fetch storage info
    fetchStorageInfo()
  }, [dispatch, selectedTeamId])

  const fetchStorageInfo = async () => {
    try {
      const response = await filesAPI.getStorageInfo() // Assuming you have a getStorageInfo API
      setStorageInfo(response.data)
    } catch (error) {
      console.error('Failed to fetch storage info:', error)
    }
  }
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
    if (!storageInfo) {
      return // or show a message that storage info is loading
    }

    //New Addition

    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleUpload = async (file) => {
    if (storageInfo && file.size > storageInfo.available) {
      // Display an error message
      dispatch({
        type: 'files/setError',
        payload: 'Not enough storage space. Please free up space or upload a smaller file.'
      })
      return
    }

    try {
      await dispatch(uploadFile({
        file,
        teamId: selectedTeamId,
        targetProfiles: selectedProfiles.length > 0 ? selectedProfiles : undefined,
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress}%`)
        }
      })).unwrap()
      // Refresh files list after successful upload
      dispatch(fetchFiles(selectedTeamId))
      // Refresh orphaned files check
      checkOrphanedFiles()
    } catch (error) {
      console.error('Upload failed:', error)
      // Error is handled by the slice
    }
  }

  const handleShareFile = async () => {
    if (!fileToShare || selectedProfiles.length === 0) return

    try {
      await dispatch(shareFile({
        fileId: fileToShare._id,
        targetProfiles: selectedProfiles
      })).unwrap()
      setShowShareModal(false)
      setFileToShare(null)
      setSelectedProfiles([])
      dispatch(fetchFiles(selectedTeamId))
    } catch (error) {
      console.error('Failed to share file:', error)
    }
  }

  const toggleProfile = (profile) => {
    setSelectedProfiles(prev =>
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    )
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

      {storageInfo && (
        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Storage Information</h3>
              <p className="mt-1 text-sm text-blue-700">
                Total: {formatFileSize(storageInfo.total)} | Available: {formatFileSize(storageInfo.available)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Team Context Banner */}
      {teamContext && (
        <div className="mb-6 rounded-md bg-indigo-50 p-4 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-indigo-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-indigo-900">
                  Viewing Team Files: {teamContext.teamName}
                </h3>
                {teamContext.memberProfile && (
                  <p className="text-xs text-indigo-700 mt-1">
                    Your Profile: <span className="font-semibold">{teamContext.memberProfile}</span>
                    {' • '}Files will be uploaded with this profile
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setTeamContext(null)
                setSelectedTeamId(null)
                setSelectedProfiles([])
              }}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              View Personal Files
            </button>
          </div>
        </div>
      )}

      {/* Team and Profile Selector */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Upload Context
            </label>
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Personal Files</option>
              {myTeams.adminOf.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name} (Admin)
                </option>
              ))}
            </select>
          </div>

          {selectedTeamId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Profiles (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {profiles.map((profile) => (
                  <button
                    key={profile}
                    onClick={() => toggleProfile(profile)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedProfiles.includes(profile)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
              Any file type
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
