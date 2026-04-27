import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const WITNESS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'witness')
  : join(process.cwd(), 'witness');

const REVIEWS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'reviews', 'weekly')
  : join(process.cwd(), 'reviews', 'weekly');

const TASKS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'tasks', 'weekly')
  : join(process.cwd(), 'tasks', 'weekly');

const DAILY_DIR = join(WITNESS_DIR, 'daily');

const NON_DOMAINS = new Set(['Daily Journal', 'Templates', 'Core Documents']);

export interface LifeArea {
  name: string;
  slug: string;
  description?: string;
  docs?: { name: string; path: string }[];
}

export interface GoalItem {
  domain: string;
  title: string;
  text: string;
  plan?: string;
  target?: string;
}

export interface WeeklyReviewSummary {
  week: string;
  period: string;
  daysLogged: number;
  buildingDays: number;
  ideasCount: number;
  contentHtml?: string;
}

export interface TaskItem {
  text: string;
  done: boolean;
  source: string;
}

export interface TaskSummary {
  week: string;
  pendingCount: number;
  completedCount: number;
  items?: TaskItem[];
}

export interface RecentDiary {
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
  stuckOn?: string[];
}

export interface WeeklyIntent {
  week: string;
  stop?: string[];
  start?: string[];
  forgive?: string[];
  selfCare?: string[];
  contentHtml?: string;
}

export interface LifeDashboardData {
  areas: LifeArea[];
  goals: GoalItem[];
  recentReviews: WeeklyReviewSummary[];
  recentTasks: TaskSummary[];
  recentDiaries: RecentDiary[];
  habitTracker: string;
  currentWeek: string;
  weeklyIntent?: WeeklyIntent;
}

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNum = Math.floor(diff / oneWeek) + 1;
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function loadMarkdown(path: string): { data: Record<string, any>; content: string } | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    return matter(raw);
  } catch {
    return null;
  }
}

async function markdownToHtml(content: string): Promise<string> {
  const stripped = content.replace(/^---[\s\S]*?---\n*/, '');
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(stripped);
  return String(result);
}

function parseGoals(content: string): GoalItem[] {
  const goals: GoalItem[] = [];
  const sections = content.split(/^## /m);

  for (const section of sections) {
    const domainMatch = section.match(/^(.*?)\n/);
    if (!domainMatch) continue;
    const domain = domainMatch[1].trim();
    if (domain === 'Goals' || domain === 'Daily Rituals') continue;

    const goalBlocks = section.split(/^### /m).slice(1);

    for (const block of goalBlocks) {
      const lines = block.split('\n');
      const titleLine = lines[0]?.trim() || '';

      const goalLineMatch = block.match(/- \*\*Goal:\*\*\s*(.+?)(?:\n|$)/);
      const planMatch = block.match(/- \*\*Plan:\*\*\s*([\s\S]*?)(?=\n- \*\*|$)/);
      const targetMatch = block.match(/- \*\*Start target:\*\*\s*(.+?)(?:\n|$)/);
      const successMatch = block.match(/\*\*Success by[^*]*:\*\*\s*([\s\S]*?)(?=\n## |\n### |\n---|$)/);

      let text = '';
      if (goalLineMatch) {
        text = goalLineMatch[1].trim();
      } else {
        const firstPara: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line === '' || line.startsWith('- ') || line.startsWith('## ') || line.startsWith('### ')) break;
          firstPara.push(line);
        }
        text = firstPara.join(' ').trim();
        if (!text) text = titleLine;
      }

      const plan = planMatch ? planMatch[1].trim().replace(/\n\s+/g, ' ') : '';
      const target = (targetMatch ? targetMatch[1].trim() : '') || (successMatch ? successMatch[1].trim() : '');

      goals.push({
        domain,
        title: titleLine,
        text,
        plan: plan || undefined,
        target: target || undefined,
      });
    }
  }
  return goals;
}

function parseLifeAreas(content: string): LifeArea[] {
  const areas: LifeArea[] = [];
  const domainMatch = content.match(/## Domains([\s\S]*?)(?=## |---$|$)/);
  if (domainMatch) {
    const lines = domainMatch[1].split('\n');
    let currentArea: LifeArea | null = null;

    for (const line of lines) {
      const areaMatch = line.match(/^### ([\w\s&]+)\s*$/);
      if (areaMatch) {
        const name = areaMatch[1].trim();
        if (NON_DOMAINS.has(name)) {
          if (currentArea) areas.push(currentArea);
          currentArea = null;
          continue;
        }
        if (currentArea) areas.push(currentArea);
        currentArea = { name, slug: name.toLowerCase().replace(/\s+/g, '-'), docs: [] };
        continue;
      }
      const docMatch = line.match(/^- \[\[([^\]]+)\]\]/);
      if (docMatch && currentArea) {
        currentArea.docs!.push({ name: docMatch[1].split('/').pop() || docMatch[1], path: docMatch[1] });
      }
    }
    if (currentArea) areas.push(currentArea);
  }

  if (areas.length === 0) {
    return [
      { name: 'Health', slug: 'health' },
      { name: 'Career & Learning', slug: 'career' },
      { name: 'Photography', slug: 'photography' },
      { name: 'Travel', slug: 'travel' },
      { name: 'Reading', slug: 'reading' },
    ];
  }
  return areas;
}

async function parseReviewSummary(filePath: string): Promise<WeeklyReviewSummary | null> {
  const parsed = loadMarkdown(filePath);
  if (!parsed) return null;
  const week = parsed.data.week || '';
  const period = parsed.data.period || '';

  const daysMatch = parsed.content.match(/Days logged\s*\|\s*(\d+)/);
  const buildingMatch = parsed.content.match(/Building days\s*\|\s*(\d+)/);
  const ideasMatch = parsed.content.match(/Ideas captured\s*\|\s*(\d+)/);

  const contentHtml = await markdownToHtml(parsed.content);

  return {
    week,
    period,
    daysLogged: parseInt(daysMatch?.[1] || '0', 10),
    buildingDays: parseInt(buildingMatch?.[1] || '0', 10),
    ideasCount: parseInt(ideasMatch?.[1] || '0', 10),
    contentHtml,
  };
}

function parseTaskItems(content: string): TaskItem[] {
  const items: TaskItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const pendingMatch = line.match(/^- \[ \]\s+(.+?)\s+\*\(from\s+(.+)\)\*$/);
    if (pendingMatch) {
      items.push({ text: pendingMatch[1].trim(), done: false, source: pendingMatch[2].trim() });
      continue;
    }
    const completedMatch = line.match(/^- \[x\]\s+~~(.+?)~~\s+\*\(from\s+(.+)\)\*$/);
    if (completedMatch) {
      items.push({ text: completedMatch[1].trim(), done: true, source: completedMatch[2].trim() });
      continue;
    }
    const loosePending = line.match(/^- \[ \]\s+(.+)$/);
    if (loosePending && !loosePending[1].startsWith('Tags:')) {
      items.push({ text: loosePending[1].trim(), done: false, source: '' });
      continue;
    }
    const looseCompleted = line.match(/^- \[x\]\s+~~(.+)~~$/);
    if (looseCompleted) {
      items.push({ text: looseCompleted[1].trim(), done: true, source: '' });
    }
  }

  return items;
}

function parseTaskSummary(filePath: string): TaskSummary | null {
  const parsed = loadMarkdown(filePath);
  if (!parsed) return null;
  const week = parsed.data.week || '';
  const pendingMatch = parsed.content.match(/## Pending \((\d+)\)/);
  const completedMatch = parsed.content.match(/## Completed \((\d+)\)/);
  return {
    week,
    pendingCount: parseInt(pendingMatch?.[1] || '0', 10),
    completedCount: parseInt(completedMatch?.[1] || '0', 10),
    items: parseTaskItems(parsed.content),
  };
}

async function parseRecentDiary(filePath: string): Promise<RecentDiary | null> {
  const parsed = loadMarkdown(filePath);
  if (!parsed) return null;
  const date = parsed.data.updated || parsed.data.date || '';
  const mode = parsed.data.mode || 'normal';

  const content = parsed.content;
  const emotionMatch = content.match(/\*\*Dominant emotion:\*\*\s*(.+)/);
  const buildMatch = content.match(/\*\*One build target:\*\*\s*(.+)/);

  // Count ideas
  const ideasSection = content.match(/## Ideas Captured([\s\S]*?)(?=\n## |\n---$|$)/);
  const ideasCount = ideasSection ? (ideasSection[1].match(/^\d+\.\s+/gm) || []).length : 0;

  // Count building logs
  const buildingSection = content.match(/## Building Time Log([\s\S]*?)(?=\n## |\n---$|$)/);
  const buildingCount = buildingSection ? (buildingSection[1].match(/^### \d+\./gm) || []).length : 0;

  // Energy level — try explicit Level field first, then anxiety as rough proxy
  const energyMatch = content.match(/\*\*Level:\*\*\s*(\d+)/);
  const anxietyMatch = content.match(/\*\*Anxiety level \(1-10\):\*\*\s*(\d+)/);
  let energyLevel: number | undefined;
  if (energyMatch) {
    energyLevel = parseInt(energyMatch[1], 10);
  } else if (anxietyMatch) {
    // Invert anxiety loosely: 10 anxiety ≈ 3 energy, 1 anxiety ≈ 8 energy
    const anxiety = parseInt(anxietyMatch[1], 10);
    energyLevel = Math.max(1, Math.min(10, Math.round(11 - anxiety)));
  }

  // Habits — parse from Sleep & Body section (actual diary format)
  const habits: Record<string, boolean> = {};
  const sleepBodyMatch = content.match(/## Sleep & Body([\s\S]*?)(?=\n## |\n---$|$)/);
  if (sleepBodyMatch) {
    const section = sleepBodyMatch[1];
    const exerciseMatch = section.match(/\*\*Exercise:\*\*\s*(.+)/);
    if (exerciseMatch) {
      const val = exerciseMatch[1].trim();
      habits['Exercise'] = !(val.includes('无') || val.includes('暂无') || val.includes('没'));
    }
    const mealsMatch = section.match(/\*\*Meals[^*]*:\*\*\s*(.+)/);
    if (mealsMatch) {
      const val = mealsMatch[1].trim();
      habits['Meals'] = !val.includes('没做饭');
    }
    const sleepMatch = section.match(/\*\*(?:Sleep|Bedtime):\*\*\s*(.+)/);
    if (sleepMatch) {
      const val = sleepMatch[1].trim();
      habits['Sleep'] = val !== '—' && val !== '' && val !== '-' && !val.includes('未');
    }
  }
  // Supplements tracked under ### 营养补剂
  const supplementMatch = content.match(/### 营养补剂([\s\S]*?)(?=\n### |\n## |\n---$|$)/);
  if (supplementMatch) {
    const val = supplementMatch[1].trim();
    habits['Supplements'] = !(val.includes('未吃') || val.includes('没吃') || val.includes('忘了') || val.includes('暂无'));
  }

  // Questions / Stuck On / Tomorrow's Priorities — inferred from plan sections
  const questions: string[] = [];
  const qSection = content.match(/## Questions \/ Stuck On([\s\S]*?)(?=\n## |\n---$|$)/);
  if (qSection) {
    const qLines = qSection[1].split('\n');
    for (const line of qLines) {
      const trimmed = line.trim();
      if (/^\d+\.\s+/.test(trimmed)) {
        questions.push(trimmed.replace(/^\d+\.\s+/, ''));
      }
    }
  }
  // Also pull from Tomorrow's Priority / 明天工作计划 / 明日构建计划
  const planSections = [
    content.match(/## Tomorrow's Priority([\s\S]*?)(?=\n## |\n---$|$)/),
    content.match(/### 明天工作计划([\s\S]*?)(?=\n### |\n## |\n---$|$)/),
    content.match(/### 明日构建计划([\s\S]*?)(?=\n### |\n## |\n---$|$)/),
    content.match(/### 明日优先([\s\S]*?)(?=\n### |\n## |\n---$|$)/),
  ];
  for (const match of planSections) {
    if (!match) continue;
    const lines = match[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+\.\s+/.test(trimmed) || trimmed.startsWith('- ')) {
        const cleaned = trimmed
          .replace(/^\d+\.\s+/, '')
          .replace(/^-\s+/, '')
          .replace(/\*\*/g, '')
          .trim();
        if (cleaned && !questions.includes(cleaned)) questions.push(cleaned);
      }
    }
  }

  // Render diary content to HTML
  const contentHtml = await markdownToHtml(parsed.content);

  return {
    date,
    mode,
    dominantEmotion: emotionMatch?.[1]?.trim(),
    buildTarget: buildMatch?.[1]?.trim(),
    contentHtml,
    ideasCount,
    buildingCount,
    energyLevel,
    habits: Object.keys(habits).length > 0 ? habits : undefined,
    questions: questions.length > 0 ? questions : undefined,
  };
}

export async function loadLifeDashboard(): Promise<LifeDashboardData> {
  const goalsFile = join(WITNESS_DIR, '2026-goals.md');
  const goalsParsed = loadMarkdown(goalsFile);
  const goals = goalsParsed ? parseGoals(goalsParsed.content) : [];

  const areasFile = join(WITNESS_DIR, 'life-areas.md');
  const areasParsed = loadMarkdown(areasFile);
  const areas = areasParsed ? parseLifeAreas(areasParsed.content) : [];

  const recentReviews: WeeklyReviewSummary[] = [];
  if (existsSync(REVIEWS_DIR)) {
    const reviewFiles = readdirSync(REVIEWS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 4);
    for (const f of reviewFiles) {
      const summary = await parseReviewSummary(join(REVIEWS_DIR, f));
      if (summary) recentReviews.push(summary);
    }
  }

  const recentTasks: TaskSummary[] = [];
  if (existsSync(TASKS_DIR)) {
    const taskFiles = readdirSync(TASKS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 4);
    for (const f of taskFiles) {
      const summary = parseTaskSummary(join(TASKS_DIR, f));
      if (summary) recentTasks.push(summary);
    }
  }

  const recentDiaries: RecentDiary[] = [];
  if (existsSync(DAILY_DIR)) {
    const diaryFiles = readdirSync(DAILY_DIR)
      .filter((f) => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f))
      .sort()
      .reverse()
      .slice(0, 7);
    for (const f of diaryFiles) {
      const diary = await parseRecentDiary(join(DAILY_DIR, f));
      if (diary) recentDiaries.push(diary);
    }
  }

  const routinesFile = join(WITNESS_DIR, 'routines.md');
  const routinesParsed = loadMarkdown(routinesFile);
  const habitTracker = routinesParsed?.content
    ? await markdownToHtml(routinesParsed.content)
    : '';

  // Load weekly intent
  const intentFile = join(WITNESS_DIR, 'intents', `${getCurrentWeek()}.md`);
  const intentParsed = loadMarkdown(intentFile);
  let weeklyIntent: WeeklyIntent | undefined;
  if (intentParsed) {
    const ic = intentParsed.content;
    const stopMatch = ic.match(/##\s*1?\.?\s*STOP([\s\S]*?)(?=##\s*2?\.?\s*START|##\s*2|##\s*FORGIVE|##\s*SELF|$)/i);
    const startMatch = ic.match(/##\s*2?\.?\s*START([\s\S]*?)(?=##\s*3?\.?\s*FORGIVE|##\s*3|##\s*STOP|##\s*SELF|$)/i);
    const forgiveMatch = ic.match(/##\s*3?\.?\s*FORGIVE([\s\S]*?)(?=##\s*4?\.?\s*SELF|##\s*4|##\s*STOP|##\s*START|$)/i);
    const selfCareMatch = ic.match(/##\s*4?\.?\s*SELF[\s\S]*?CARE([\s\S]*?)(?=##|$)/i);
    const extractList = (m: RegExpMatchArray | null) => {
      if (!m) return undefined;
      return m[1].split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
    };
    weeklyIntent = {
      week: intentParsed.data.week || getCurrentWeek(),
      stop: extractList(stopMatch),
      start: extractList(startMatch),
      forgive: extractList(forgiveMatch),
      selfCare: extractList(selfCareMatch),
      contentHtml: await markdownToHtml(ic),
    };
  }

  return {
    areas,
    goals,
    recentReviews,
    recentTasks,
    recentDiaries,
    habitTracker,
    currentWeek: getCurrentWeek(),
    weeklyIntent,
  };
}
