export type SocietyMemberRole = 'admin' | 'member'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'
export type CarpoolStatus = 'open' | 'full' | 'closed'
export type SocietyIssueStatus = 'open' | 'in_progress' | 'resolved'

export interface SocietyMember {
    userId: string
    name: string
    email: string
    role: SocietyMemberRole
    joinedAt: number
}

export interface JoinRequest {
    id: string
    userId: string
    name: string
    email: string
    message?: string
    status: JoinRequestStatus
    createdAt: number
    reviewedAt?: number
}

export interface Carpool {
    id: string
    userId: string
    userName: string
    from: string
    to: string
    departureTime: number
    seats: number
    notes?: string
    status: CarpoolStatus
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

export interface Notice {
    id: string
    title: string
    content: string
    postedByUserId: string
    postedByName: string
    createdAt: number
}

export interface ChatMessage {
    id: string
    userId: string
    userName: string
    message: string
    createdAt: number
}

export interface Society {
    _id?: string
    name: string
    code: string
    description: string
    address: string
    members: SocietyMember[]
    joinRequests: JoinRequest[]
    carpools: Carpool[]
    issues: SocietyIssue[]
    notices: Notice[]
    chatMessages: ChatMessage[]
    createdAt: number
    updatedAt: number
}
