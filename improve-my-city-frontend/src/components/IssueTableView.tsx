import { useState } from 'react';
import type { Issue } from '../types';
import { StatusBadge, PriorityBadge } from './Badge';
import { Button } from '@/components/ui/button';
import { IssueDetailsModal } from './IssueDetailsModal';
import { useAuth } from '../providers/AuthProvider';
import { issuesAPI } from '../api/issues';
import { RiLoader4Line } from 'react-icons/ri';
import toast from 'react-hot-toast';

interface IssueTableViewProps {
  issues: Issue[];
  onUpdate?: (updatedIssue?: Issue) => void;
}

export function IssueTableView({ issues, onUpdate }: IssueTableViewProps) {
  const { user } = useAuth();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isUpvoting, setIsUpvoting] = useState<string | null>(null);

  const handleUpvote = async (issue: Issue) => {
    if (!user) return;
    setIsUpvoting(issue.id);

    // Optimistic update
    const wasUpvoted = (issue.upvotedBy || []).includes(user.id);
    const updatedIssue = {
      ...issue,
      upvotes: wasUpvoted ? (issue.upvotes || 1) - 1 : (issue.upvotes || 0) + 1,
      upvotedBy: wasUpvoted
        ? (issue.upvotedBy || []).filter(id => id !== user.id)
        : [...(issue.upvotedBy || []), user.id]
    };

    try {
      await issuesAPI.upvoteIssue(issue.id, user.id);
      toast.success(wasUpvoted ? 'Upvote removed' : 'Issue upvoted!');
      onUpdate?.(updatedIssue);
    } catch (error) {
      console.error('Failed to upvote:', error);
      toast.error(`Failed to upvote issue: ${error instanceof Error ? error.message : ''}`);
      // Revert on error
    } finally {
      setIsUpvoting(null);
    }
  };


  const formatDate = (dateString: string | number) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isUpvoted = (issue: Issue) => user ? (issue.upvotedBy || []).includes(user.id) : false;

  // If there are no issues, show an empty state and do not render the table header
  if (issues.length === 0) {
    return (
      <>
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">There are no issues</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your filters or check back later
              </p>
            </div>
          </div>
        </div>

        {selectedIssue && (
          <IssueDetailsModal
            issue={selectedIssue}
            isOpen={!!selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onUpdate={() => {
              setSelectedIssue(null);
              onUpdate?.();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Issue</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Category</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Priority</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Location</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Reporter</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Votes</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {issue.photos && issue.photos.length > 0 && (
                        <img
                          src={issue.photos[0]}
                          alt={issue.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground/90 line-clamp-1 group-hover:text-primary transition-colors">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {issue.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="p-4">
                    <PriorityBadge priority={issue.priority || 'medium'} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[200px]">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-1">{issue.location.address}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground/80">{issue.reportedByName}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-muted-foreground">{formatDate(issue.createdAt)}</span>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant={isUpvoted(issue) ? 'default' : 'ghost'}
                      onClick={() => handleUpvote(issue)}
                      disabled={!user || isUpvoting === issue.id}
                      className="min-w-[60px]"
                    >
                      {isUpvoting === issue.id ? (
                        <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 mr-1" fill={isUpvoted(issue) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {issue.upvotes}
                        </>
                      )}
                    </Button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIssue(issue)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => {
            setSelectedIssue(null);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
