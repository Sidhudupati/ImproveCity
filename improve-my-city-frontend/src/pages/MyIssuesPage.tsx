import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { issuesAPI } from '../api/issues';
import type { Issue, IssueStatus, IssueCategory } from '../types';
import { IssueCard } from '../components/IssueCard';
import { IssueTableView } from '../components/IssueTableView';
import { Preloader } from '../components/Preloader';
import { useFilterStore } from '../stores/uiStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RiGridFill, RiTableLine, RiDeleteBinLine, RiFilter3Line, RiAddLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export function MyIssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  const { viewMode, setViewMode } = useFilterStore();

  const loadIssues = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await issuesAPI.getIssuesByUser(user.id);
      setIssues(data);
      setFilteredIssues(data);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [user]);

  useEffect(() => {
    let filtered = [...issues];

    if (statusFilter !== 'All') {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter((issue) => issue.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          return (b.upvotes || 0) - (a.upvotes || 0);
        default:
          return 0;
      }
    });

    setFilteredIssues(filtered);
  }, [statusFilter, categoryFilter, sortBy, issues]);

  const handleDeleteIssue = async (issueId: string) => {
    if (!user || !confirm('Are you sure you want to delete this issue?')) return;

    try {
      await issuesAPI.deleteIssue(issueId, user.id);
      await loadIssues();
      toast.success('Issue deleted successfully');
    } catch (error) {
      console.error('Failed to delete issue:', error);
      toast.error(`Failed to delete issue: ${error instanceof Error ? error.message : ''}`);
    }
  };

  const stats = {
    all: issues.length,
    pending: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            My Reported Issues
          </h1>
          <p className="text-muted-foreground text-lg">
            Track and manage the issues you've reported
          </p>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setStatusFilter('All')}
            className={`text-left transition-all ${statusFilter === 'All' ? 'scale-105' : ''}`}
          >
            <Card className={`p-4 hover:shadow-lg transition-all ${statusFilter === 'All' ? 'ring-2 ring-primary' : ''}`}>
              <p className="text-2xl font-bold mb-1">{stats.all}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase">All Issues</p>
            </Card>
          </button>

          <button
            onClick={() => setStatusFilter('open')}
            className={`text-left transition-all ${statusFilter === 'open' ? 'scale-105' : ''}`}
          >
            <Card className={`p-4 hover:shadow-lg transition-all ${statusFilter === 'open' ? 'ring-2 ring-yellow-500' : ''}`}>
              <p className="text-2xl font-bold mb-1">{stats.pending}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase">Pending</p>
            </Card>
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`text-left transition-all ${statusFilter === 'in_progress' ? 'scale-105' : ''}`}
          >
            <Card className={`p-4 hover:shadow-lg transition-all ${statusFilter === 'in_progress' ? 'ring-2 ring-purple-500' : ''}`}>
              <p className="text-2xl font-bold mb-1">{stats.inProgress}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase">In Progress</p>
            </Card>
          </button>

          <button
            onClick={() => setStatusFilter('resolved')}
            className={`text-left transition-all ${statusFilter === 'resolved' ? 'scale-105' : ''}`}
          >
            <Card className={`p-4 hover:shadow-lg transition-all ${statusFilter === 'resolved' ? 'ring-2 ring-green-500' : ''}`}>
              <p className="text-2xl font-bold mb-1">{stats.resolved}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase">Resolved</p>
            </Card>
          </button>
        </div>

        {/* Filters and View Toggle */}
        <Card className="p-4 mb-6 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <RiFilter3Line className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold">Filters</span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as IssueStatus | 'All')}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as IssueCategory | 'All')}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Pothole">Pothole</SelectItem>
                  <SelectItem value="Garbage">Garbage</SelectItem>
                  <SelectItem value="Streetlight">Streetlight</SelectItem>
                  <SelectItem value="Water Supply">Water Supply</SelectItem>
                  <SelectItem value="Drainage">Drainage</SelectItem>
                  <SelectItem value="Road Damage">Road Damage</SelectItem>
                  <SelectItem value="Parks">Parks</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'newest' | 'oldest' | 'popular')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <RiGridFill className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => setViewMode('table')}
              >
                <RiTableLine className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Issues Display */}
        {filteredIssues.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="relative">
                  <IssueCard 
                    issue={issue} 
                    onUpdate={(updatedIssue) => {
                      if (updatedIssue) {
                        // Update locally without reload
                        setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
                      }
                    }} 
                  />
                  {issue.status === 'open' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-4 right-4 z-10 shadow-lg"
                      onClick={() => handleDeleteIssue(issue.id)}
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <IssueTableView issues={filteredIssues} onUpdate={loadIssues} />
          )
        ) : (
          <Card className="text-center py-16 sm:py-20 px-6 bg-card/30 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                {issues.length === 0 ? "There are no issues" : 'No issues match your filters'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                {issues.length === 0
                  ? 'Start making a difference by reporting civic issues in your community'
                  : 'Try adjusting your filters to see more results'}
              </p>
              {issues.length === 0 && (
                <Link to="/report">
                  <Button size="lg" className="font-semibold">
                    <RiAddLine className="w-5 h-5 mr-2" />
                    Report New Issue
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

