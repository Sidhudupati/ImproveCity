import {
    addMemberController,
    createCarpoolController,
    createChatMessageController,
    createNoticeController,
    createSocietyIssueController,
    getSocietiesController,
    getSocietyDetailsController,
    removeMemberController,
    requestJoinController,
    reviewJoinRequestController,
    updateSocietyIssueController
} from '@/controllers/community'
import { verifyAdmin } from '@/middlewares/verifyAdmin'
import { verifyUser } from '@/middlewares/verifyUser'
import { Route } from '@/types/helpers'
import { bindRoutes, output } from '@/utils/helpers'
import { Router } from 'express'

const wrap = (handler: Route['outputHandler']): Route['outputHandler'] => async (req) => output(true, '', await handler(req))

const routes: Route[] = [
    { method: 'get', path: '/societies', middleware: [verifyUser], outputHandler: wrap(getSocietiesController) },
    { method: 'get', path: '/societies/:id', middleware: [verifyUser], outputHandler: wrap(getSocietyDetailsController) },
    { method: 'post', path: '/societies/:id/join-requests', middleware: [verifyUser], outputHandler: wrap(requestJoinController) },
    { method: 'post', path: '/societies/:id/carpools', middleware: [verifyUser], outputHandler: wrap(createCarpoolController) },
    { method: 'post', path: '/societies/:id/issues', middleware: [verifyUser], outputHandler: wrap(createSocietyIssueController) },
    { method: 'post', path: '/societies/:id/notices', middleware: [verifyUser], outputHandler: wrap(createNoticeController) },
    { method: 'post', path: '/societies/:id/chat', middleware: [verifyUser], outputHandler: wrap(createChatMessageController) },
    { method: 'patch', path: '/societies/:id/join-requests/:requestId', middleware: [verifyUser, verifyAdmin], outputHandler: wrap(reviewJoinRequestController) },
    { method: 'post', path: '/societies/:id/members', middleware: [verifyUser, verifyAdmin], outputHandler: wrap(addMemberController) },
    { method: 'delete', path: '/societies/:id/members/:memberUserId', middleware: [verifyUser, verifyAdmin], outputHandler: wrap(removeMemberController) },
    { method: 'patch', path: '/societies/:id/issues/:issueId', middleware: [verifyUser, verifyAdmin], outputHandler: wrap(updateSocietyIssueController) }
]

const communityRoutes = Router()
bindRoutes(communityRoutes, routes)

export default communityRoutes
