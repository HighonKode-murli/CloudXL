import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Cloud, Plus, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { fetchCloudStatus } from '../store/cloudSlice'
import { cloudAPI } from '../services/api'
import StorageStats from '../components/StorageStats'
import DisconnectWarningModal from '../components/DisconnectWarningModal'

const Dashboard = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { linkedAccounts, loading, error } = useSelector((state) => state.cloud)
  const [disconnectModal, setDisconnectModal] = useState({
    isOpen: false,
    provider: null,
    accountEmail: null
  })

  useEffect(() => {
    console.log('Dashboard mounted, token:', localStorage.getItem('token'))
    dispatch(fetchCloudStatus())

    // Check if we just connected a provider
    const connected = searchParams.get('connected')
    if (connected) {
      console.log(`Successfully connected ${connected}`)
      // Remove the query parameter
      setSearchParams({})
      // Refresh cloud status
      setTimeout(() => {
        dispatch(fetchCloudStatus())
      }, 1000)
    }
  }, [dispatch, searchParams, setSearchParams])

  const providers = [
    {
      name: 'Google Drive',
      id: 'google',
      color: 'bg-blue-500',
      icon: '📁',
      connectUrl: () => cloudAPI.connectGoogle(),
    },
    {
      name: 'Dropbox',
      id: 'dropbox', 
      color: 'bg-blue-600',
      icon: '📦',
      connectUrl: () => cloudAPI.connectDropbox(),
    },
  ]

  const getProviderAccounts = (providerId) => {
    return linkedAccounts.filter(acc => acc.provider === providerId)
  }

  const getProviderStatus = (providerId) => {
    const accounts = getProviderAccounts(providerId)
    if (accounts.length === 0) return { status: 'disconnected', accounts: [] }

    const hasExpired = accounts.some(acc => new Date(acc.expiresAt) < new Date())
    const hasActive = accounts.some(acc => new Date(acc.expiresAt) >= new Date())

    let status = 'connected'
    if (hasExpired && !hasActive) status = 'expired'
    else if (hasExpired && hasActive) status = 'partial'

    return { status, accounts }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status, accountCount = 0) => {
    switch (status) {
      case 'connected':
        return accountCount > 1 ? `${accountCount} Accounts Connected` : 'Connected'
      case 'expired':
        return accountCount > 1 ? `${accountCount} Accounts Expired` : 'Token Expired'
      case 'partial':
        return `${accountCount} Accounts (Some Expired)`
      default:
        return 'Not Connected'
    }
  }

  const handleDisconnectAccount = (provider, accountEmail) => {
    setDisconnectModal({
      isOpen: true,
      provider,
      accountEmail
    })
  }

  const confirmDisconnect = async () => {
    try {
      await cloudAPI.disconnectAccount(disconnectModal.provider, disconnectModal.accountEmail)
      // Refresh the cloud status after disconnecting
      dispatch(fetchCloudStatus())
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      // You could add a toast notification here
    }
  }

  const closeDisconnectModal = () => {
    setDisconnectModal({
      isOpen: false,
      provider: null,
      accountEmail: null
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your cloud storage connections and view account status
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading cloud status
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {providers.map((provider) => {
          const { status, accounts } = getProviderStatus(provider.id)

          return (
            <div
              key={provider.id}
              className="relative group bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${provider.color} rounded-md p-3`}>
                    <span className="text-2xl">{provider.icon}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {provider.name}
                      </dt>
                      <dd className="flex items-center text-lg font-medium text-gray-900">
                        {getStatusIcon(status)}
                        <span className="ml-2">{getStatusText(status, accounts.length)}</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {accounts.length > 0 && (
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm space-y-2">
                    {accounts.map((account, index) => {
                      const isExpired = new Date(account.expiresAt) < new Date()
                      return (
                        <div key={`${account.provider}-${account.accountEmail}-${index}`} className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 font-medium">{account.accountEmail || 'N/A'}</p>
                            {/* <p className="text-gray-600">
                              Expires: {new Date(account.expiresAt).toLocaleDateString()}
                            </p> */}
                          </div>
                          <div className="flex space-x-2 items-center">
                            {isExpired ? (
                              <button
                                onClick={provider.connectUrl}
                                className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              >
                                Reconnect
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                            <button
                              onClick={() => handleDisconnectAccount(account.provider, account.accountEmail)}
                              className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 px-5 py-3">
                <div className="flex space-x-3 items-center justify-center">
                  <button
                    onClick={provider.connectUrl}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {accounts.length === 0 ? 'Connect' : 'Add Another'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <StorageStats />
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Getting Started
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Connect at least one cloud storage provider to start uploading and managing your files.
                Your files will be split and distributed across connected providers for redundancy.
              </p>
            </div>
            <div className="mt-5">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <Cloud className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      How it works
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Connect your cloud storage accounts (Google Drive, Dropbox)</li>
                        <li>Upload files through the Files page</li>
                        <li>Files are automatically split and distributed across your connected providers</li>
                        <li>Download files seamlessly - they're automatically reassembled</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Warning Modal */}
      <DisconnectWarningModal
        isOpen={disconnectModal.isOpen}
        onClose={closeDisconnectModal}
        onConfirm={confirmDisconnect}
        provider={disconnectModal.provider}
        accountEmail={disconnectModal.accountEmail}
      />
    </div>
  )
}

export default Dashboard
