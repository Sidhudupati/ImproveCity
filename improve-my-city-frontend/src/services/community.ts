import { callApi } from '@/services/api'
import type {
  SocietyDetails,
  SocietyMember,
  SocietySummary,
  SocietyIssue,
  JoinRequest,
  SocietyNotice,
  SocietyCarpool,
  SocietyChatMessage,
  SocietyIssueStatus
} from '@/types/community'

type WrappedResponse<T> = {
  success: boolean
  message: string
  data: T
}

const unwrap = async <T>(promise: Promise<WrappedResponse<T>>): Promise<T> => {
  const response = await promise
  return response.data
}

export const communityService = {
  listSocieties: async () =>
    unwrap(callApi<WrappedResponse<SocietySummary[]>>('/community/societies')),

  getSocietyDetails: async (societyId: string) =>
    unwrap(callApi<WrappedResponse<SocietyDetails>>(`/community/societies/${societyId}`)),

  requestJoin: async (societyId: string, message: string) =>
    unwrap(callApi<WrappedResponse<JoinRequest>>(`/community/societies/${societyId}/join-requests`, {
      method: 'POST',
      body: { message }
    })),

  createCarpool: async (societyId: string, payload: { from: string; to: string; departureTime: number; seats: number; notes?: string }) =>
    unwrap(callApi<WrappedResponse<SocietyCarpool>>(`/community/societies/${societyId}/carpools`, {
      method: 'POST',
      body: payload
    })),

  createIssue: async (societyId: string, payload: { title: string; description: string; category: string }) =>
    unwrap(callApi<WrappedResponse<SocietyIssue>>(`/community/societies/${societyId}/issues`, {
      method: 'POST',
      body: payload
    })),

  createNotice: async (societyId: string, payload: { title: string; content: string }) =>
    unwrap(callApi<WrappedResponse<SocietyNotice>>(`/community/societies/${societyId}/notices`, {
      method: 'POST',
      body: payload
    })),

  createChatMessage: async (societyId: string, message: string) =>
    unwrap(callApi<WrappedResponse<SocietyChatMessage>>(`/community/societies/${societyId}/chat`, {
      method: 'POST',
      body: { message }
    })),

  reviewJoinRequest: async (societyId: string, requestId: string, action: 'approve' | 'reject') =>
    unwrap(callApi<WrappedResponse<JoinRequest>>(`/community/societies/${societyId}/join-requests/${requestId}`, {
      method: 'PATCH',
      body: { action }
    })),

  addMember: async (societyId: string, email: string) =>
    unwrap(callApi<WrappedResponse<SocietyMember>>(`/community/societies/${societyId}/members`, {
      method: 'POST',
      body: { email }
    })),

  removeMember: async (societyId: string, memberUserId: string) =>
    unwrap(callApi<WrappedResponse<{ removed: boolean }>>(`/community/societies/${societyId}/members/${memberUserId}`, {
      method: 'DELETE'
    })),

  updateIssueStatus: async (societyId: string, issueId: string, status: SocietyIssueStatus, resolutionNote?: string) =>
    unwrap(callApi<WrappedResponse<SocietyIssue>>(`/community/societies/${societyId}/issues/${issueId}`, {
      method: 'PATCH',
      body: { status, resolutionNote }
    })),
}
