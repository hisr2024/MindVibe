'use client'

import { useState, useEffect } from 'react'

interface TeamMember {
  id: number
  user_id: string
  role: string
  is_active: boolean
  display_name: string | null
  joined_at: string
}

interface TeamInvitation {
  id: string
  invitee_email: string | null
  invitee_user_id: string | null
  role: string
  status: string
  expires_at: string
}

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  owner_id: string
  max_members: number
  is_active: boolean
  subscription_tier: string | null
  member_count: number
  kiaan_enabled: boolean
  journeys_shared: boolean
  analytics_shared: boolean
  voice_enabled: boolean
  created_at: string
}

interface TeamDetail extends Team {
  settings: Record<string, unknown> | null
  updated_at: string | null
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [selectedInvitations, setSelectedInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const pageSize = 20

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/teams?limit=${pageSize}&offset=${page * pageSize}&include_inactive=true`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetail = async (teamId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/admin/teams/${teamId}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedTeam(data.team)
        setSelectedMembers(data.members || [])
        setSelectedInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error('Failed to fetch team detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleToggleActive = async (teamId: string, currentlyActive: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/teams/${teamId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !currentlyActive }),
      })
      if (res.ok) {
        fetchTeams()
        if (selectedTeam?.id === teamId) {
          fetchTeamDetail(teamId)
        }
      }
    } catch (err) {
      console.error('Failed to toggle team:', err)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action uses soft-delete and can be recovered.')) return
    try {
      const res = await fetch(`${apiUrl}/api/admin/teams/${teamId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setSelectedTeam(null)
        fetchTeams()
      }
    } catch (err) {
      console.error('Failed to delete team:', err)
    }
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm('Remove this member from the team?')) return
    try {
      const res = await fetch(`${apiUrl}/api/admin/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        fetchTeamDetail(teamId)
        fetchTeams()
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  const handleUpdateRole = async (teamId: string, userId: string, newRole: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/teams/${teamId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        fetchTeamDetail(teamId)
      }
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [page])

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    developer: 'bg-green-100 text-green-800',
    member: 'bg-gray-100 text-gray-800',
    viewer: 'bg-yellow-100 text-yellow-800',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-500',
    revoked: 'bg-red-100 text-red-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all teams, members, and access across the platform
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {total} team{total !== 1 ? 's' : ''} total
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">All Teams</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No teams found</div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => fetchTeamDetail(team.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{team.name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        team.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {team.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {team.member_count} member{team.member_count !== 1 ? 's' : ''} &middot;{' '}
                    {team.subscription_tier || 'free'} tier
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {total > pageSize && (
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 self-center">
                    Page {page + 1} of {Math.ceil(total / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * pageSize >= total}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Team Detail */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <div className="text-center py-12 text-gray-500">Loading team details...</div>
          ) : !selectedTeam ? (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              Select a team to view details
            </div>
          ) : (
            <div className="space-y-6">
              {/* Team Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Slug: <code className="bg-gray-100 px-1 rounded">{selectedTeam.slug}</code>
                    </p>
                    {selectedTeam.description && (
                      <p className="text-sm text-gray-600 mt-2">{selectedTeam.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleActive(selectedTeam.id, selectedTeam.is_active)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        selectedTeam.is_active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {selectedTeam.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-gray-500">Owner</div>
                    <div className="text-sm font-medium truncate" title={selectedTeam.owner_id}>
                      {selectedTeam.owner_id.slice(0, 8)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Max Members</div>
                    <div className="text-sm font-medium">{selectedTeam.max_members}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Subscription</div>
                    <div className="text-sm font-medium capitalize">
                      {selectedTeam.subscription_tier || 'free'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Created</div>
                    <div className="text-sm font-medium">
                      {new Date(selectedTeam.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {[
                    { label: 'KIAAN', enabled: selectedTeam.kiaan_enabled },
                    { label: 'Journeys', enabled: selectedTeam.journeys_shared },
                    { label: 'Analytics', enabled: selectedTeam.analytics_shared },
                    { label: 'Voice', enabled: selectedTeam.voice_enabled },
                  ].map(({ label, enabled }) => (
                    <span
                      key={label}
                      className={`px-2 py-1 text-xs rounded-full ${
                        enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {label}: {enabled ? 'On' : 'Off'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Members */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Members ({selectedMembers.length})
                </h3>
                {selectedMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No members</p>
                ) : (
                  <div className="space-y-3">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              member.is_active ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.display_name || member.user_id.slice(0, 12) + '...'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(selectedTeam.id, member.user_id, e.target.value)
                            }
                            className={`text-xs px-2 py-1 rounded-full border-0 ${
                              roleColors[member.role] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="developer">Developer</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() =>
                                handleRemoveMember(selectedTeam.id, member.user_id)
                              }
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invitations */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Invitations ({selectedInvitations.length})
                </h3>
                {selectedInvitations.length === 0 ? (
                  <p className="text-gray-500 text-sm">No invitations</p>
                ) : (
                  <div className="space-y-3">
                    {selectedInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {inv.invitee_email || inv.invitee_user_id?.slice(0, 12) + '...'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Role: {inv.role} &middot; Expires{' '}
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            statusColors[inv.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
