import { useState, useEffect } from 'react'
import { AlertTriangle, X, FileX, Trash2 } from 'lucide-react'
import { cloudAPI } from '../services/api'

const DisconnectWarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  provider, 
  accountEmail 
}) => {
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && provider && accountEmail) {
      fetchImpact()
    }
  }, [isOpen, provider, accountEmail])

  const fetchImpact = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await cloudAPI.getDisconnectImpact(provider, accountEmail)
      setImpact(response.data)
    } catch (err) {
      setError('Failed to check impact')
      console.error('Impact check error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getProviderName = (provider) => {
    switch (provider) {
      case 'google':
        return 'Google Drive'
      case 'dropbox':
        return 'Dropbox'
      default:
        return provider
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Warning
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  You are about to disconnect <strong>{accountEmail}</strong> from {getProviderName(provider)}.
                </p>

                {loading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Checking file impact...</span>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {impact && !loading && (
                  <div className="mt-4">
                    {impact.affectedFiles > 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <FileX className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-yellow-800">
                              File Access Warning
                            </h4>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                <strong>{impact.affectedFiles}</strong> file{impact.affectedFiles !== 1 ? 's' : ''} 
                                {impact.affectedFiles === 1 ? ' has' : ' have'} chunks stored on this account and will become 
                                <strong> inaccessible</strong> after disconnection.
                              </p>
                              
                              {impact.affectedFiles <= 5 && (
                                <div className="mt-2">
                                  <p className="font-medium">Affected files:</p>
                                  <ul className="mt-1 list-disc list-inside">
                                    {impact.affectedFileNames.map((fileName, index) => (
                                      <li key={index} className="truncate">{fileName}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {impact.affectedFiles > 5 && (
                                <p className="mt-2 text-xs">
                                  View the Files page after disconnection to see which files are affected.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <div className="h-5 w-5 text-green-400">✓</div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">
                              No files will be affected. This account has no stored file chunks.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {impact && impact.affectedFiles > 0 ? 'Disconnect Anyway' : 'Disconnect'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DisconnectWarningModal
