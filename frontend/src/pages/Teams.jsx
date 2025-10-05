import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Plus, 
  Mail, 
  Trash2, 
  AlertCircle,
  Copy,
  Check,
  UserPlus,
  Shield,
  FolderOpen
} from 'lucide-react'
import { 
  fetchMyTeams, 
  createTeam, 
  inviteToTeam, 
  fetchTeamMembers,
  removeTeamMember,
  clearError,
  clearInviteLink,
  setSelectedTeam
} from '../store/teamsSlice'
import { formatDate } from '../utils/helpers'

const Teams = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { myTeams, selectedTeam, teamMembers, loading, error, inviteLink } = useSelector((state) => state.teams)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteProfile, setInviteProfile] = useState('editors')
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeTab, setActiveTab] = useState('admin') // 'admin' or 'member'

  const profiles = ['editors', 'content-writers', 'tech-devs', 'cross-section']

  const handleViewTeamFiles = (teamData, memberProfile) => {
    // Navigate to files page with team context
    navigate('/files', { state: { teamId: teamData._id, teamName: teamData.name, memberProfile } })
  }

  useEffect(() => {
    dispatch(fetchMyTeams())
  }, [dispatch])

  useEffect(() => {
    if (selectedTeam) {
      dispatch(fetchTeamMembers(selectedTeam._id))
    }
  }, [selectedTeam, dispatch])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    try {
      await dispatch(createTeam({ name: newTeamName, profiles })).unwrap()
      setNewTeamName('')
      setShowCreateModal(false)
      dispatch(fetchMyTeams())
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedTeam) return

    try {
      await dispatch(inviteToTeam({ 
        teamId: selectedTeam._id, 
        email: inviteEmail, 
        profile: inviteProfile 
      })).unwrap()
      setInviteEmail('')
    } catch (error) {
      console.error('Failed to send invitation:', error)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!selectedTeam) return
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await dispatch(removeTeamMember({ teamId: selectedTeam._id, userId })).unwrap()
      } catch (error) {
        console.error('Failed to remove member:', error)
      }
    }
  }

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      const fullLink = `${window.location.origin}${inviteLink}`
      navigator.clipboard.writeText(fullLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleCloseInviteModal = () => {
    setShowInviteModal(false)
    dispatch(clearInviteLink())
    setCopiedLink(false)
  }

  const currentTeams = activeTab === 'admin' ? myTeams.adminOf : myTeams.memberOf

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your teams and collaborate with team members
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </button>
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admin'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline h-4 w-4 mr-2" />
            Teams I Manage ({myTeams.adminOf.length})
          </button>
          <button
            onClick={() => setActiveTab('member')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'member'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Teams I'm In ({myTeams.memberOf.length})
          </button>
        </nav>
      </div>

      {/* Teams Grid */}
      {loading && !selectedTeam ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : currentTeams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'admin' 
              ? 'Get started by creating a team.' 
              : 'You are not a member of any teams yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentTeams.map((team) => {
            const isAdmin = activeTab === 'admin'
            const teamData = isAdmin ? team : (team.teamId || team)
            
            // Skip if teamData is invalid
            if (!teamData || !teamData._id) {
              return null
            }
            
            return (
              <div
                key={teamData._id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (isAdmin) {
                    setSelectedTeam(teamData)
                    dispatch(setSelectedTeam(teamData))
                  }
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{teamData.name}</h3>
                    {isAdmin && (
                      <Shield className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                  {!isAdmin && (
                    <p className="text-sm text-gray-500 mb-2">
                      Profile: <span className="font-medium text-gray-700">{team.profile}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Created {formatDate(teamData.createdAt)}
                  </p>
                  {isAdmin ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTeam(teamData)
                        dispatch(setSelectedTeam(teamData))
                        setShowInviteModal(true)
                      }}
                      className="mt-4 w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewTeamFiles(teamData, team.profile)
                      }}
                      className="mt-4 w-full inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      View Team Files
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Team Details */}
      {selectedTeam && activeTab === 'admin' && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedTeam.name} - Team Members
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : teamMembers[selectedTeam._id]?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No members yet. Invite team members to get started.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {teamMembers[selectedTeam._id]?.map((member) => (
                  <li key={member._id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        Profile: {member.profile} • Joined {formatDate(member.joinedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleCreateTeam}>
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Create New Team
                    </h3>
                    <div className="mt-4">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Team name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseInviteModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleInvite}>
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Invite to {selectedTeam.name}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                      <select
                        value={inviteProfile}
                        onChange={(e) => setInviteProfile(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {profiles.map((profile) => (
                          <option key={profile} value={profile}>
                            {profile}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {inviteLink && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-800 mb-2">Invitation sent! Share this link:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={`${window.location.origin}${inviteLink}`}
                            readOnly
                            className="flex-1 px-2 py-1 text-sm border border-green-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleCopyInviteLink}
                            className="p-2 text-green-600 hover:text-green-700"
                          >
                            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Send Invite
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Teams
