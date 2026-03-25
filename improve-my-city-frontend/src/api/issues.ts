import type { Issue, IssueStatus, IssueCategory, Comment } from '../types';
import * as issuesService from '../services/issues';

class IssuesAPI {
  async getAllIssues(page?: number, limit?: number): Promise<Issue[]> {
    const response = await issuesService.getIssues({ page, limit });
    return response.issues.map(this.normalizeIssue);
  }

  async getIssueById(id: string): Promise<Issue | null> {
    try {
      const response = await issuesService.getIssues();
      const issue = response.issues.find(i => i.id === id);
      return issue ? this.normalizeIssue(issue) : null;
    } catch {
      return null;
    }
  }

  async getIssuesByUser(userId: string): Promise<Issue[]> {
    const response = await issuesService.getIssues({ userId });
    return response.issues.map(this.normalizeIssue);
  }

  async getResolvedIssues(): Promise<Issue[]> {
    const response = await issuesService.getIssues({ status: 'resolved' });
    return response.issues.map(this.normalizeIssue);
  }

  async createIssue(
    title: string,
    description: string,
    category: IssueCategory,
    priority: 'low' | 'medium' | 'high',
    location: { address: string; latitude: number; longitude: number },
    photos: string[],
    _userId: string,
    userName: string
  ): Promise<Issue> {
    const issue = await issuesService.createIssue({
      title,
      description,
      category,
      priority,
      uploadUrls: photos,
      location
    });

    return this.normalizeIssue({
      ...issue,
      priority,
      reportedByName: userName
    });
  }

  async uploadPhoto(file: File): Promise<string> {
    const urls = await issuesService.uploadIssueImages([file]);
    return urls[0];
  }

  async uploadIssueImages(files: File[]): Promise<string[]> {
    return await issuesService.uploadIssueImages(files);
  }

  async updateIssueStatus(issueId: string, status: IssueStatus, resolutionMessage?: string, resolutionUploadUrls?: string[]): Promise<Issue> {
    await issuesService.updateIssueStatus(issueId, status, resolutionMessage, resolutionUploadUrls);
    const issue = await this.getIssueById(issueId);
    if (!issue) throw new Error('Issue not found');
    return issue;
  }

  async upvoteIssue(issueId: string, _userId: string): Promise<Issue> {
    await issuesService.upvoteIssue(issueId);
    const issue = await this.getIssueById(issueId);
    if (!issue) throw new Error('Issue not found');
    return issue;
  }

  async addComment(issueId: string, _userId: string, userName: string, text: string): Promise<Comment> {
    const comment = await issuesService.addComment(issueId, text, []);
    return {
      id: comment.id,
      issueId: comment.issueId,
      userId: comment.userId,
      userName,
      text,
      createdAt: typeof comment.createdAt === 'number'
        ? new Date(comment.createdAt).toISOString()
        : String(comment.createdAt)
    };
  }

  async deleteIssue(issueId: string, _userId: string): Promise<void> {
    await issuesService.deleteIssue(issueId);
  }

  async getIssueStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    const response = await issuesService.getIssues();
    const issues = response.issues;

    return {
      total: issues.length,
      pending: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length,
    };
  }

  async getFilteredIssues(
    category?: IssueCategory | 'All',
    location?: { latitude: number; longitude: number } | null,
    page?: number,
    limit?: number
  ): Promise<{ issues: Issue[]; total: number; page: number; totalPages: number }> {
    const filters: any = { page, limit };

    if (category && category !== 'All') {
      filters.category = category;
    }

    if (location) {
      filters.latitude = location.latitude;
      filters.longitude = location.longitude;
      filters.radiusKm = 100;
    }

    const response = await issuesService.getIssues(filters);
    return {
      issues: response.issues.map(this.normalizeIssue),
      total: response.count,
      page: response.page || 1,
      totalPages: response.totalPages || 1
    };
  }

  async geocodeLocation(query: string): Promise<{ latitude: number; longitude: number } | null> {
    // Mock geocoding - in production, integrate with a geocoding API
    if (!query.trim()) return null;

    const mockCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
      'downtown': { latitude: 40.7128, longitude: -74.0060 },
      'uptown': { latitude: 40.7829, longitude: -73.9654 },
      'brooklyn': { latitude: 40.6782, longitude: -73.9442 },
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, coords] of Object.entries(mockCoordinates)) {
      if (lowerQuery.includes(key)) {
        return coords;
      }
    }

    return {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.2,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.2,
    };
  }

  // Helper to normalize issue format between backend and frontend
  private normalizeIssue = (issue: any): Issue => {
    const createdAt = typeof issue.createdAt === 'number'
      ? new Date(issue.createdAt).toISOString()
      : issue.createdAt;

    const updatedAt = typeof issue.updatedAt === 'number'
      ? new Date(issue.updatedAt).toISOString()
      : issue.updatedAt;

    return {
      id: issue.id || issue._id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      priority: issue.priority || 'medium',
      location: issue.location,
      photos: issue.uploadUrls || issue.photos || [],
      uploadUrls: issue.uploadUrls || issue.photos || [],
      reportedBy: issue.userId || issue.reportedBy,
      userId: issue.userId,
      reportedByName: issue.reportedByName || 'User',
      createdAt,
      updatedAt,
      resolvedAt: issue.resolvedAt,
      upvotes: issue.upvotes || 0,
      upvotedBy: issue.upvotedBy || [],
      comments: issue.comments || [],
      assignedTo: issue.assignedTo,
      distance: issue.distance
    };
  }
}

export const issuesAPI = new IssuesAPI();

