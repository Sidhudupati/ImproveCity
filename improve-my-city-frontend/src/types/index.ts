export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type IssueCategory = 
  | 'Pothole'
  | 'Garbage'
  | 'Streetlight'
  | 'Water Supply'
  | 'Drainage'
  | 'Road Damage'
  | 'Parks'
  | 'Other';


export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory | string;
  status: IssueStatus;
  priority?: 'low' | 'medium' | 'high';
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  photos?: string[]; // For backwards compatibility
  uploadUrls: string[];
  reportedBy?: string; // For backwards compatibility (use userId)
  userId: string;
  reportedByName?: string;
  createdAt: string | number;
  updatedAt: string | number;
  resolvedAt?: string;
  upvotes?: number;
  upvotedBy?: string[];
  comments?: Comment[];
  assignedTo?: string;
  distance?: number;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName?: string;
  text?: string; // For backwards compatibility
  comment?: string;
  uploadUrls?: string[];
  isAdmin?: boolean;
  createdAt: string | number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  inProgressIssues: number;
  totalUpvotes: number;
  score: number;
  rank?: number;
  badges: string[];
  avatar: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalUsers: number;
}
