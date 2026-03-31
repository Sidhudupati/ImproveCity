import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { communityService } from '@/services/community'
import type { SocietyDetails, SocietySummary } from '@/types/community'
import { Preloader } from '@/components/Preloader'
import { RiCalendarEventLine, RiCarLine, RiChat3Line, RiMapPin2Line, RiNotification3Line, RiTeamLine, RiToolsLine } from 'react-icons/ri'

const formatDateTime = (value: number) => new Date(value).toLocaleString()

export function CommunityPage() {
  const [societies, setSocieties] = useState<SocietySummary[]>([])
  const [selectedSocietyId, setSelectedSocietyId] = useState('')
  const [selectedSociety, setSelectedSociety] = useState<SocietyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingDetails, setIsRefreshingDetails] = useState(false)

  const [joinMessage, setJoinMessage] = useState('')
  const [carpoolForm, setCarpoolForm] = useState({ from: '', to: '', departureTime: '', seats: '1', notes: '' })
  const [issueForm, setIssueForm] = useState({ title: '', description: '', category: '' })
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' })
  const [chatMessage, setChatMessage] = useState('')

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

  const loadSocietyDetails = async (societyId: string) => {
    if (!societyId) {
      setSelectedSociety(null)
      return
    }
    setIsRefreshingDetails(true)
    try {
      const details = await communityService.getSocietyDetails(societyId)
      setSelectedSociety(details)
    } finally {
      setIsRefreshingDetails(false)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      try {
        const data = await loadSocieties()
        if (data[0]?.id) {
          await loadSocietyDetails(data[0].id)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load societies')
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
    void loadSocietyDetails(selectedSocietyId)
  }, [selectedSocietyId])

  const refreshSelectedSociety = async () => {
    await loadSocieties()
    if (selectedSocietyId) {
      await loadSocietyDetails(selectedSocietyId)
    }
  }

  const handleJoinRequest = async () => {
    if (!selectedSocietyId) return
    try {
      await communityService.requestJoin(selectedSocietyId, joinMessage)
      toast.success('Join request sent to the admin team')
      setJoinMessage('')
      await refreshSelectedSociety()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request access')
    }
  }

  const handleCreateCarpool = async () => {
    if (!selectedSocietyId) return
    try {
      await communityService.createCarpool(selectedSocietyId, {
        from: carpoolForm.from,
        to: carpoolForm.to,
        departureTime: new Date(carpoolForm.departureTime).getTime(),
        seats: Number(carpoolForm.seats),
        notes: carpoolForm.notes
      })
      toast.success('Carpool posted')
      setCarpoolForm({ from: '', to: '', departureTime: '', seats: '1', notes: '' })
      await loadSocietyDetails(selectedSocietyId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create carpool')
    }
  }

  const handleCreateIssue = async () => {
    if (!selectedSocietyId) return
    try {
      await communityService.createIssue(selectedSocietyId, issueForm)
      toast.success('Society issue reported')
      setIssueForm({ title: '', description: '', category: '' })
      await loadSocietyDetails(selectedSocietyId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create issue')
    }
  }

  const handleCreateNotice = async () => {
    if (!selectedSocietyId) return
    try {
      await communityService.createNotice(selectedSocietyId, noticeForm)
      toast.success('Notice posted')
      setNoticeForm({ title: '', content: '' })
      await loadSocietyDetails(selectedSocietyId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post notice')
    }
  }

  const handleSendMessage = async () => {
    if (!selectedSocietyId || !chatMessage.trim()) return
    try {
      await communityService.createChatMessage(selectedSocietyId, chatMessage.trim())
      setChatMessage('')
      await loadSocietyDetails(selectedSocietyId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  if (isLoading) {
    return <Preloader />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8">
        <div className="rounded-3xl overflow-hidden bg-linear-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white shadow-2xl">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/15 border border-white/20">
              <RiTeamLine className="w-4 h-4" />
              <span className="text-sm font-medium">Society Community Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Resident features for societies and groups</h1>
            <p className="max-w-3xl text-white/85 text-base sm:text-lg">
              Request access to a society, arrange carpools, report internal issues, post on the notice board, and chat with other residents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
          <Card className="p-5 bg-card/60 backdrop-blur-sm h-fit">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Societies</h2>
              <p className="text-sm text-muted-foreground">Choose a community to join or manage.</p>
            </div>

            <div className="space-y-3">
              {societies.map((society) => (
                <button
                  key={society.id}
                  onClick={() => setSelectedSocietyId(society.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedSocietyId === society.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{society.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{society.code}</p>
                    </div>
                    <span className="text-xs rounded-full px-2 py-1 bg-muted text-muted-foreground uppercase">
                      {society.membershipStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{society.description}</p>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div className="rounded-xl bg-muted/40 px-3 py-2">
                      <div className="font-semibold text-foreground">{society.memberCount}</div>
                      <div className="text-muted-foreground">Members</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 px-3 py-2">
                      <div className="font-semibold text-foreground">{society.pendingRequestCount}</div>
                      <div className="text-muted-foreground">Requests</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 px-3 py-2">
                      <div className="font-semibold text-foreground">{society.openIssueCount}</div>
                      <div className="text-muted-foreground">Open issues</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            {!selectedSummary || !selectedSociety ? (
              <Card className="p-8">Select a society to continue.</Card>
            ) : (
              <>
                <Card className="p-6 bg-card/60 backdrop-blur-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedSummary.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <RiMapPin2Line className="w-4 h-4" />
                        <span>{selectedSummary.address}</span>
                      </div>
                      <p className="text-muted-foreground mt-3 max-w-3xl">{selectedSummary.description}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                      <div className="font-semibold uppercase tracking-wide text-muted-foreground">Membership</div>
                      <div className="text-lg font-bold mt-1">{selectedSummary.membershipStatus}</div>
                    </div>
                  </div>
                </Card>

                {selectedSummary.membershipStatus === 'none' && (
                  <Card className="p-6 bg-card/60 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2">Request to join this society</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add a short note for the admin team.</p>
                    <Textarea
                      value={joinMessage}
                      onChange={(event) => setJoinMessage(event.target.value)}
                      placeholder="Apartment number, block, or any details that help the admin verify you."
                      rows={4}
                    />
                    <Button className="mt-4" onClick={handleJoinRequest}>Send join request</Button>
                  </Card>
                )}

                {selectedSummary.membershipStatus === 'pending' && (
                  <Card className="p-6 bg-amber-500/10 border-amber-500/30">
                    <h3 className="text-xl font-bold">Join request pending</h3>
                    <p className="text-sm text-muted-foreground mt-2">An admin has not approved your request yet. You can view summary information, but posting is locked until approval.</p>
                  </Card>
                )}

                {selectedSummary.membershipStatus === 'member' && (
                  <>
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiCarLine className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Create carpool</h3>
                        </div>
                        <div className="space-y-3">
                          <Input value={carpoolForm.from} onChange={(event) => setCarpoolForm((value) => ({ ...value, from: event.target.value }))} placeholder="Pickup location" />
                          <Input value={carpoolForm.to} onChange={(event) => setCarpoolForm((value) => ({ ...value, to: event.target.value }))} placeholder="Destination" />
                          <Input type="datetime-local" value={carpoolForm.departureTime} onChange={(event) => setCarpoolForm((value) => ({ ...value, departureTime: event.target.value }))} />
                          <Input type="number" min="1" max="8" value={carpoolForm.seats} onChange={(event) => setCarpoolForm((value) => ({ ...value, seats: event.target.value }))} placeholder="Seats" />
                          <Textarea value={carpoolForm.notes} onChange={(event) => setCarpoolForm((value) => ({ ...value, notes: event.target.value }))} placeholder="Notes for riders" rows={3} />
                          <Button onClick={handleCreateCarpool}>Post carpool</Button>
                        </div>
                      </Card>

                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiToolsLine className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Report society issue</h3>
                        </div>
                        <div className="space-y-3">
                          <Input value={issueForm.title} onChange={(event) => setIssueForm((value) => ({ ...value, title: event.target.value }))} placeholder="Issue title" />
                          <Input value={issueForm.category} onChange={(event) => setIssueForm((value) => ({ ...value, category: event.target.value }))} placeholder="Category, e.g. lift, water, security" />
                          <Textarea value={issueForm.description} onChange={(event) => setIssueForm((value) => ({ ...value, description: event.target.value }))} placeholder="Describe the issue" rows={4} />
                          <Button onClick={handleCreateIssue}>Submit issue</Button>
                        </div>
                      </Card>

                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiNotification3Line className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Post notice</h3>
                        </div>
                        <div className="space-y-3">
                          <Input value={noticeForm.title} onChange={(event) => setNoticeForm((value) => ({ ...value, title: event.target.value }))} placeholder="Notice title" />
                          <Textarea value={noticeForm.content} onChange={(event) => setNoticeForm((value) => ({ ...value, content: event.target.value }))} placeholder="Announcement or update" rows={4} />
                          <Button onClick={handleCreateNotice}>Post notice</Button>
                        </div>
                      </Card>

                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiChat3Line className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Community chat</h3>
                        </div>
                        <div className="space-y-3">
                          <Textarea value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Message your neighbors" rows={3} />
                          <Button onClick={handleSendMessage}>Send message</Button>
                        </div>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiNotification3Line className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Notice board</h3>
                        </div>
                        <div className="space-y-3">
                          {selectedSociety.notices.length === 0 && <p className="text-sm text-muted-foreground">No notices posted yet.</p>}
                          {selectedSociety.notices.map((notice) => (
                            <div key={notice.id} className="rounded-2xl border border-border p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">{notice.title}</p>
                                <span className="text-xs text-muted-foreground">{formatDateTime(notice.createdAt)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{notice.content}</p>
                              <p className="text-xs text-muted-foreground mt-3">Posted by {notice.postedByName}</p>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiCarLine className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Carpools</h3>
                        </div>
                        <div className="space-y-3">
                          {selectedSociety.carpools.length === 0 && <p className="text-sm text-muted-foreground">No carpools yet.</p>}
                          {selectedSociety.carpools.map((carpool) => (
                            <div key={carpool.id} className="rounded-2xl border border-border p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">{carpool.from} to {carpool.to}</p>
                                <span className="text-xs rounded-full px-2 py-1 bg-muted">{carpool.status}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                <p>Host: {carpool.userName}</p>
                                <p>Departure: {formatDateTime(carpool.departureTime)}</p>
                                <p>Seats: {carpool.seats}</p>
                                {carpool.notes && <p>{carpool.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiToolsLine className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Society issues</h3>
                        </div>
                        <div className="space-y-3">
                          {selectedSociety.issues.length === 0 && <p className="text-sm text-muted-foreground">No internal issues reported.</p>}
                          {selectedSociety.issues.map((issue) => (
                            <div key={issue.id} className="rounded-2xl border border-border p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{issue.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{issue.category} by {issue.createdByName}</p>
                                </div>
                                <span className="text-xs rounded-full px-2 py-1 bg-muted">{issue.status}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-3">{issue.description}</p>
                              {issue.resolutionNote && <p className="text-sm mt-3">Resolution: {issue.resolutionNote}</p>}
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-6 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <RiChat3Line className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">Recent chat</h3>
                        </div>
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                          {selectedSociety.chatMessages.length === 0 && <p className="text-sm text-muted-foreground">No chat messages yet.</p>}
                          {selectedSociety.chatMessages.map((message) => (
                            <div key={message.id} className="rounded-2xl border border-border p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">{message.userName}</p>
                                <span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{message.message}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </>
                )}

                <Card className="p-6 bg-card/60 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <RiCalendarEventLine className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">Member directory</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {selectedSociety.members.map((member) => (
                      <div key={member.userId} className="rounded-2xl border border-border p-4">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{member.email}</p>
                        <p className="text-xs text-muted-foreground mt-3 uppercase">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {isRefreshingDetails && (
                  <p className="text-sm text-muted-foreground">Refreshing society data...</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
