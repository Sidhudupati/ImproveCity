import { useState, useEffect } from 'react';
import { issuesAPI } from '../api/issues';
import type { Issue } from '../types';
import { IssueCard } from '../components/IssueCard';
import { IssueTableView } from '../components/IssueTableView';
import { Preloader } from '../components/Preloader';
import { useFilterStore } from '../stores/uiStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiGridFill, RiTableLine, RiCheckboxCircleFill, RiMedalLine } from 'react-icons/ri';

export function ResolvedIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { viewMode, setViewMode } = useFilterStore();

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const data = await issuesAPI.getResolvedIssues();
      setIssues(data);
    } catch (error) {
      console.error('Failed to load resolved issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 mb-8 shadow-2xl bg-linear-to-br from-green-600 via-green-500 to-emerald-600 text-white">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <RiCheckboxCircleFill className="w-4 h-4" />
              <span className="text-sm font-medium">Success Stories</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Resolved Issues
            </h1>
            <p className="opacity-90 text-base sm:text-lg lg:text-xl mb-8 max-w-2xl leading-relaxed">
              Celebrating our community's success in making the city better. Every resolution represents collective effort and progress.
            </p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <RiMedalLine className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{issues.length}</p>
                  <p className="opacity-80 text-sm">Issues Resolved</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 p-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 bg-green-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Transparency & Accountability</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This page showcases all successfully resolved civic issues, demonstrating our commitment to transparency
                and our collective effort in improving our community. Every resolution represents a step forward in making
                our city better for everyone.
              </p>
            </div>
          </div>
        </Card>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">
              Completed Work
            </h2>
            <p className="text-sm text-muted-foreground">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'} successfully resolved
            </p>
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

        {/* Issues Display */}
        {issues.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {issues.map((issue) => (
                <div key={issue.id} className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-green-500 text-white">
                      <RiCheckboxCircleFill className="w-6 h-6" />
                    </div>
                  </div>
                  <IssueCard issue={issue} onUpdate={loadIssues} showActions={false} />
                </div>
              ))}
            </div>
          ) : (
            <IssueTableView issues={issues} onUpdate={loadIssues} />
          )
        ) : (
          <Card className="text-center py-16 sm:py-20 px-6 bg-card/30 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                <RiCheckboxCircleFill className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">No resolved issues yet</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Check back soon to see completed civic improvements and celebrate community success
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
