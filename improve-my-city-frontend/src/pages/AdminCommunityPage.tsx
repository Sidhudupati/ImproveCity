import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Preloader } from '@/components/Preloader'
import { communityService } from '@/services/community'
import { useAuth } from '@/hooks/useAuth'
import type { SocietyDetails, SocietyIssueStatus, SocietySummary } from '@/types/community'

const formatDateTime = (value: number) => new Date(value).toLocaleString()

export function AdminCommunityPage() {
  const { user } = useAuth()
  const [societies, setSocieties] = useState<SocietySummary[]>([])
  const [selectedSocietyId, setSelectedSocietyId] = useState('')
  const [selectedSociety, setSelectedSociety] = useState<SocietyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({})

  const selectedSummary = useMemo(
    () => societies.find((society) => society.id === selectedSocietyId) ?? null,
    [societies, selectedSocietyId]
  )

  const loadSocieties = async () => {
    const data = await communityService.listSocieties()
    setSocieties(data)
    setSelectedSocietyId((current) => current || data[0]?.id || '')
    return data
  }

  const loadDetails = async (societyId: string) => {
    if (!societyId) return
    const details = await communityService.getSocietyDetails(societyId)
    setSelectedSociety(details)
  }

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      try {
        const data = await loadSocieties()
        if (data[0]?.id) {
          await loadDetails(data[0].id)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load community admin data')
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    if (!selectedSocietyId) {
      return
    }
    void loadDetails(selectedSocietyId)
  }, [selectedSocietyId])

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <Preloader />
  }

  const refresh = async () => {
    await loadSocieties()
    if (selectedSocietyId) {
      await loadDetails(selectedSocietyId)
    }
  }

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!selectedSocietyId) return
    try {
      await communityService.reviewJoinRequest(selectedSocietyId, requestId, action)
      toast.success(`Request ${action}d`)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to review request')
    }
  }

  const handleAddMember = async () => {
    if (!selectedSocietyId || !addMemberEmail.trim()) return
    try {
      await communityService.addMember(selectedSocietyId, addMemberEmail.trim())
      toast.success('Member added')
      setAddMemberEmail('')
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member')
    }
  }

  const handleRemoveMember = async (memberUserId: string) => {
    if (!selectedSocietyId) return
    try {
      await communityService.removeMember(selectedSocietyId, memberUserId)
      toast.success('Member removed')
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const handleIssueStatusUpdate = async (issueId: string, status: SocietyIssueStatus) => {
    if (!selectedSocietyId) return
    try {
      await communityService.updateIssueStatus(selectedSocietyId, issueId, status, resolutionDrafts[issueId])
      toast.success('Issue updated')
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update issue')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8">
        <div className="rounded-3xl overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-2xl">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/10 border border-white/15">
              <span className="text-sm font-medium">Community Admin Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Approve members, solve issues, manage people</h1>
            <p className="max-w-3xl text-white/80 text-base sm:text-lg">
              This panel covers the admin-side features: accept society members, resolve internal issues, and add or remove people from a group.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <Card className="p-5 bg-card/60 backdrop-blur-sm h-fit">
            <h2 className="text-xl font-bold mb-4">Managed societies</h2>
            <div className="space-y-3">
              {societies.map((society) => (
                <button
                  key={society.id}
                  onClick={() => setSelectedSocietyId(society.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedSocietyId === society.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                >
                  <p className="font-semibold">{society.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{society.address}</p>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div className="rounded-xl bg-muted/40 px-2 py-2">
                      <div className="font-semibold text-foreground">{society.memberCount}</div>
                      <div className="text-muted-foreground">Members</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 px-2 py-2">
                      <div className="font-semibold text-foreground">{society.pendingRequestCount}</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 px-2 py-2">
                      <div className="font-semibold text-foreground">{society.openIssueCount}</div>
                      <div className="text-muted-foreground">Issues</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {!selectedSummary || !selectedSociety ? (
            <Card className="p-8">Select a society to manage.</Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 bg-card/60 backdrop-blur-sm">
                <h2 className="text-2xl font-bold">{selectedSummary.name}</h2>
                <p className="text-muted-foreground mt-2">{selectedSummary.description}</p>
                <p className="text-sm text-muted-foreground mt-3">{selectedSummary.address}</p>
              </Card>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/60 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4">Pending join requests</h3>
                  <div className="space-y-3">
                    {selectedSociety.joinRequests.filter((request) => request.status === 'pending').length === 0 && (
                      <p className="text-sm text-muted-foreground">No pending requests.</p>
                    )}
                    {selectedSociety.joinRequests.filter((request) => request.status === 'pending').map((request) => (
                      <div key={request.id} className="rounded-2xl border border-border p-4">
                        <p className="font-semibold">{request.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{request.email}</p>
                        {request.message && <p className="text-sm mt-3">{request.message}</p>}
                        <p className="text-xs text-muted-foreground mt-3">{formatDateTime(request.createdAt)}</p>
                        <div className="flex gap-3 mt-4">
                          <Button size="sm" onClick={() => handleJoinRequest(request.id, 'approve')}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleJoinRequest(request.id, 'reject')}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-card/60 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4">Add people directly</h3>
                  <p className="text-sm text-muted-foreground mb-4">Enter the email of an existing registered user.</p>
                  <div className="space-y-3">
                    <Input value={addMemberEmail} onChange={(event) => setAddMemberEmail(event.target.value)} placeholder="resident@example.com" />
                    <Button onClick={handleAddMember}>Add member</Button>
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-card/60 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Members</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {selectedSociety.members.map((member) => (
                    <div key={member.userId} className="rounded-2xl border border-border p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{member.email}</p>
                        <p className="text-xs text-muted-foreground mt-2 uppercase">{member.role}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.userId)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-card/60 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Issue resolution</h3>
                <div className="space-y-4">
                  {selectedSociety.issues.length === 0 && <p className="text-sm text-muted-foreground">No society issues to manage.</p>}
                  {selectedSociety.issues.map((issue) => (
                    <div key={issue.id} className="rounded-2xl border border-border p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{issue.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{issue.category} by {issue.createdByName}</p>
                          <p className="text-sm mt-3">{issue.description}</p>
                        </div>
                        <div className="min-w-[170px]">
                          <p className="text-xs text-muted-foreground uppercase">Current status</p>
                          <p className="font-semibold mt-1">{issue.status}</p>
                        </div>
                      </div>

                      <Textarea
                        className="mt-4"
                        value={resolutionDrafts[issue.id] ?? issue.resolutionNote ?? ''}
                        onChange={(event) => setResolutionDrafts((value) => ({ ...value, [issue.id]: event.target.value }))}
                        placeholder="Resolution notes"
                        rows={3}
                      />

                      <div className="flex flex-wrap gap-3 mt-4">
                        <Button size="sm" variant={issue.status === 'open' ? 'default' : 'outline'} onClick={() => handleIssueStatusUpdate(issue.id, 'open')}>Open</Button>
                        <Button size="sm" variant={issue.status === 'in_progress' ? 'default' : 'outline'} onClick={() => handleIssueStatusUpdate(issue.id, 'in_progress')}>In Progress</Button>
                        <Button size="sm" variant={issue.status === 'resolved' ? 'default' : 'outline'} onClick={() => handleIssueStatusUpdate(issue.id, 'resolved')}>Resolved</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
