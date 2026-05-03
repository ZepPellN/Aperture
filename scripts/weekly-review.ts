import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const WITNESS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'witness')
  : join(process.cwd(), 'witness');
const DAILY_DIR = join(WITNESS_DIR, 'daily');
const REVIEWS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'reviews', 'weekly')
  : join(process.cwd(), 'reviews', 'weekly');

interface DayData {
  date: string;
  mode: string;
  buildingLogs: Array<{
    project: string;
    time: string;
    what: string;
    blockers: string;
    tools: string;
  }>;
  ideas: string[];
  mood: {
    anxiety?: string;
    dominant?: string;
    drained?: string;
    energized?: string;
    grateful?: string;
  };
  tomorrowPriority: string[];
  workItems: string[];
}

function getWeekKey(dateStr: string): string {
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  const cleanDate = match ? match[1] : dateStr;
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return 'unknown';
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNum = Math.floor(diff / oneWeek) + 1;
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekRange(weekKey: string): { start: string; end: string } {
  const [year, wStr] = weekKey.split('-W');
  const weekNum = parseInt(wStr, 10);
  const start = new Date(parseInt(year, 10), 0, 1 + (weekNum - 1) * 7);
  // Adjust to Monday
  const dayOfWeek = start.getDay();
  const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function parseDiary(filePath: string, dateStr: string): DayData | null {
  const raw = readFileSync(filePath, 'utf-8');
  let parsed: { data: Record<string, any>; content: string };
  try {
    parsed = matter(raw);
  } catch {
    parsed = { data: {}, content: raw };
  }

  const content = parsed.content;

  // Extract building logs
  const buildingLogs: DayData['buildingLogs'] = [];
  const btMatches = content.matchAll(
    /### \d+\.\s+(.+?)\n- \*\*Project \/ Idea:\*\*\s*(.*?)\n- \*\*Time spent:\*\*\s*(.*?)\n- \*\*What was built \/ tried:\*\*\s*([\s\S]*?)(?=- \*\*Blockers|\n### |\n## |$)/g
  );
  for (const m of btMatches) {
    const blockersMatch = content.slice(m.index! + m[0].length).match(/- \*\*Blockers \/ stuck on:\*\*\s*(.*?)\n/);
    const toolsMatch = content.slice(m.index! + m[0].length).match(/- \*\*Tools used:\*\*\s*(.*?)\n/);
    buildingLogs.push({
      project: m[2]?.trim() || m[1]?.trim() || '',
      time: m[3]?.trim() || '',
      what: m[4]?.trim().replace(/\n\s+/g, ' ') || '',
      blockers: blockersMatch?.[1]?.trim() || '',
      tools: toolsMatch?.[1]?.trim() || '',
    });
  }

  // Fallback: simpler Building Time Log format
  if (buildingLogs.length === 0) {
    const simpleMatch = content.match(/## Building Time Log([\s\S]*?)(?=\n## |\n---$|$)/);
    if (simpleMatch) {
      const lines = simpleMatch[1].split('\n');
      let currentProject = '';
      let currentWhat = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- **Project') || trimmed.startsWith('**Project')) {
          if (currentProject) {
            buildingLogs.push({ project: currentProject, time: '', what: currentWhat, blockers: '', tools: '' });
          }
          currentProject = trimmed.replace(/.*Project.*:\*\*\s*/, '').trim();
          currentWhat = '';
        } else if (trimmed.startsWith('- ') && currentProject) {
          currentWhat += trimmed.slice(2) + ' ';
        }
      }
      if (currentProject) {
        buildingLogs.push({ project: currentProject, time: '', what: currentWhat.trim(), blockers: '', tools: '' });
      }
    }
  }

  // Extract ideas
  const ideas: string[] = [];
  const ideasMatch = content.match(/## Ideas Captured([\s\S]*?)(?=\n## |\n---$|$)/);
  if (ideasMatch) {
    const ideaLines = ideasMatch[1].split('\n');
    for (const line of ideaLines) {
      const trimmed = line.trim();
      if (/^\d+\.\s+/.test(trimmed)) {
        ideas.push(trimmed.replace(/^\d+\.\s+/, ''));
      }
    }
  }

  // Extract mood
  const mood: DayData['mood'] = {};
  const moodMatch = content.match(/## Mood & Reflection([\s\S]*?)(?=\n## |\n---$|$)/);
  if (moodMatch) {
    const m = moodMatch[1];
    const anxiety = m.match(/\*\*Anxiety level.*?\*\*\s*(.+)/);
    if (anxiety) mood.anxiety = anxiety[1].trim();
    const dominant = m.match(/\*\*Dominant emotion.*?\*\*\s*(.+)/);
    if (dominant) mood.dominant = dominant[1].trim();
    const drained = m.match(/\*\*What drained me.*?\*\*\s*(.+)/);
    if (drained) mood.drained = drained[1].trim();
    const energized = m.match(/\*\*What energized me.*?\*\*\s*(.+)/);
    if (energized) mood.energized = energized[1].trim();
    const grateful = m.match(/\*\*One thing I'm grateful for.*?\*\*\s*(.+)/);
    if (grateful) mood.grateful = grateful[1].trim();
  }

  // Extract tomorrow's priority
  const tomorrowPriority: string[] = [];
  const tpMatch = content.match(/## Tomorrow's Priority([\s\S]*?)(?=\n## |\n---$|$)/);
  if (tpMatch) {
    const tpLines = tpMatch[1].split('\n');
    for (const line of tpLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- **') && trimmed.includes(':**')) {
        tomorrowPriority.push(trimmed.replace(/^- \*\*/, '').replace(/\*\*:\s*/, ': ').trim());
      }
    }
  }

  // Extract work items
  const workItems: string[] = [];
  const workMatch = content.match(/## Work \(GRC \/ Harness\)([\s\S]*?)(?=\n## |\n---$|$)/);
  if (workMatch) {
    const workLines = workMatch[1].split('\n');
    for (const line of workLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('1. ') || trimmed.startsWith('2. ')) {
        workItems.push(trimmed.replace(/^[-\d\.]+\s+/, ''));
      }
    }
  }

  return {
    date: dateStr,
    mode: parsed.data.mode || 'normal',
    buildingLogs,
    ideas,
    mood,
    tomorrowPriority,
    workItems,
  };
}

function generateWeeklyReview(week: string, days: DayData[]): string {
  const range = getWeekRange(week);
  const now = new Date().toISOString().split('T')[0];

  // Stats
  const buildingDays = days.filter((d) => d.buildingLogs.length > 0).length;
  const totalIdeas = days.reduce((sum, d) => sum + d.ideas.length, 0);
  const modes = days.reduce(
    (acc, d) => {
      acc[d.mode] = (acc[d.mode] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Aggregate building projects
  const projectMap = new Map<string, string[]>();
  for (const d of days) {
    for (const log of d.buildingLogs) {
      if (!log.project) continue;
      const list = projectMap.get(log.project) || [];
      list.push(log.what);
      projectMap.set(log.project, list);
    }
  }

  // Mood aggregation
  const emotions = days.map((d) => d.mood.dominant).filter(Boolean);
  const energizers = days.map((d) => d.mood.energized).filter(Boolean);
  const drainers = days.map((d) => d.mood.drained).filter(Boolean);

  let md = `---
title: "Weekly Review — ${week}"
generated: ${now}
week: ${week}
period: ${range.start} ~ ${range.end}
---

# Weekly Review — ${week}

> Period: ${range.start} ~ ${range.end}
> Run \`npm run weekly-review\` to regenerate.

---

## 1. This Week in Numbers

| Metric | Value |
|--------|-------|
| Days logged | ${days.length} |
| Building days | ${buildingDays} |
| Ideas captured | ${totalIdeas} |
| Mode distribution | ${Object.entries(modes).map(([k, v]) => `${k} (${v}d)`).join(', ')} |

---

## 2. Builds This Week

`;

  if (projectMap.size === 0) {
    md += '_No building logs found this week._\n';
  } else {
    for (const [project, whats] of projectMap) {
      md += `### ${project}\n`;
      for (const w of whats) {
        const short = w.length > 200 ? w.slice(0, 200) + '...' : w;
        md += `- ${short}\n`;
      }
      md += '\n';
    }
  }

  md += `---

## 3. Ideas Captured

`;
  if (totalIdeas === 0) {
    md += '_No ideas captured this week._\n';
  } else {
    for (const d of days) {
      if (d.ideas.length === 0) continue;
      md += `**${d.date}**\n`;
      for (const idea of d.ideas) {
        md += `- ${idea}\n`;
      }
      md += '\n';
    }
  }

  md += `---

## 4. Mood & Energy

`;
  if (emotions.length === 0) {
    md += '_No mood data this week._\n';
  } else {
    md += `**Dominant emotions:** ${emotions.join(' → ')}\n\n`;
    if (energizers.length > 0) {
      md += `**What energized you:**\n`;
      for (const e of energizers) {
        md += `- ${e}\n`;
      }
      md += '\n';
    }
    if (drainers.length > 0) {
      md += `**What drained you:**\n`;
      for (const d of drainers) {
        md += `- ${d}\n`;
      }
      md += '\n';
    }
  }

  md += `---

## 5. Tomorrow's Priorities (Roll-up)

> Tasks that were set as "next day" but may not have been completed.

`;
  let hasPriorities = false;
  for (const d of days) {
    if (d.tomorrowPriority.length === 0) continue;
    hasPriorities = true;
    md += `**${d.date}**\n`;
    for (const p of d.tomorrowPriority) {
      md += `- ${p}\n`;
    }
    md += '\n';
  }
  if (!hasPriorities) {
    md += '_No priorities recorded._\n';
  }

  md += `---

## 6. AI Analysis Prompt

Copy the following to your AI assistant for deeper analysis:

\`\`\`markdown
I have ${days.length} days of journal entries for week ${week}. Please analyze:

1. How my energy and focus varied across the week
2. Patterns in what I chose to build vs what I planned to build
3. Which ideas are worth turning into experiments or articles
4. A concise summary of my week and one suggestion for next week

Build logs:
${Array.from(projectMap.entries()).map(([p, w]) => `- ${p}: ${w.length} sessions`).join('\n')}

Ideas (${totalIdeas} total):
${days.flatMap((d) => d.ideas.map((i) => `- ${i}`)).slice(0, 10).join('\n')}
\`\`\`

---
_Tags: #weekly #review #auto-generated_
`;

  return md;
}

function main() {
  if (!existsSync(DAILY_DIR)) {
    console.warn(`[weekly] Daily directory not found: ${DAILY_DIR}, skipping.`);
    return;
  }

  const files = readdirSync(DAILY_DIR)
    .filter((f) => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f))
    .sort();

  console.log(`[weekly] Found ${files.length} diary files`);

  const daysByWeek: Record<string, DayData[]> = {};

  for (const file of files) {
    const dateStr = file.replace('.md', '');
    const filePath = join(DAILY_DIR, file);
    const day = parseDiary(filePath, dateStr);
    if (!day) continue;

    const week = getWeekKey(dateStr);
    if (week === 'unknown') continue;
    daysByWeek[week] = daysByWeek[week] || [];
    daysByWeek[week].push(day);
  }

  if (!existsSync(REVIEWS_DIR)) mkdirSync(REVIEWS_DIR, { recursive: true });

  for (const [week, days] of Object.entries(daysByWeek)) {
    const md = generateWeeklyReview(week, days);
    const outputPath = join(REVIEWS_DIR, `${week}.md`);
    writeFileSync(outputPath, md);
    console.log(`[weekly] Wrote ${outputPath} (${days.length} days)`);
  }

  console.log(`[weekly] Done. Generated ${Object.keys(daysByWeek).length} weekly reviews.`);
}

main();
