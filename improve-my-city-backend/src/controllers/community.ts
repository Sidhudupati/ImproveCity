import { Request } from '@/types/helpers'
import {
    addMemberByEmail,
    createCarpool,
    createChatMessage,
    createNotice,
    createSocietyIssue,
    getSocietyDetails,
    listSocieties,
    removeMember,
    requestToJoinSociety,
    reviewJoinRequest,
    updateSocietyIssueStatus
} from '@/services/community'
import { z } from 'zod'

const joinRequestSchema = z.object({
    message: z.string().max(240).optional()
})

const carpoolSchema = z.object({
    from: z.string().min(2),
    to: z.string().min(2),
    departureTime: z.coerce.number(),
    seats: z.coerce.number().int().min(1).max(8),
    notes: z.string().max(280).optional()
})

const societyIssueSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string().min(2)
})

const noticeSchema = z.object({
    title: z.string().min(3),
    content: z.string().min(10)
})

const chatSchema = z.object({
    message: z.string().min(1).max(500)
})

const reviewRequestSchema = z.object({
    action: z.enum(['approve', 'reject'])
})

const addMemberSchema = z.object({
    email: z.string().email()
})

const updateIssueSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved']),
    resolutionNote: z.string().max(500).optional()
})

export const getSocietiesController = async (req: Request) => {
    return listSocieties(req.user.userId)
}

export const getSocietyDetailsController = async (req: Request) => {
    return getSocietyDetails(req.params.id, req.user.userId, req.user.isAdmin)
}

export const requestJoinController = async (req: Request) => {
    const body = joinRequestSchema.parse(req.body)
    return requestToJoinSociety(req.params.id, req.user.userId, body.message)
}

export const createCarpoolController = async (req: Request) => {
    const body = carpoolSchema.parse(req.body)
    return createCarpool(req.params.id, req.user.userId, body)
}

export const createSocietyIssueController = async (req: Request) => {
    const body = societyIssueSchema.parse(req.body)
    return createSocietyIssue(req.params.id, req.user.userId, body)
}

export const createNoticeController = async (req: Request) => {
    const body = noticeSchema.parse(req.body)
    return createNotice(req.params.id, req.user.userId, body)
}

export const createChatMessageController = async (req: Request) => {
    const body = chatSchema.parse(req.body)
    return createChatMessage(req.params.id, req.user.userId, body.message)
}

export const reviewJoinRequestController = async (req: Request) => {
    const body = reviewRequestSchema.parse(req.body)
    return reviewJoinRequest(req.params.id, req.params.requestId, body.action)
}

export const addMemberController = async (req: Request) => {
    const body = addMemberSchema.parse(req.body)
    return addMemberByEmail(req.params.id, body.email)
}

export const removeMemberController = async (req: Request) => {
    await removeMember(req.params.id, req.params.memberUserId)
    return { removed: true }
}

export const updateSocietyIssueController = async (req: Request) => {
    const body = updateIssueSchema.parse(req.body)
    return updateSocietyIssueStatus(req.params.id, req.params.issueId, body.status, body.resolutionNote)
}
