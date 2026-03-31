export type MembershipStatus = 'member' | 'pending' | 'none'
export type SocietyIssueStatus = 'open' | 'in_progress' | 'resolved'

export interface SocietyMember {
  userId: string
  name: string
  email: string
  role: 'admin' | 'member'
  joinedAt: number
}

export interface JoinRequest {
  id: string
  userId: string
  name: string
  email: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  reviewedAt?: number
}

export interface SocietyCarpool {
  id: string
  userId: string
  userName: string
  from: string
  to: string
  departureTime: number
  seats: number
  notes?: string
  status: 'open' | 'full' | 'closed'
  createdAt: number
}

export interface SocietyIssue {
  id: string
  title: string
  description: string
  category: string
  status: SocietyIssueStatus
  createdByUserId: string
  createdByName: string
  createdAt: number
  resolvedAt?: number
  resolutionNote?: string
}

export interface SocietyNotice {
  id: string
  title: string
  content: string
  postedByUserId: string
  postedByName: string
  createdAt: number
}

export interface SocietyChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: number
}

export interface SocietySummary {
  id: string
  name: string
  code: string
  description: string
  address: string
  membershipStatus: MembershipStatus
  memberCount: number
  pendingRequestCount: number
  openIssueCount: number
  latestNotices: SocietyNotice[]
  latestCarpools: SocietyCarpool[]
}

export interface SocietyDetails extends Omit<SocietySummary, 'memberCount' | 'pendingRequestCount' | 'openIssueCount' | 'latestNotices' | 'latestCarpools'> {
  members: SocietyMember[]
  joinRequests: JoinRequest[]
  notices: SocietyNotice[]
  carpools: SocietyCarpool[]
  issues: SocietyIssue[]
  chatMessages: SocietyChatMessage[]
}
