import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, X, Check, XCircle } from 'lucide-react'
import { 
  fetchPendingInvitations, 
  acceptInvitation, 
  rejectInvitation,
  fetchMyTeams 
} from '../store/teamsSlice'
import { formatDate } from '../utils/helpers'

const InvitationNotifications = () => {
  const dispatch = useDispatch()
  const { pendingInvitations } = useSelector((state) => state.teams)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        await dispatch(fetchPendingInvitations()).unwrap()
      } catch (error) {
        // Silently handle errors - don't show error toast for invitations
        console.error('Failed to fetch invitations:', error)
      }
    }
    
    loadInvitations()
    
    // Poll for new invitations every 30 seconds
    const interval = setInterval(() => {
      loadInvitations()
    }, 30000)

    return () => clearInterval(interval)
  }, [dispatch])

  const handleAccept = async (invitationId) => {
    try {
      await dispatch(acceptInvitation(invitationId)).unwrap()
      // Refresh teams list after accepting
      dispatch(fetchMyTeams())
    } catch (error) {
      console.error('Failed to accept invitation:', error)
    }
  }

  const handleReject = async (invitationId) => {
    try {
      await dispatch(rejectInvitation(invitationId)).unwrap()
    } catch (error) {
      console.error('Failed to reject invitation:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {pendingInvitations && pendingInvitations.length > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {pendingInvitations.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Team Invitations
                </h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {pendingInvitations.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No pending invitations</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.teamId?.name || 'Team'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Profile: <span className="font-medium">{invitation.profile}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Expires {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleAccept(invitation._id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(invitation._id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default InvitationNotifications
