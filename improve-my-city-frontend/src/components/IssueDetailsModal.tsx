import { useState, useEffect } from 'react';
import type { Issue, Comment } from '../types';
import { StatusBadge, PriorityBadge } from './Badge';
import { Button } from '@/components/ui/button';
import { Modal } from './Modal';
import { useAuth } from '../providers/AuthProvider';
import { issuesAPI } from '../api/issues';
import { RiLoader4Line, RiCameraLine, RiCloseLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import * as issuesService from '../services/issues';
import { Input } from './ui/input';

interface IssueDetailsModalProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedIssue?: Issue) => void;
}

export function IssueDetailsModal({ issue, isOpen, onClose, onUpdate }: IssueDetailsModalProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [localIssue, setLocalIssue] = useState<Issue>(issue);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, issue.id]);

  // Update local issue when prop changes
  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const result = await issuesService.getIssueComments(issue.id);
      setComments(result.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    setCommentFiles((prev) => [...prev, ...filesArray]);

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCommentImage = (index: number) => {
    setCommentImages((prev) => prev.filter((_, i) => i !== index));
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComment = async () => {
    if (!user || !comment.trim()) return;
    setIsCommenting(true);
    
    try {
      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (commentFiles.length > 0) {
        uploadedImageUrls = await issuesAPI.uploadIssueImages(commentFiles);
      }

      const newComment = await issuesService.addComment(issue.id, comment, uploadedImageUrls);
      
      // Add user name to the comment
      const commentWithUserName: Comment = {
        ...newComment,
        userName: user.name
      };
      
      // Optimistic update
      setComments((prev) => [...prev, commentWithUserName]);
      
      setComment('');
      setCommentImages([]);
      setCommentFiles([]);
      toast.success('Comment added successfully');
      
      // Notify parent to update comment count
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error(`Failed to add comment: ${error instanceof Error ? error.message : ''}`);
    } finally {
      setIsCommenting(false);
    }
  };

  const formatDate = (dateString: string | number) => {
    const date = typeof dateString === 'number' 
      ? new Date(dateString) 
      : new Date(dateString);
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Find the resolution comment (if any)
  const resolutionComment = comments.find((c) => c.isAdmin && localIssue.status === 'resolved');
  const otherComments = comments.filter((c) => !(c.isAdmin && localIssue.status === 'resolved'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={localIssue.title} size="lg">
      <div className="space-y-6">
        {localIssue.photos && localIssue.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {localIssue.photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`${localIssue.title} ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <StatusBadge status={localIssue.status} />
          <PriorityBadge priority={localIssue.priority || 'medium'} />
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {localIssue.category}
          </span>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Description</h4>
          <p className="text-muted-foreground">{localIssue.description}</p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Location</h4>
          <p className="text-muted-foreground flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {localIssue.location.address}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Reporter</h4>
          <p className="text-muted-foreground">{localIssue.reportedByName || 'User'}</p>
          <p className="text-sm text-muted-foreground/70">
            Reported on {new Date(localIssue.createdAt).toLocaleDateString()}
          </p>
        </div>

        {localIssue.assignedTo && (
          <div>
            <h4 className="font-semibold text-foreground mb-2">Assigned To</h4>
            <p className="text-muted-foreground">{localIssue.assignedTo}</p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-foreground mb-3">
            Comments ({comments.length})
          </h4>

          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {isLoadingComments ? (
              <div className="text-center py-8">
                <RiLoader4Line className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <>
                {/* Resolution comment at top if resolved */}
                {resolutionComment && (
                  <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{resolutionComment.userName || 'Admin'}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-600/20 text-green-700 dark:text-green-400">
                          Resolution
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(resolutionComment.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {resolutionComment.text || resolutionComment.comment}
                    </p>
                    {resolutionComment.uploadUrls && resolutionComment.uploadUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {resolutionComment.uploadUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Resolution image ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Other comments */}
                {otherComments.map((c) => (
                  <div key={c.id} className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.userName || 'User'}</span>
                        {c.isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{c.text || c.comment}</p>
                    {c.uploadUrls && c.uploadUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {c.uploadUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Comment image ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No comments yet</p>
                )}
              </>
            )}
          </div>

          {user && (
            <div className="space-y-3">
              {commentImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {commentImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeCommentImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <RiCloseLine className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCommentImageUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="icon" asChild>
                    <span>
                      <RiCameraLine className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                <Button onClick={handleComment} disabled={!comment.trim() || isCommenting}>
                  {isCommenting ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
