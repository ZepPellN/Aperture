'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Lightbulb,
  Activity,
  BookOpen,
  Plane,
  Camera,
  Heart,
  Briefcase,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface LifeAreaDoc {
  name: string;
  path: string;
}

interface LifeArea {
  name: string;
  slug: string;
  docs?: LifeAreaDoc[];
}

interface GoalItem {
  domain: string;
  title: string;
  text: string;
  plan?: string;
  target?: string;
}

interface WeeklyReviewSummary {
  week: string;
  period: string;
  daysLogged: number;
  buildingDays: number;
  ideasCount: number;
  contentHtml?: string;
}

interface TaskItem {
  text: string;
  done: boolean;
  source: string;
}

interface TaskSummary {
  week: string;
  pendingCount: number;
  completedCount: number;
  items?: TaskItem[];
}

interface RecentDiary {
  date: string;
  mode: string;
  dominantEmotion?: string;
  buildTarget?: string;
  contentHtml?: string;
  ideasCount: number;
  buildingCount: number;
  energyLevel?: number;
  habits?: Record<string, boolean>;
  questions?: string[];
}

interface WeeklyIntent {
  week: string;
  stop?: string[];
  start?: string[];
  forgive?: string[];
  selfCare?: string[];
  contentHtml?: string;
}

interface LifeDashboardData {
  areas: LifeArea[];
  goals: GoalItem[];
  recentReviews: WeeklyReviewSummary[];
  recentTasks: TaskSummary[];
  recentDiaries: RecentDiary[];
  habitTracker: string;
  currentWeek: string;
  weeklyIntent?: WeeklyIntent;
}

interface LifeDashboardProps {
  data: LifeDashboardData;
}

const areaIcons: Record<string, any> = {
  health: Heart,
  career: Briefcase,
  photography: Camera,
  travel: Plane,
  reading: BookOpen,
};

const areaColors: Record<string, string> = {
  health: 'bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-300',
  career: 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300',
  photography: 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-300',
  travel: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300',
  reading: 'bg-violet-50 border-violet-200 text-violet-700 hover:border-violet-300',
};

const intentCardStyles: Record<string, string> = {
  STOP: 'bg-rose-50/80 border-rose-200/60',
  START: 'bg-emerald-50/80 border-emerald-200/60',
  FORGIVE: 'bg-amber-50/80 border-amber-200/60',
  'SELF-CARE': 'bg-violet-50/80 border-violet-200/60',
};

const intentLabelStyles: Record<string, string> = {
  STOP: 'text-rose-600',
  START: 'text-emerald-600',
  FORGIVE: 'text-amber-600',
  'SELF-CARE': 'text-violet-600',
};

function ModeBadge({ mode }: { mode: string }) {
  const styles =
    mode === 'vacation'
      ? 'bg-emerald-100 text-emerald-700'
      : mode === 'free'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-700';
  const labels: Record<string, string> = {
    normal: 'Working',
    vacation: 'Vacation',
    free: 'Free Day',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {labels[mode] || mode}
    </span>
  );
}

function TaskList({ tasks }: { tasks?: TaskItem[] }) {
  if (!tasks || tasks.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {tasks.map((t, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 text-muted-foreground">{t.done ? '☑' : '☐'}</span>
          <span className={t.done ? 'line-through text-muted-foreground' : ''}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

function HabitHeatmap({ diaries }: { diaries: RecentDiary[] }) {
  const allHabits = useMemo(() => {
    const set = new Set<string>();
    for (const d of diaries) {
      if (d.habits) {
        Object.keys(d.habits).forEach((h) => set.add(h));
      }
    }
    return Array.from(set);
  }, [diaries]);

  if (allHabits.length === 0) {
    return <div className="text-sm text-muted-foreground">No habit data yet.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <div className="w-20 shrink-0" />
        {diaries.map((d) => (
          <div key={d.date} className="flex-1 text-center">
            <span className="text-[10px] text-muted-foreground tabular-nums">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
      {allHabits.map((habit) => (
        <div key={habit} className="flex items-center gap-1.5">
          <div className="w-20 shrink-0 text-xs text-muted-foreground truncate" title={habit}>
            {habit}
          </div>
          {diaries.map((d) => {
            const done = d.habits?.[habit] ?? false;
            return (
              <div key={d.date} className="flex-1 flex justify-center">
                <div
                  className={`h-5 w-5 rounded-sm transition-colors duration-200 ${
                    done ? 'bg-primary shadow-sm' : 'bg-muted/50'
                  }`}
                  title={`${d.date}: ${done ? 'Done' : 'Not done'}`}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function LifeDashboard({ data }: LifeDashboardProps) {
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [expandedDiary, setExpandedDiary] = useState<string | null>(null);
  const [showInlineTasks, setShowInlineTasks] = useState(false);
  const [expandedIdeas, setExpandedIdeas] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(false);
  const [expandedCompleted, setExpandedCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const totalPending = data.recentTasks[0]?.pendingCount || 0;
  const totalCompleted = data.recentTasks[0]?.completedCount || 0;
  const totalBuildingDays = data.recentReviews[0]?.buildingDays || 0;
  const totalIdeas = data.recentReviews[0]?.ideasCount || 0;
  const currentWeek = data.currentWeek;

  const latestTaskWeek = data.recentTasks[0];
  const latestPending = latestTaskWeek?.items?.filter((t) => !t.done) || [];
  const latestCompleted = latestTaskWeek?.items?.filter((t) => t.done) || [];

  const goalsByDomain = useMemo(() => {
    const map: Record<string, GoalItem[]> = {};
    for (const g of data.goals) {
      map[g.domain] = map[g.domain] || [];
      map[g.domain].push(g);
    }
    return map;
  }, [data.goals]);

  const areaGoalCount = (areaName: string) => {
    return (goalsByDomain[areaName] || []).length;
  };

  const maxTasks = useMemo(() => {
    if (data.recentTasks.length === 0) return 1;
    return Math.max(...data.recentTasks.map((t) => t.pendingCount + t.completedCount), 1);
  }, [data.recentTasks]);

  const hasHabits = data.recentDiaries.some((d) => d.habits && Object.keys(d.habits).length > 0);
  const hasEnergyOrMood = data.recentDiaries.some((d) => d.energyLevel !== undefined || d.dominantEmotion);
  const hasQuestions = data.recentDiaries.some((d) => d.questions && d.questions.length > 0);
  const hasIntent = data.weeklyIntent && (
    (data.weeklyIntent.stop && data.weeklyIntent.stop.length > 0) ||
    (data.weeklyIntent.start && data.weeklyIntent.start.length > 0) ||
    (data.weeklyIntent.forgive && data.weeklyIntent.forgive.length > 0) ||
    (data.weeklyIntent.selfCare && data.weeklyIntent.selfCare.length > 0)
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-heading text-balance">
            Life Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentWeek} · Intent-driven weekly reflection
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {totalBuildingDays}d building
          </span>
          <span className="opacity-30">·</span>
          <span className="flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            {totalIdeas} ideas
          </span>
        </div>
      </div>

      {/* ==================== ZONE 1: Stats — compact bar ==================== */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setExpandedWeek(!expandedWeek)}
          className="group rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Week</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xl font-semibold text-foreground tabular-nums">{currentWeek}</span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 ${
                expandedWeek ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        <button
          onClick={() => setShowInlineTasks(!showInlineTasks)}
          className="group rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Circle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Pending</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xl font-semibold text-foreground tabular-nums">{totalPending}</span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 ${
                showInlineTasks ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        <button
          onClick={() => setExpandedCompleted(!expandedCompleted)}
          className="group rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Done</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xl font-semibold text-foreground tabular-nums">{totalCompleted}</span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 ${
                expandedCompleted ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        <button
          onClick={() => setExpandedIdeas(!expandedIdeas)}
          className="group rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Ideas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xl font-semibold text-foreground tabular-nums">{totalIdeas}</span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 ${
                expandedIdeas ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Expandable stat panels */}
      {expandedWeek && (
        <div className="rounded-xl border border-border bg-card p-5 -mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Week {currentWeek} overview</span>
          </div>
          {data.habitTracker && (
            <div
              className="wiki-article text-sm max-h-80 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: data.habitTracker }}
            />
          )}
        </div>
      )}

      {showInlineTasks && latestTaskWeek && (
        <div className="rounded-xl border border-border bg-card p-5 -mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{latestTaskWeek.week} Tasks</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {latestPending.length} pending · {latestCompleted.length} completed
            </span>
          </div>
          {latestPending.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Pending</div>
              <TaskList tasks={latestPending} />
            </div>
          )}
          {latestCompleted.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Completed</div>
              <TaskList tasks={latestCompleted} />
            </div>
          )}
        </div>
      )}

      {expandedCompleted && (
        <div className="rounded-xl border border-border bg-card p-5 -mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {latestCompleted.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Completed Tasks</span>
                <span className="text-xs text-muted-foreground">{latestTaskWeek?.week}</span>
              </div>
              <TaskList tasks={latestCompleted} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No completed tasks this week.</div>
          )}
        </div>
      )}

      {expandedIdeas && data.recentReviews[0] && (
        <div className="rounded-xl border border-border bg-card p-5 -mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{data.recentReviews[0].week} Ideas</span>
            <span className="text-xs text-muted-foreground tabular-nums">{data.recentReviews[0].ideasCount} captured</span>
          </div>
          {data.recentReviews[0].contentHtml && (
            <div
              className="wiki-article text-sm max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: data.recentReviews[0].contentHtml }}
            />
          )}
        </div>
      )}

      {/* ==================== ZONE 2: Weekly Intent — always visible, the hero ==================== */}
      {hasIntent ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">This Week&rsquo;s Intent</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.weeklyIntent!.stop && data.weeklyIntent!.stop.length > 0 && (
              <div className={`rounded-xl border p-4 ${intentCardStyles['STOP']}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${intentLabelStyles['STOP']}`}>
                  STOP
                </div>
                <ul className="space-y-1.5">
                  {data.weeklyIntent!.stop.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/80 leading-snug flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.weeklyIntent!.start && data.weeklyIntent!.start.length > 0 && (
              <div className={`rounded-xl border p-4 ${intentCardStyles['START']}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${intentLabelStyles['START']}`}>
                  START
                </div>
                <ul className="space-y-1.5">
                  {data.weeklyIntent!.start.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/80 leading-snug flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.weeklyIntent!.forgive && data.weeklyIntent!.forgive.length > 0 && (
              <div className={`rounded-xl border p-4 ${intentCardStyles['FORGIVE']}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${intentLabelStyles['FORGIVE']}`}>
                  FORGIVE
                </div>
                <ul className="space-y-1.5">
                  {data.weeklyIntent!.forgive.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/80 leading-snug flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.weeklyIntent!.selfCare && data.weeklyIntent!.selfCare.length > 0 && (
              <div className={`rounded-xl border p-4 ${intentCardStyles['SELF-CARE']}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${intentLabelStyles['SELF-CARE']}`}>
                  SELF-CARE
                </div>
                <ul className="space-y-1.5">
                  {data.weeklyIntent!.selfCare.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/80 leading-snug flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No weekly intent set. Run{' '}
            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/life-intent</code> to create one.
          </p>
        </div>
      )}

      {/* ==================== ZONE 3: Next Actions — promoted ==================== */}
      {hasQuestions && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Next Actions</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.recentDiaries
              .filter((d) => d.questions && d.questions.length > 0)
              .slice(0, 6)
              .map((d) => (
                <div key={d.date} className="rounded-lg border border-border/40 bg-card p-3">
                  <div className="text-[10px] font-medium text-muted-foreground mb-1.5 tabular-nums">{d.date}</div>
                  <ul className="space-y-1">
                    {d.questions!.slice(0, 2).map((q, i) => (
                      <li key={i} className="text-xs text-foreground/70 leading-snug flex items-start gap-1.5">
                        <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30" />
                        {q.length > 60 ? q.slice(0, 60) + '...' : q}
                      </li>
                    ))}
                    {d.questions!.length > 2 && (
                      <li className="text-[10px] text-muted-foreground">+{d.questions!.length - 2} more</li>
                    )}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ==================== ZONE 4: Mood + Habits side-by-side ==================== */}
      {(hasEnergyOrMood || hasHabits) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mood timeline — shows dominant emotion per day as colored bars */}
          {hasEnergyOrMood && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-serif text-lg font-normal tracking-tight text-heading">Mood</h2>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-end gap-1.5" style={{ minHeight: '80px' }}>
                  {data.recentDiaries.slice().reverse().map((d) => {
                    const hasMood = !!d.dominantEmotion;
                    let barColor = 'bg-muted/30';
                    let barH = 'h-2';
                    if (d.dominantEmotion) {
                      const e = d.dominantEmotion;
                      if (e.includes('兴奋') || e.includes('充实') || e.includes('进展')) { barColor = 'bg-emerald-400/50'; barH = 'h-14'; }
                      else if (e.includes('焦虑') || e.includes('疲劳') || e.includes('压力')) { barColor = 'bg-rose-400/50'; barH = 'h-6'; }
                      else if (e.includes('爆炸') || e.includes('过载')) { barColor = 'bg-orange-400/50'; barH = 'h-10'; }
                      else { barColor = 'bg-amber-400/40'; barH = 'h-10'; }
                    }
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 justify-end">
                        <div className="flex flex-col items-center gap-1">
                          {d.energyLevel !== undefined && (
                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{d.energyLevel}</span>
                          )}
                          {d.dominantEmotion && (
                            <span className="text-[10px] text-foreground/60 text-center leading-tight max-w-[4rem] truncate" title={d.dominantEmotion}>
                              {d.dominantEmotion.split('、')[0]}
                            </span>
                          )}
                        </div>
                        <div className={`w-full rounded-t-sm transition-colors ${barColor} ${barH}`} title={d.dominantEmotion || 'No mood data'} />
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Habit Heatmap */}
          {hasHabits && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-4 w-2 rounded-sm bg-primary" />
                  <span className="h-4 w-2 rounded-sm bg-muted/50" />
                </div>
                <h2 className="font-serif text-lg font-normal tracking-tight text-heading">Habits</h2>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4 overflow-x-auto">
                <HabitHeatmap diaries={data.recentDiaries.slice().reverse()} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* ==================== ZONE 5: Task Velocity + Recent Days ==================== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Velocity */}
        {data.recentTasks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-serif text-lg font-normal tracking-tight text-heading">
                Task Velocity
              </h2>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              {(() => {
                const ordered = [...data.recentTasks].reverse(); // oldest first: W15 → W16
                const maxVal = Math.max(maxTasks, 1);
                return (
                  <div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-primary/40" /> Pending
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-primary" /> Done
                      </span>
                    </div>
                    {/* Bar chart */}
                    <div className="flex items-end gap-4" style={{ minHeight: '80px' }}>
                      {ordered.map((t) => {
                        const pendingH = t.pendingCount > 0 ? Math.max(4, (t.pendingCount / maxVal) * 70) : 0;
                        const completedH = t.completedCount > 0 ? Math.max(4, (t.completedCount / maxVal) * 70) : 0;
                        return (
                          <div key={t.week} className="flex-1 flex flex-col items-center gap-0">
                            {/* Bars container — labels sit on top of bars */}
                            <div className="flex items-end gap-1" style={{ height: '80px' }}>
                              {/* Pending bar + label */}
                              <div className="flex flex-col items-center" style={{ height: pendingH > 0 ? `${pendingH + 14}px` : '0px', justifyContent: 'flex-end' }}>
                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums leading-none mb-0.5">{t.pendingCount}</span>
                                <div
                                  className="w-5 rounded-t-sm bg-primary/40 transition-all"
                                  style={{ height: `${pendingH}px`, minHeight: pendingH > 0 ? '4px' : '0px' }}
                                  title={`${t.week}: ${t.pendingCount} pending`}
                                />
                              </div>
                              {/* Done bar + label */}
                              <div className="flex flex-col items-center" style={{ height: completedH > 0 ? `${completedH + 14}px` : '0px', justifyContent: 'flex-end' }}>
                                {t.completedCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground tabular-nums leading-none mb-0.5">{t.completedCount}</span>
                                )}
                                <div
                                  className="w-5 rounded-t-sm bg-primary transition-all"
                                  style={{ height: `${completedH}px`, minHeight: completedH > 0 ? '4px' : '0px' }}
                                  title={`${t.week}: ${t.completedCount} done`}
                                />
                              </div>
                            </div>
                            {/* Week label below bars */}
                            <span className="text-[10px] text-muted-foreground font-medium mt-1 tabular-nums">{t.week}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* Recent Diaries */}
        {data.recentDiaries.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-serif text-lg font-normal tracking-tight text-heading">
                Recent Days
              </h2>
            </div>
            <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-card">
              {data.recentDiaries.slice(0, 5).map((d, i) => {
                const isExpanded = expandedDiary === d.date;
                return (
                  <div key={d.date}>
                    <div
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-secondary/20 ${
                        i === 0 ? 'rounded-t-xl' : ''
                      } ${i === Math.min(data.recentDiaries.length, 5) - 1 && !isExpanded ? 'rounded-b-xl' : ''}`}
                      onClick={() => setExpandedDiary(isExpanded ? null : d.date)}
                    >
                      <div className="flex h-7 shrink-0 items-center justify-center rounded-md bg-secondary px-2 text-xs font-medium tabular-nums min-w-[3.2rem]">
                        {d.date.slice(5)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{d.date}</span>
                          <ModeBadge mode={d.mode} />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {d.dominantEmotion && (
                            <span className="truncate">{d.dominantEmotion}</span>
                          )}
                          {d.buildingCount > 0 && (
                            <span className="tabular-nums">{d.buildingCount} builds</span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {isExpanded && d.contentHtml && (
                      <div className="border-t border-border/40 px-4 py-4">
                        <div
                          className="wiki-article text-sm"
                          dangerouslySetInnerHTML={{ __html: d.contentHtml }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ==================== ZONE 6: Details — collapsible, lower priority ==================== */}
      <section className="space-y-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between rounded-xl border border-dashed border-border/60 bg-card/50 px-5 py-3 text-left transition-all duration-200 hover:bg-card hover:border-border"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Life Areas, Goals &amp; Reviews</span>
            <span className="text-[10px] text-muted-foreground/50 tabular-nums">
              {data.areas.length} areas · {data.goals.length} goals · {data.recentReviews.length} reviews
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-300 ${
              showDetails ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showDetails && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Life Areas */}
            <div className="space-y-3">
              <h2 className="font-serif text-lg font-normal tracking-tight text-heading">Life Areas</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.areas.map((area) => {
                  const Icon = areaIcons[area.slug] || Zap;
                  const colorClass =
                    areaColors[area.slug] || 'bg-secondary border-border text-foreground hover:border-border/80';
                  const isExpanded = expandedArea === area.slug;
                  const gCount = areaGoalCount(area.name);
                  const areaGoals = goalsByDomain[area.name] || [];
                  return (
                    <div
                      key={area.slug}
                      className={`rounded-lg border p-0 transition-all duration-200 ${colorClass} cursor-pointer`}
                      onClick={() => setExpandedArea(isExpanded ? null : area.slug)}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <Icon className="h-4 w-4 shrink-0 opacity-70" />
                        <span className="text-sm font-medium flex-1">{area.name}</span>
                        {gCount > 0 && (
                          <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                            {gCount}
                          </span>
                        )}
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      {isExpanded && (
                        <div className="border-t border-current/10 px-3 py-2.5 space-y-2">
                          {areaGoals.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wider">Goals</div>
                              {areaGoals.slice(0, 4).map((g, i) => (
                                <div key={i} className="text-xs opacity-80 leading-snug">{g.title}</div>
                              ))}
                              {areaGoals.length > 4 && (
                                <div className="text-[10px] opacity-50">+{areaGoals.length - 4} more</div>
                              )}
                            </div>
                          )}
                          {area.docs && area.docs.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wider">Documents</div>
                              {area.docs.map((doc, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs opacity-70">
                                  <FileText className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{doc.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Two-column: Goals + Reviews */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Goals */}
              <section className="space-y-3">
                <h2 className="font-serif text-lg font-normal tracking-tight text-heading">2026 Goals</h2>
                <div className="space-y-3">
                  {data.goals.length === 0 && (
                    <div className="rounded-lg border border-border/60 bg-card p-3 text-xs text-muted-foreground">
                      No goals found. Check witness/2026-goals.md format.
                    </div>
                  )}
                  {Object.entries(goalsByDomain).map(([domain, domainGoals]) => (
                    <div key={domain} className="rounded-lg border border-border/60 bg-card overflow-hidden">
                      <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{domain}</span>
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">{domainGoals.length}</span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {domainGoals.map((g, i) => {
                          const isExpanded = expandedGoal === `${domain}-${i}`;
                          return (
                            <div
                              key={i}
                              className="p-3 transition-colors hover:bg-secondary/20 cursor-pointer"
                              onClick={() => setExpandedGoal(isExpanded ? null : `${domain}-${i}`)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-foreground">{g.title}</div>
                                  <div className="text-xs text-foreground/60 mt-0.5">{g.text}</div>
                                </div>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform mt-0.5 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                              {isExpanded && (g.plan || g.target) && (
                                <div className="mt-2 space-y-2 pt-2 border-t border-border/30">
                                  {g.plan && (
                                    <div>
                                      <div className="text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Plan</div>
                                      <div className="text-xs text-foreground/70">{g.plan}</div>
                                    </div>
                                  )}
                                  {g.target && (
                                    <div>
                                      <div className="text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Target</div>
                                      <div className="text-xs text-foreground/70 flex items-start gap-1">
                                        <Target className="h-3 w-3 shrink-0 mt-0.5" />
                                        <span>{g.target}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Weekly Reviews */}
              <section className="space-y-3">
                <h2 className="font-serif text-lg font-normal tracking-tight text-heading">Weekly Reviews</h2>
                <div className="space-y-2">
                  {data.recentReviews.map((r) => (
                    <div key={r.week} className="rounded-lg border border-border/60 bg-card overflow-hidden">
                      <button
                        onClick={() => setExpandedReview(expandedReview === r.week ? null : r.week)}
                        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-secondary/20"
                      >
                        <div>
                          <div className="text-sm font-medium">{r.week}</div>
                          <div className="text-xs text-muted-foreground">{r.period}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{r.buildingDays}d</span>
                            <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" />{r.ideasCount}</span>
                          </div>
                          {expandedReview === r.week ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      {expandedReview === r.week && r.contentHtml && (
                        <div className="border-t border-border/40 px-4 py-4">
                          <div className="wiki-article text-sm" dangerouslySetInnerHTML={{ __html: r.contentHtml }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {data.recentReviews.length === 0 && (
                    <div className="rounded-lg border border-border/60 bg-card p-3 text-xs text-muted-foreground">
                      No weekly reviews yet. Run{' '}
                      <code className="text-[11px] bg-secondary px-1 rounded">npm run weekly-review</code> to generate.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
