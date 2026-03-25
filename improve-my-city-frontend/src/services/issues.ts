import { callApi } from "@/services/api"

export interface CreateIssueData {
    title: string
    description: string
    category: string
    uploadUrls: string[]
    priority: 'low' | 'medium' | 'high'
    location: {
        latitude: number
        longitude: number
        address: string
    }
}

export interface Issue {
    id: string
    title: string
    description: string
    category: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    userId: string
    location: {
        latitude: number
        longitude: number
        address: string
    }
    uploadUrls: string[]
    distance?: number
    createdAt: number
    updatedAt: number
}

export interface Comment {
    id: string
    issueId: string
    userId: string
    userName?: string
    comment: string
    uploadUrls: string[]
    isAdmin: boolean
    createdAt: number
}

export interface IssueFilters {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed'
    category?: string
    userId?: string
    latitude?: number
    longitude?: number
    radiusKm?: number
    page?: number
    limit?: number
}

// Upload images for an issue
export const uploadIssueImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData()
    files.forEach(file => {
        formData.append('images', file)
    })

    const response = await callApi(
        '/issues/upload',
        {
            method: 'POST',
            body: formData
        },
        { noContentType: true, stringify: false }
    ) as { uploadUrls: string[] }

    // Convert relative URLs to absolute URLs
    const API_URL = (await import('@/config')).API_URL;
    return response.uploadUrls.map(url => {
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    });
}

// Create a new issue
export const createIssue = async (issueData: CreateIssueData): Promise<Issue> => {
    const response = await callApi('/issues', {
        method: 'POST',
        body: issueData
    })
    return response as Issue
}

// Get all issues with optional filters
export const getIssues = async (filters?: IssueFilters): Promise<{ 
    count: number; 
    issues: Issue[];
    page?: number;
    totalPages?: number;
}> => {
    const queryParams = new URLSearchParams()
    
    if (filters?.status) queryParams.append('status', filters.status)
    if (filters?.category) queryParams.append('category', filters.category)
    if (filters?.userId) queryParams.append('userId', filters.userId)
    if (filters?.latitude !== undefined) queryParams.append('latitude', filters.latitude.toString())
    if (filters?.longitude !== undefined) queryParams.append('longitude', filters.longitude.toString())
    if (filters?.radiusKm !== undefined) queryParams.append('radiusKm', filters.radiusKm.toString())
    if (filters?.page !== undefined) queryParams.append('page', filters.page.toString())
    if (filters?.limit !== undefined) queryParams.append('limit', filters.limit.toString())
    
    const queryString = queryParams.toString()
    const endpoint = queryString ? `/issues?${queryString}` : '/issues'
    
    const response = await callApi(endpoint, {
        method: 'GET'
    })
    return response as { count: number; issues: Issue[]; page?: number; totalPages?: number }
}

// Add a comment to an issue
export const addComment = async (issueId: string, comment: string, uploadUrls: string[] = []): Promise<Comment> => {
    const response = await callApi('/issues/comment', {
        method: 'POST',
        body: {
            issueId,
            comment,
            uploadUrls
        }
    })
    return response as Comment
}

// Get comments for an issue
export const getIssueComments = async (issueId: string): Promise<{ count: number; comments: Comment[] }> => {
    const response = await callApi(`/issues/${issueId}/comments`, {
        method: 'GET'
    })
    return response as { count: number; comments: Comment[] }
}

// Admin: Update issue status
export const updateIssueStatus = async (
    issueId: string, 
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    resolutionMessage?: string,
    resolutionUploadUrls?: string[]
): Promise<{ id: string; title: string; status: string; updatedAt: number }> => {
    const response = await callApi(`/issues/${issueId}/status`, {
        method: 'PUT',
        body: { 
            status,
            resolutionMessage,
            resolutionUploadUrls
        }
    })
    return response as { id: string; title: string; status: string; updatedAt: number }
}

// Admin: Delete an issue
export const deleteIssue = async (issueId: string): Promise<{ message: string }> => {
    const response = await callApi(`/issues/${issueId}`, {
        method: 'DELETE'
    })
    return response as { message: string }
}

// Upvote an issue
export const upvoteIssue = async (issueId: string): Promise<{ id: string; upvotes: number; upvotedBy: string[] }> => {
    const response = await callApi(`/issues/${issueId}/upvote`, {
        method: 'POST'
    })
    return response as { id: string; upvotes: number; upvotedBy: string[] }
}
