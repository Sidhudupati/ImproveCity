import { HydratedDocument, Types } from 'mongoose'
import societyModel from '@/models/society'
import { getUser, getUserByEmail } from '@/services/user'
import { Society, SocietyMember, SocietyIssueStatus } from '@/types/community'
import { ApiError, NotFoundError, ValidationError } from '@/utils/errors'
import userModel from '@/models/user'

const defaultSocieties = [
    {
        name: 'Green Meadows Society',
        code: 'GREEN-MEADOWS',
        description: 'A family-focused residential society for day-to-day coordination, notices, and issue reporting.',
        address: 'Sector 14, Central Avenue'
    },
    {
        name: 'Lakeview Towers',
        code: 'LAKEVIEW',
        description: 'A high-rise community hub for residents to manage transport, support tickets, and announcements.',
        address: 'Lake Road, Block B'
    }
]

const createId = () => new Types.ObjectId().toString()
type SocietyDocument = HydratedDocument<Society>

const sortByCreatedDesc = <T extends { createdAt: number }>(items: T[]) =>
    [...items].sort((a, b) => b.createdAt - a.createdAt)

const touchSociety = (society: SocietyDocument) => {
    society.updatedAt = Date.now()
}

const getSocietyOrThrow = async (societyId: string): Promise<SocietyDocument> => {
    const society = await societyModel.findById(societyId)
    if (!society) {
        throw new NotFoundError('Society not found')
    }
    return society
}

const ensureMember = (society: SocietyDocument, userId: string) => {
    const member = society.members.find((entry) => entry.userId === userId)
    if (!member) {
        throw new ApiError('You must be a society member to access this section.', 403)
    }
    return member
}

export const ensureDefaultSocieties = async (): Promise<void> => {
    const admins = await userModel.find({ isAdmin: true }).lean()

    for (const seed of defaultSocieties) {
        const existing = await societyModel.findOne({ code: seed.code })
        const adminMembers: SocietyMember[] = admins.map((admin) => ({
            userId: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: 'admin',
            joinedAt: Date.now()
        }))

        if (!existing) {
            await societyModel.create({
                ...seed,
                members: adminMembers,
                joinRequests: [],
                carpools: [],
                issues: [],
                notices: [],
                chatMessages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            })
            continue
        }

        let changed = false
        for (const adminMember of adminMembers) {
            if (!existing.members.some((member) => member.userId === adminMember.userId)) {
                existing.members.push(adminMember)
                changed = true
            }
        }
        if (changed) {
            existing.updatedAt = Date.now()
            await existing.save()
        }
    }
}

export const listSocieties = async (userId: string) => {
    const societies = await societyModel.find().lean()
    return societies.map((society) => {
        const membership = society.members.find((member) => member.userId === userId)
        const pendingRequest = society.joinRequests.find((request) => request.userId === userId && request.status === 'pending')

        return {
            id: society._id?.toString(),
            name: society.name,
            code: society.code,
            description: society.description,
            address: society.address,
            membershipStatus: membership ? 'member' : pendingRequest ? 'pending' : 'none',
            memberCount: society.members.length,
            pendingRequestCount: society.joinRequests.filter((request) => request.status === 'pending').length,
            openIssueCount: society.issues.filter((issue) => issue.status !== 'resolved').length,
            latestNotices: sortByCreatedDesc(society.notices).slice(0, 3),
            latestCarpools: sortByCreatedDesc(society.carpools).slice(0, 3)
        }
    })
}

export const getSocietyDetails = async (societyId: string, userId: string, isAdmin: boolean) => {
    const society = await getSocietyOrThrow(societyId)
    const isMember = society.members.some((member) => member.userId === userId)
    const pendingJoinRequest = society.joinRequests.find((request) => request.userId === userId && request.status === 'pending')

    return {
        id: society._id?.toString(),
        name: society.name,
        code: society.code,
        description: society.description,
        address: society.address,
        membershipStatus: isMember ? 'member' : pendingJoinRequest ? 'pending' : 'none',
        members: society.members,
        joinRequests: isAdmin ? sortByCreatedDesc(society.joinRequests) : [],
        carpools: sortByCreatedDesc(society.carpools),
        issues: sortByCreatedDesc(society.issues),
        notices: sortByCreatedDesc(society.notices),
        chatMessages: sortByCreatedDesc(society.chatMessages).slice(0, 50)
    }
}

export const requestToJoinSociety = async (societyId: string, userId: string, message?: string) => {
    const society = await getSocietyOrThrow(societyId)
    const user = await getUser(userId)

    if (society.members.some((member) => member.userId === userId)) {
        throw new ValidationError('You are already a member of this society.')
    }

    const existingPending = society.joinRequests.find((request) => request.userId === userId && request.status === 'pending')
    if (existingPending) {
        throw new ValidationError('A join request is already pending for this society.')
    }

    society.joinRequests.push({
        id: createId(),
        userId,
        name: user.name,
        email: user.email,
        message,
        status: 'pending',
        createdAt: Date.now()
    })
    touchSociety(society)
    await society.save()

    return society.joinRequests[society.joinRequests.length - 1]
}

export const reviewJoinRequest = async (societyId: string, requestId: string, action: 'approve' | 'reject') => {
    const society = await getSocietyOrThrow(societyId)
    const request = society.joinRequests.find((entry) => entry.id === requestId)
    if (!request) {
        throw new NotFoundError('Join request not found')
    }
    if (request.status !== 'pending') {
        throw new ValidationError('This join request has already been processed.')
    }

    request.status = action === 'approve' ? 'approved' : 'rejected'
    request.reviewedAt = Date.now()

    if (action === 'approve' && !society.members.some((member) => member.userId === request.userId)) {
        society.members.push({
            userId: request.userId,
            name: request.name,
            email: request.email,
            role: 'member',
            joinedAt: Date.now()
        })
    }

    touchSociety(society)
    await society.save()
    return request
}

export const addMemberByEmail = async (societyId: string, email: string) => {
    const user = await getUserByEmail(email)
    if (!user) {
        throw new NotFoundError('No registered user found for that email address.')
    }

    const society = await getSocietyOrThrow(societyId)
    if (society.members.some((member) => member.userId === user._id?.toString())) {
        throw new ValidationError('User is already a member of this society.')
    }

    society.members.push({
        userId: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.isAdmin ? 'admin' : 'member',
        joinedAt: Date.now()
    })
    touchSociety(society)
    await society.save()

    return society.members[society.members.length - 1]
}

export const removeMember = async (societyId: string, memberUserId: string) => {
    const society = await getSocietyOrThrow(societyId)
    const existingMember = society.members.find((member) => member.userId === memberUserId)
    if (!existingMember) {
        throw new NotFoundError('Member not found in this society')
    }

    society.members = society.members.filter((member) => member.userId !== memberUserId)
    touchSociety(society)
    await society.save()
}

export const createCarpool = async (
    societyId: string,
    userId: string,
    input: { from: string; to: string; departureTime: number; seats: number; notes?: string }
) => {
    const society = await getSocietyOrThrow(societyId)
    const member = ensureMember(society, userId)

    society.carpools.push({
        id: createId(),
        userId,
        userName: member.name,
        from: input.from,
        to: input.to,
        departureTime: input.departureTime,
        seats: input.seats,
        notes: input.notes,
        status: 'open',
        createdAt: Date.now()
    })
    touchSociety(society)
    await society.save()

    return society.carpools[society.carpools.length - 1]
}

export const createSocietyIssue = async (
    societyId: string,
    userId: string,
    input: { title: string; description: string; category: string }
) => {
    const society = await getSocietyOrThrow(societyId)
    const member = ensureMember(society, userId)

    society.issues.push({
        id: createId(),
        title: input.title,
        description: input.description,
        category: input.category,
        status: 'open',
        createdByUserId: userId,
        createdByName: member.name,
        createdAt: Date.now()
    })
    touchSociety(society)
    await society.save()

    return society.issues[society.issues.length - 1]
}

export const updateSocietyIssueStatus = async (
    societyId: string,
    issueId: string,
    status: SocietyIssueStatus,
    resolutionNote?: string
) => {
    const society = await getSocietyOrThrow(societyId)
    const issue = society.issues.find((entry) => entry.id === issueId)
    if (!issue) {
        throw new NotFoundError('Society issue not found')
    }

    issue.status = status
    issue.resolutionNote = resolutionNote
    issue.resolvedAt = status === 'resolved' ? Date.now() : undefined
    touchSociety(society)
    await society.save()

    return issue
}

export const createNotice = async (
    societyId: string,
    userId: string,
    input: { title: string; content: string }
) => {
    const society = await getSocietyOrThrow(societyId)
    const member = ensureMember(society, userId)

    society.notices.push({
        id: createId(),
        title: input.title,
        content: input.content,
        postedByUserId: userId,
        postedByName: member.name,
        createdAt: Date.now()
    })
    touchSociety(society)
    await society.save()

    return society.notices[society.notices.length - 1]
}

export const createChatMessage = async (societyId: string, userId: string, message: string) => {
    const society = await getSocietyOrThrow(societyId)
    const member = ensureMember(society, userId)

    society.chatMessages.push({
        id: createId(),
        userId,
        userName: member.name,
        message,
        createdAt: Date.now()
    })

    society.chatMessages = sortByCreatedDesc(society.chatMessages).slice(0, 100)
    touchSociety(society)
    await society.save()

    return society.chatMessages[0]
}
