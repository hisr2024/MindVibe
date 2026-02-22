'use client'

import { useState, useEffect, useCallback } from 'react'

interface TeamMember {
  id: number
  team_id: string
  user_id: string
  role: string
  display_name: string | null
  is_active: boolean
  joined_at: string
  last_active_at: string | null
}

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  max_members: number
  is_active: boolean
  kiaan_enabled: boolean
  journeys_shared: boolean
  analytics_shared: boolean
  voice_enabled: boolean
  subscription_tier: string | null
  member_count: number
  created_at: string
}

interface Invitation {
  id: string
  team_id: string
  invitee_email: string | null
  invitee_user_id: string | null
  role: string
  status: string
  message: string | null
  invited_by: string
  expires_at: string
  created_at: string
}

interface Permission {
  team_id: string
  user_id: string
  role: string
  permissions: string[]
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [myPermissions, setMyPermissions] = useState<Permission | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteMessage, setInviteMessage] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [])

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/teams`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams || [])
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    }
  }, [apiUrl, getAuthHeaders])

  const fetchPendingInvitations = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/teams/invitations/pending`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setPendingInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    }
  }, [apiUrl, getAuthHeaders])

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/teams/${teamId}/members`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }

  const fetchMyPermissions = async (teamId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/teams/${teamId}/permissions`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setMyPermissions(data)
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  const selectTeam = (team: Team) => {
    setSelectedTeam(team)
    fetchTeamMembers(team.id)
    fetchMyPermissions(team.id)
  }

  const handleCreateTeam = async () => {
    if (!createName.trim()) return
    try {
      const res = await fetch(`${apiUrl}/api/teams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: createName,
          description: createDescription || null,
        }),
      })
      if (res.ok) {
        setShowCreateForm(false)
        setCreateName('')
        setCreateDescription('')
        fetchTeams()
      }
    } catch (err) {
      console.error('Failed to create team:', err)
    }
  }

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return
    try {
      const res = await fetch(`${apiUrl}/api/teams/${selectedTeam.id}/invitations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          message: inviteMessage || null,
        }),
      })
      if (res.ok) {
        setShowInviteForm(false)
        setInviteEmail('')
        setInviteRole('member')
        setInviteMessage('')
      }
    } catch (err) {
      console.error('Failed to invite member:', err)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/teams/invitations/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ invitation_id: invitationId }),
      })
      if (res.ok) {
        fetchTeams()
        fetchPendingInvitations()
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err)
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/teams/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        fetchPendingInvitations()
      }
    } catch (err) {
      console.error('Failed to decline invitation:', err)
    }
  }

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to leave this team?')) return
    try {
      const res = await fetch(`${apiUrl}/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setSelectedTeam(null)
        fetchTeams()
      }
    } catch (err) {
      console.error('Failed to leave team:', err)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchTeams(), fetchPendingInvitations()])
      setLoading(false)
    }
    init()
  }, [fetchTeams, fetchPendingInvitations])

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    developer: 'bg-green-100 text-green-800 border-green-200',
    member: 'bg-gray-100 text-gray-800 border-gray-200',
    viewer: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }

  const canInvite = myPermissions?.permissions.includes('team:members:invite')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading your teams...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
            <p className="text-gray-500 mt-1">Collaborate with your team on shared journeys and insights</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Create Team
          </button>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-amber-800 mb-3">
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-white rounded-md p-3 border border-amber-100"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Team Invitation
                    </div>
                    <div className="text-xs text-gray-500">
                      Role: <span className="capitalize">{inv.role}</span>
                      {inv.message && <> &middot; &quot;{inv.message}&quot;</>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptInvitation(inv.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(inv.id)}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Team</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="My Development Team"
                  />
                </div>
                <div>
                  <label htmlFor="team-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="team-description"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="A brief description of your team..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    disabled={!createName.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteForm && selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Invite to {selectedTeam.name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="developer">Developer</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="Welcome to the team!"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowInviteForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-4">&#x1F465;</div>
            <h3 className="text-lg font-semibold text-gray-900">No teams yet</h3>
            <p className="text-gray-500 mt-1">Create your first team to start collaborating</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Cards */}
            <div className="space-y-4">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                    selectedTeam?.id === team.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{team.description}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                        team.subscription_tier === 'premium'
                          ? 'bg-purple-100 text-purple-800'
                          : team.subscription_tier === 'enterprise'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {team.subscription_tier || 'free'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                    <span>{team.member_count} member{team.member_count !== 1 ? 's' : ''}</span>
                    <span>&middot;</span>
                    <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {team.kiaan_enabled && (
                      <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded">KIAAN</span>
                    )}
                    {team.journeys_shared && (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">Journeys</span>
                    )}
                    {team.analytics_shared && (
                      <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded">Analytics</span>
                    )}
                    {team.voice_enabled && (
                      <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">Voice</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Team Detail */}
            {selectedTeam && (
              <div className="space-y-4">
                {/* Permissions & Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Team Details</h3>
                    <div className="flex space-x-2">
                      {canInvite && (
                        <button
                          onClick={() => setShowInviteForm(true)}
                          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Invite Member
                        </button>
                      )}
                      {myPermissions?.role !== 'owner' && (
                        <button
                          onClick={() => handleLeaveTeam(selectedTeam.id)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>

                  {myPermissions && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Your Role</div>
                      <span
                        className={`inline-block px-2 py-1 text-sm rounded-full border capitalize ${
                          roleColors[myPermissions.role] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {myPermissions.role}
                      </span>
                      <div className="text-xs text-gray-400 mt-2">
                        {myPermissions.permissions.length} permission
                        {myPermissions.permissions.length !== 1 ? 's' : ''} granted
                      </div>
                    </div>
                  )}
                </div>

                {/* Members List */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Members ({members.length})
                  </h3>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              roleColors[member.role] || 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {(member.display_name || member.user_id)[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.display_name || member.user_id.slice(0, 16) + '...'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full capitalize border ${
                            roleColors[member.role] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
