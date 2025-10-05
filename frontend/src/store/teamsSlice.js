import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { teamsAPI } from '../services/api'

// Async thunks
export const createTeam = createAsyncThunk(
  'teams/create',
  async (teamData, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.createTeam(teamData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create team')
    }
  }
)

export const fetchMyTeams = createAsyncThunk(
  'teams/fetchMyTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.getMyTeams()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch teams')
    }
  }
)

export const inviteToTeam = createAsyncThunk(
  'teams/invite',
  async ({ teamId, email, profile }, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.inviteToTeam(teamId, email, profile)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send invitation')
    }
  }
)

export const joinTeam = createAsyncThunk(
  'teams/join',
  async (token, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.joinTeam(token)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to join team')
    }
  }
)

export const fetchTeamMembers = createAsyncThunk(
  'teams/fetchMembers',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.getTeamMembers(teamId)
      return { teamId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch team members')
    }
  }
)

export const removeTeamMember = createAsyncThunk(
  'teams/removeMember',
  async ({ teamId, userId }, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.removeTeamMember(teamId, userId)
      return { teamId, userId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove team member')
    }
  }
)

export const fetchPendingInvitations = createAsyncThunk(
  'teams/fetchPendingInvitations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.getPendingInvitations()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch invitations')
    }
  }
)

export const acceptInvitation = createAsyncThunk(
  'teams/acceptInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.acceptInvitation(invitationId)
      return { invitationId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to accept invitation')
    }
  }
)

export const rejectInvitation = createAsyncThunk(
  'teams/rejectInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await teamsAPI.rejectInvitation(invitationId)
      return { invitationId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to reject invitation')
    }
  }
)

const teamsSlice = createSlice({
  name: 'teams',
  initialState: {
    myTeams: {
      memberOf: [],
      adminOf: []
    },
    selectedTeam: null,
    teamMembers: {},
    pendingInvitations: [],
    loading: false,
    error: null,
    inviteLink: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearInviteLink: (state) => {
      state.inviteLink = null
    },
    setSelectedTeam: (state, action) => {
      state.selectedTeam = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false
        state.myTeams.adminOf.push(action.payload)
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch my teams
      .addCase(fetchMyTeams.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyTeams.fulfilled, (state, action) => {
        state.loading = false
        state.myTeams = action.payload
      })
      .addCase(fetchMyTeams.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Invite to team
      .addCase(inviteToTeam.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(inviteToTeam.fulfilled, (state, action) => {
        state.loading = false
        state.inviteLink = action.payload.inviteLink
      })
      .addCase(inviteToTeam.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Join team
      .addCase(joinTeam.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(joinTeam.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(joinTeam.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch team members
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false
        state.teamMembers[action.payload.teamId] = action.payload.members
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Remove team member
      .addCase(removeTeamMember.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.loading = false
        const { teamId, userId } = action.payload
        if (state.teamMembers[teamId]) {
          state.teamMembers[teamId] = state.teamMembers[teamId].filter(
            member => member.userId !== userId
          )
        }
      })
      .addCase(removeTeamMember.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch pending invitations
      .addCase(fetchPendingInvitations.pending, (state) => {
        // Don't set loading state for background invitation fetching
      })
      .addCase(fetchPendingInvitations.fulfilled, (state, action) => {
        state.pendingInvitations = action.payload.invitations || []
      })
      .addCase(fetchPendingInvitations.rejected, (state, action) => {
        // Silently fail - don't show errors for background invitation fetching
        state.pendingInvitations = []
      })
      // Accept invitation
      .addCase(acceptInvitation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.loading = false
        state.pendingInvitations = state.pendingInvitations.filter(
          inv => inv._id !== action.payload.invitationId
        )
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Reject invitation
      .addCase(rejectInvitation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(rejectInvitation.fulfilled, (state, action) => {
        state.loading = false
        state.pendingInvitations = state.pendingInvitations.filter(
          inv => inv._id !== action.payload.invitationId
        )
      })
      .addCase(rejectInvitation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearInviteLink, setSelectedTeam } = teamsSlice.actions
export default teamsSlice.reducer
