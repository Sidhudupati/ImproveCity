import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../api/issues';
import type { Issue } from '../types';
import { IssueCard } from '../components/IssueCard';
import { IssueTableView } from '../components/IssueTableView';
import { FilterBar } from '../components/FilterBar';
import { Preloader } from '../components/Preloader';
import { useFilterStore } from '../stores/uiStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiLineChartLine } from 'react-icons/ri';

export function HomePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);
  const limit = 12;

  const { viewMode, categoryFilter, locationFilter } = useFilterStore();

  const loadData = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const [statsData, filteredData] = await Promise.all([
        issuesAPI.getIssueStats(),
        issuesAPI.getFilteredIssues(
          categoryFilter,
          locationFilter.latitude && locationFilter.longitude
            ? { latitude: locationFilter.latitude, longitude: locationFilter.longitude }
            : null,
          currentPage,
          limit
        ),
      ]);
      setIssues(filteredData.issues);
      setTotalIssues(filteredData.total);
      setTotalPages(filteredData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const handleIssueUpdate = (updatedIssue?: Issue) => {
    if (updatedIssue) {
      // Update the issue in the list without full reload
      setIssues(prevIssues =>
        prevIssues.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue)
      );
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    loadData(false);
  }, [categoryFilter, locationFilter]);

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        {/* Hero Section */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 mb-8 shadow-2xl text-primary-foreground bg-cover"
        >
          <div className='absolute w-full h-full left-0 top-0 flex justify-center z-1'>
            <img src='/header.png' alt="Header Background" className="object-cover w-full h-full" />
          </div>
          <div className='absolute w-full h-full bg-black/40 z-2 top-0 left-0'></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/30">
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse"></div>
              <span className="text-sm font-medium">Community Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Welcome to Improve My City
            </h1>
            <p className="opacity-90 text-base sm:text-lg lg:text-xl mb-8 max-w-2xl leading-relaxed">
              Report civic issues, track their progress, and help make your community better. Together, we can create positive change.
            </p>
            <Link to="/report">
              <Button variant="secondary" size="lg" className="font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Report New Issue
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl"></div>
        </div>

        {/* Compact Stats Strip */}
        <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
              <div className="w-11 h-11 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.pending}</p>
                <p className="text-xs text-muted-foreground font-medium">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <RiLineChartLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground font-medium">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar />
        </div>

        {/* Issues Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">
              {locationFilter.query ? 'Nearby Issues' : 'All Issues'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found
            </p>
          </div>
          <Link to="/resolved" className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2 group w-fit">
            View All Resolved
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Issues Display - Grid or Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onUpdate={handleIssueUpdate} />
            ))}
          </div>
        ) : (
          <IssueTableView issues={issues} onUpdate={handleIssueUpdate} />
        )}

        {/* Pagination */}
        {totalPages > 1 && issues.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <span className="text-sm text-muted-foreground ml-4">
              Page {currentPage} of {totalPages} ({totalIssues} total)
            </span>
          </div>
        )}

        {issues.length === 0 && (
          <Card className="text-center py-16 sm:py-20 px-6 bg-card/30 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">No issues found</h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                {categoryFilter !== 'All' || locationFilter.query
                  ? 'Try adjusting your filters to see more results'
                  : 'Be the first to report an issue in your community'}
              </p>
              <Link to="/report">
                <Button size="lg" className="font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Report New Issue
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
