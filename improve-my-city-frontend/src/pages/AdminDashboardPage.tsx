import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { issuesAPI } from '../api/issues';
import type { Issue, IssueStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { Preloader } from '../components/Preloader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RiShieldCheckLine, RiArrowUpDownLine, RiCameraLine, RiCloseLine, RiCheckboxCircleFill, RiTimeLine, RiAlertLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

type SortField = 'title' | 'createdAt' | 'upvotes' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [resolutionImages, setResolutionImages] = useState<string[]>([]);

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const data = await issuesAPI.getAllIssues();
      setIssues(data);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'createdAt') {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    } else if (sortField === 'priority') {
      const priorityOrder: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1 };
      aValue = priorityOrder[a.priority || 'medium'];
      bValue = priorityOrder[b.priority || 'medium'];
    } else if (sortField === 'status') {
      const statusOrder: Record<string, number> = { 'open': 1, 'in_progress': 2, 'resolved': 3, 'closed': 4 };
      aValue = statusOrder[a.status];
      bValue = statusOrder[b.status];
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleUpdateStatus = async (issueId: string, newStatus: IssueStatus) => {
    if (newStatus === 'resolved') {
      setShowResolveModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      await issuesAPI.updateIssueStatus(issueId, newStatus);
      await loadIssues();
      setSelectedIssue(null);
      toast.success('Issue status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update issue status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveWithDetails = async () => {
    if (!selectedIssue) return;

    setIsUpdating(true);
    try {
      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (resolutionImages.length > 0) {
        // Convert base64 images to files and upload
        const uploadPromises = resolutionImages.map(async (base64Image, index) => {
          const response = await fetch(base64Image);
          const blob = await response.blob();
          const file = new File([blob], `resolution-${index}.jpg`, { type: 'image/jpeg' });
          return await issuesAPI.uploadPhoto(file);
        });
        uploadedImageUrls = await Promise.all(uploadPromises);
      }

      await issuesAPI.updateIssueStatus(
        selectedIssue.id, 
        'resolved',
        resolutionMessage,
        uploadedImageUrls
      );
      await loadIssues();
      setSelectedIssue(null);
      setShowResolveModal(false);
      setResolutionMessage('');
      setResolutionImages([]);
      toast.success('Issue resolved successfully');
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      toast.error(`Failed to resolve issue: ${error instanceof Error ? error.message : ''}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setResolutionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    high: issues.filter((i) => i.priority === 'high').length,
  };

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        {/* Admin Header */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 mb-8 shadow-2xl bg-linear-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/30">
              <RiShieldCheckLine className="w-4 h-4" />
              <span className="text-sm font-medium">Administrator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="opacity-90 text-base sm:text-lg mb-8 max-w-2xl leading-relaxed">
              Manage and resolve civic issues reported by citizens. Keep track of all reports and maintain community trust.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl"></div>
        </div>

        {/* Compact Stats Strip */}
        <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.total}</p>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <RiTimeLine className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.pending}</p>
                <p className="text-xs text-muted-foreground font-medium">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <RiAlertLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <RiCheckboxCircleFill className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground font-medium">Resolved</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.high}</p>
                <p className="text-xs text-muted-foreground font-medium">High Priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Table */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold">All Issues</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage all reported civic issues</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Issue
                      <RiArrowUpDownLine className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Reporter</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Priority
                      <RiArrowUpDownLine className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Status
                      <RiArrowUpDownLine className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('upvotes')}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Upvotes
                      <RiArrowUpDownLine className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="max-w-xs">
                        <p className="font-semibold text-sm line-clamp-1">{issue.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{issue.location.address}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm">{issue.reportedByName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm px-2.5 py-1 rounded-full bg-primary/10 text-primary">{issue.category}</span>
                    </td>
                    <td className="p-4">
                      <PriorityBadge priority={issue.priority || 'medium'} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {issue.upvotes}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Management Modal */}
        {selectedIssue && (
          <Modal
            isOpen={!!selectedIssue}
            onClose={() => {
              setSelectedIssue(null);
              setShowResolveModal(false);
              setResolutionMessage('');
              setResolutionImages([]);
            }}
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedIssue.title}</h2>
                <div className="flex gap-2 flex-wrap mb-4">
                  <StatusBadge status={selectedIssue.status} />
                  <PriorityBadge priority={selectedIssue.priority || 'medium'} />
                </div>
              </div>

              {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img
                    src={selectedIssue.photos[0]}
                    alt={selectedIssue.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{selectedIssue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{selectedIssue.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="font-medium text-sm">{selectedIssue.location.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reported By</p>
                  <p className="font-medium">{selectedIssue.reportedByName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">
                    {new Date(selectedIssue.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!showResolveModal ? (
                <div className="flex gap-3">
                  {selectedIssue.status === 'open' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'in_progress')}
                      className="flex-1"
                    >
                      Mark In Progress
                    </Button>
                  )}
                  {selectedIssue.status === 'in_progress' && (
                    <Button
                      onClick={() => setShowResolveModal(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <RiCheckboxCircleFill className="w-4 h-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-6 bg-muted/30 rounded-xl">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <RiCheckboxCircleFill className="w-5 h-5 text-green-600" />
                    Resolution Details
                  </h3>

                  <div>
                    <Label htmlFor="resolutionMessage">Resolution Message</Label>
                    <Textarea
                      id="resolutionMessage"
                      value={resolutionMessage}
                      onChange={(e) => setResolutionMessage(e.target.value)}
                      placeholder="Describe how the issue was resolved..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resolutionImages">Resolution Images</Label>
                    <div className="mt-2">
                      <label
                        htmlFor="resolutionImages"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary cursor-pointer transition-colors"
                      >
                        <RiCameraLine className="w-5 h-5" />
                        <span className="text-sm font-medium">Upload Resolution Photos</span>
                      </label>
                      <Input
                        id="resolutionImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    {resolutionImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {resolutionImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Resolution ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <RiCloseLine className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleResolveWithDetails}
                      disabled={!resolutionMessage.trim() || isUpdating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <RiCheckboxCircleFill className="w-4 h-4 mr-2" />
                      {isUpdating ? 'Resolving...' : 'Confirm Resolution'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResolveModal(false);
                        setResolutionMessage('');
                        setResolutionImages([]);
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};