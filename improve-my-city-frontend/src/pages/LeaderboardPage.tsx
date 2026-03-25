import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/services/leaderboard';
import type { LeaderboardEntry } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { Preloader } from '@/components/Preloader';
import {
  RiTrophyFill,
  RiMedalFill,
  RiAwardFill,
  RiFireFill,
  RiThumbUpFill,
  RiBarChartBoxFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiTimeFill,
  RiSparklingFill,
  RiTeamFill,
  RiCloseLine,
} from 'react-icons/ri';

const badgeConfig: Record<string, { color: string; gradient: string; icon: any }> = {
  'Legend': { 
    color: 'from-purple-500 to-pink-500', 
    gradient: 'bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30',
    icon: RiSparklingFill 
  },
  'Hero': { 
    color: 'from-blue-500 to-cyan-500', 
    gradient: 'bg-linear-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30',
    icon: RiTrophyFill 
  },
  'Champion': { 
    color: 'from-orange-500 to-yellow-500', 
    gradient: 'bg-linear-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30',
    icon: RiMedalFill 
  },
  'Rising Star': { 
    color: 'from-green-500 to-emerald-500', 
    gradient: 'bg-linear-to-br from-green-500/10 to-emerald-500/10 border-green-500/30',
    icon: RiFireFill 
  },
  'Reporter Pro': { 
    color: 'from-red-500 to-rose-500', 
    gradient: 'bg-linear-to-br from-red-500/10 to-rose-500/10 border-red-500/30',
    icon: RiBarChartBoxFill 
  },
  'Active Reporter': { 
    color: 'from-indigo-500 to-purple-500', 
    gradient: 'bg-linear-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30',
    icon: RiErrorWarningFill 
  },
  'Community Favorite': { 
    color: 'from-pink-500 to-rose-500', 
    gradient: 'bg-linear-to-br from-pink-500/10 to-rose-500/10 border-pink-500/30',
    icon: RiThumbUpFill 
  },
  'Popular': { 
    color: 'from-amber-500 to-orange-500', 
    gradient: 'bg-linear-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30',
    icon: RiAwardFill 
  },
};

const getRankDisplay = (rank: number) => {
  if (rank === 1) return { icon: '🥇', color: 'text-yellow-500', bgGradient: 'from-yellow-500/20 to-yellow-600/20' };
  if (rank === 2) return { icon: '🥈', color: 'text-gray-400', bgGradient: 'from-gray-400/20 to-gray-500/20' };
  if (rank === 3) return { icon: '🥉', color: 'text-orange-600', bgGradient: 'from-orange-600/20 to-orange-700/20' };
  return { icon: `#${rank}`, color: 'text-muted-foreground', bgGradient: 'from-muted/50 to-muted/30' };
};

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentUserRank = leaderboard.find(entry => entry.userId === currentUser?.id);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 mb-8 shadow-2xl bg-linear-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="relative z-10 flex flex-col gap-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Recognizing Top Contributors</h1>
            <p className="opacity-90 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed">
              A professional scoreboard showcasing the citizens driving the biggest impact.
            </p>
            {currentUserRank && (
              <div className="mt-2 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20 w-fit">
                <img src={currentUserRank.avatar} className="w-8 h-8 rounded-full ring-2 ring-primary-foreground/30" alt={currentUserRank.name} />
                <span className="text-sm">You're currently ranked</span>
                <span className="inline-flex items-center gap-2 font-semibold">
                  {getRankDisplay(currentUserRank.rank || 0).icon}
                  <span className="opacity-90">#{currentUserRank.rank}</span>
                </span>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full blur-3xl" />
        </div>

        {/* Top performers */}
        {topThree.length > 0 ? (
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {topThree.map((entry, idx) => {
              const rankDisplay = getRankDisplay(entry.rank || 0);
              const size = idx === 0 ? 'h-28 w-28' : 'h-20 w-20';
              const ringColor = idx === 0 ? 'ring-yellow-400/70' : idx === 1 ? 'ring-gray-300/70' : 'ring-amber-600/70';
              const borderColor = idx === 0 ? 'border-yellow-400/50' : idx === 1 ? 'border-gray-300/50' : 'border-amber-600/50';
              return (
                <button
                  key={entry.userId}
                  className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-card/60 backdrop-blur-sm p-6 shadow-lg text-left hover:shadow-xl hover:-translate-y-0.5 transition-all`}
                  onClick={() => setSelectedUser(entry)}
                >
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={entry.avatar} alt={entry.name} className={`${size} rounded-full ring-4 ${ringColor} shadow-xl`} />
                      <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-background text-2xl shadow ring-2 ring-border">
                        {rankDisplay.icon}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-foreground truncate">{entry.name}</h3>
                        {entry.badges.slice(0,1).map((badge) => {
                          const config = badgeConfig[badge];
                          const Icon = config?.icon || RiAwardFill;
                          return (
                            <span key={badge} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${config?.gradient || 'bg-accent'}`}>
                              <Icon className="h-3 w-3" /> {badge}
                            </span>
                          )
                        })}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-lg font-bold text-primary">{entry.score}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-500">{entry.resolvedIssues}</div>
                          <div className="text-xs text-muted-foreground">Resolved</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-500">{entry.totalUpvotes}</div>
                          <div className="text-xs text-muted-foreground">Upvotes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <RiTeamFill className="mx-auto w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No contributors yet</p>
          </div>
        )}

        {/* All contributors (only when there are any) */}
        {rest.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-foreground">All Contributors</h2>
              <p className="text-sm text-muted-foreground">{leaderboard.length} total</p>
            </div>
            {rest.map((entry) => {
              const rankDisplay = getRankDisplay(entry.rank || 0);
              const isCurrentUser = entry.userId === currentUser?.id;
              return (
                <button
                  key={entry.userId}
                  className={`group relative w-full text-left overflow-hidden rounded-xl border bg-card p-4 shadow transition-all hover:shadow-lg cursor-pointer ${isCurrentUser ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
                  onClick={() => setSelectedUser(entry)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${rankDisplay.bgGradient} font-bold ${rankDisplay.color}`}>
                      {rankDisplay.icon}
                    </div>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img src={entry.avatar} alt={entry.name} className="h-12 w-12 rounded-full ring-2 ring-border group-hover:ring-primary/50" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{entry.name}{isCurrentUser && ' (You)'}</h3>
                        <p className="text-sm text-muted-foreground truncate">{entry.email}</p>
                      </div>
                    </div>
                    <div className="hidden sm:grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-primary">{entry.score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-500">{entry.resolvedIssues}</div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-500">{entry.totalIssues}</div>
                        <div className="text-xs text-muted-foreground">Reported</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-500">{entry.totalUpvotes}</div>
                        <div className="text-xs text-muted-foreground">Upvotes</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="relative max-w-3xl w-full max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-linear-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-t-3xl">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute right-4 top-4 rounded-full p-2 hover:bg-primary-foreground/10 transition"
                  aria-label="Close"
                >
                  <RiCloseLine className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-full ring-4 ring-primary-foreground/40 shadow-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background text-base font-bold text-foreground ring-2 ring-primary-foreground/70 shadow">
                      {getRankDisplay(selectedUser.rank || 0).icon}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold truncate">{selectedUser.name}</h2>
                    <p className="text-primary-foreground/90 text-sm sm:text-base truncate">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 sm:px-8 py-8">
                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <RiSparklingFill className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <div className="text-xl font-bold text-primary">{selectedUser.score}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <RiCheckboxCircleFill className="mx-auto mb-2 h-6 w-6 text-green-500" />
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{selectedUser.resolvedIssues}</div>
                    <div className="text-xs text-muted-foreground">Resolved</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <RiErrorWarningFill className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedUser.totalIssues}</div>
                    <div className="text-xs text-muted-foreground">Total Issues</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <RiThumbUpFill className="mx-auto mb-2 h-6 w-6 text-purple-500" />
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{selectedUser.totalUpvotes}</div>
                    <div className="text-xs text-muted-foreground">Upvotes</div>
                  </div>
                </div>

                {/* Contributions breakdown */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  {/* Open */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RiErrorWarningFill className="h-4 w-4 text-yellow-500" /> Open Issues
                      </span>
                      <span className="text-sm font-semibold">{selectedUser.openIssues}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-yellow-500/70"
                        style={{ width: `${Math.round((selectedUser.totalIssues ? (selectedUser.openIssues / selectedUser.totalIssues) : 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* In progress */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RiTimeFill className="h-4 w-4 text-orange-500" /> In Progress
                      </span>
                      <span className="text-sm font-semibold">{selectedUser.inProgressIssues}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500/70"
                        style={{ width: `${Math.round((selectedUser.totalIssues ? (selectedUser.inProgressIssues / selectedUser.totalIssues) : 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                {selectedUser.badges.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-foreground">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.badges.map((badge) => {
                        const config = badgeConfig[badge];
                        const Icon = config?.icon || RiAwardFill;
                        return (
                          <div
                            key={badge}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 font-semibold ${config?.gradient || 'bg-accent'}`}
                          >
                            <Icon className="h-5 w-5" />
                            {badge}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
