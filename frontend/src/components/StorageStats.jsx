import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HardDrive, Cloud, AlertCircle, RefreshCw } from 'lucide-react'
import { fetchStorageStats, clearError } from '../store/storageSlice'
import { formatStorageSize, calculateStoragePercentage } from '../utils/helpers'

const StorageStats = () => {
  const dispatch = useDispatch()
  const { stats, loading, error, lastUpdated } = useSelector((state) => state.storage)
  const { linkedAccounts } = useSelector((state) => state.cloud)

  useEffect(() => {
    dispatch(fetchStorageStats())
  }, [dispatch])

  // Refresh storage stats when cloud accounts change
  useEffect(() => {
    if (linkedAccounts.length > 0) {
      dispatch(fetchStorageStats())
    }
  }, [dispatch, linkedAccounts.length])

  const handleRefresh = () => {
    dispatch(fetchStorageStats())
  }

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'google':
        return '📁' // Google Drive
      case 'dropbox':
        return '📦' // Dropbox
      default:
        return '☁️'
    }
  }

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-500'
      case 'dropbox':
        return 'bg-blue-600'
      default:
        return 'bg-gray-500'
    }
  }

  const totalStorage = stats.totalAvailable + stats.totalUsed
  const usagePercentage = calculateStoragePercentage(stats.totalUsed, totalStorage)

  if (loading && !stats.providers.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HardDrive className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Storage Statistics</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
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

        {/* Total Storage Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Total Storage</h4>
            <span className="text-sm text-gray-600">
              {formatStorageSize(stats.totalUsed)} / {formatStorageSize(totalStorage)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{usagePercentage}% used</span>
            <span>{formatStorageSize(stats.totalAvailable)} available</span>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">By Provider</h4>
          {stats.providers.length === 0 ? (
            <div className="text-center py-8">
              <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No cloud accounts connected</p>
              <p className="text-sm text-gray-400 mt-1">
                Connect your cloud storage accounts to see statistics
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.providers.map((provider, index) => {
                const providerTotal = provider.available + provider.used
                const providerUsage = calculateStoragePercentage(provider.used, providerTotal)
                
                return (
                  <div key={`${provider.provider}-${provider.accountEmail}-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 ${getProviderColor(provider.provider)} rounded-md p-2 mr-3`}>
                          <span className="text-white text-sm">{getProviderIcon(provider.provider)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {provider.provider}
                          </p>
                          <p className="text-xs text-gray-500">{provider.accountEmail}</p>
                        </div>
                      </div>
                      {provider.error ? (
                        <span className="text-xs text-red-600">Error</span>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {formatStorageSize(provider.used)} / {formatStorageSize(providerTotal)}
                        </span>
                      )}
                    </div>
                    
                    {!provider.error && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div
                            className={`${getProviderColor(provider.provider)} h-1.5 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(providerUsage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{providerUsage}% used</span>
                          <span>{formatStorageSize(provider.available)} free</span>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {lastUpdated && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

export default StorageStats
