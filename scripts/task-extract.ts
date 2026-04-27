import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const WITNESS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'witness')
  : join(process.cwd(), 'witness');
const DAILY_DIR = join(WITNESS_DIR, 'daily');
const TASKS_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'tasks')
  : join(process.cwd(), 'tasks');

interface TaskItem {
  text: string;
  done: boolean;
  source: string;
  date: string;
}

function getWeekKey(dateStr: string): string {
  // Handle filenames like "2026-04-14-15.md" → extract first date
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  const cleanDate = match ? match[1] : dateStr;
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) {
    console.warn(`[tasks] Invalid date: ${dateStr}, skipping`);
    return 'unknown';
  }
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNum = Math.floor(diff / oneWeek) + 1;
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function extractTasksFromDiary(filePath: string, dateStr: string): TaskItem[] {
  const raw = readFileSync(filePath, 'utf-8');
  const tasks: TaskItem[] = [];
  const lines = raw.split('\n');

  // 1. Extract checklist items (- [ ] or - [x])
  for (const line of lines) {
    const match = line.match(/^- \[(.)\]\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      // Skip tag lines like "- [ ] Tags: #daily #witness"
      if (text.startsWith('Tags:')) continue;
      tasks.push({
        text,
        done: match[1].toLowerCase() === 'x',
        source: dateStr,
        date: dateStr,
      });
    }
  }

  // 2. Extract "Tomorrow's Priority" section as implicit tasks
  const tpMatch = raw.match(/## Tomorrow's Priority([\s\S]*?)(?=\n## |\n---$|$)/);
  if (tpMatch) {
    const tpLines = tpMatch[1].split('\n');
    for (const line of tpLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- **') && trimmed.includes(':**')) {
        const text = trimmed.replace(/^- \*\*/, '').replace(/\*\*:\s*/, ': ').trim();
        if (text) {
          tasks.push({
            text: `【明日优先】${text}`,
            done: false,
            source: dateStr,
            date: dateStr,
          });
        }
      }
    }
  }

  // 3. Extract "明日构建计划" from older entries
  const buildMatch = raw.match(/## 明日构建计划([\s\S]*?)(?=\n## |\n---$|$)/);
  if (buildMatch) {
    const buildLines = buildMatch[1].split('\n');
    for (const line of buildLines) {
      const trimmed = line.trim();
      if (/^\d+\.\s+/.test(trimmed)) {
        const text = trimmed.replace(/^\d+\.\s+/, '').trim();
        if (text) {
          tasks.push({
            text: `【构建计划】${text}`,
            done: false,
            source: dateStr,
            date: dateStr,
          });
        }
      }
    }
  }

  return tasks;
}

function generateWeeklyTaskFile(week: string, tasks: TaskItem[]): string {
  const completed = tasks.filter((t) => t.done);
  const pending = tasks.filter((t) => !t.done && !t.text.startsWith('[DROPPED]'));
  const dropped = tasks.filter((t) => !t.done && t.text.startsWith('[DROPPED]'));
  const now = new Date().toISOString().split('T')[0];

  let md = `---
title: "Tasks — ${week}"
generated: ${now}
week: ${week}
---

# Tasks — ${week}

> Auto-generated from daily journals. Manual status preserved across runs.

## Pending (${pending.length})

`;

  for (const t of pending) {
    md += `- [ ] ${t.text}  *(from ${t.source})*\n`;
  }

  md += `\n## Completed (${completed.length})\n\n`;

  for (const t of completed) {
    md += `- [x] ~~${t.text}~~  *(from ${t.source})*\n`;
  }

  if (dropped.length > 0) {
    md += `\n## Dropped (${dropped.length})\n\n`;
    for (const t of dropped) {
      md += `- [x] ~~${t.text.replace('[DROPPED] ', '')}~~  *(from ${t.source})* → 决定放弃\n`;
    }
  }

  md += `\n---\n_Tags: #tasks #weekly_\n`;
  return md;
}

function loadExistingStatus(filePath: string): Map<string, { done: boolean; dropped: boolean }> {
  const status = new Map<string, { done: boolean; dropped: boolean }>();
  if (!existsSync(filePath)) return status;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n');
    let inDropped = false;
    for (const line of lines) {
      if (line.startsWith('## Dropped')) { inDropped = true; continue; }
      if (line.startsWith('## Completed')) { inDropped = false; continue; }
      if (line.startsWith('## Pending')) { inDropped = false; continue; }

      const doneMatch = line.match(/^- \[x\]\s+~~(.+?)~~\s+\*\(from/);
      if (doneMatch) {
        const text = doneMatch[1].trim();
        status.set(text, { done: true, dropped: inDropped || line.includes('决定放弃') });
      }
    }
  } catch { /* ignore parse errors */ }

  return status;
}

function mergeWithExisting(newTasks: TaskItem[], existingFilePath: string): TaskItem[] {
  const existing = loadExistingStatus(existingFilePath);
  if (existing.size === 0) return newTasks;

  for (const task of newTasks) {
    // Normalize key for matching
    const key = task.text
      .replace(/【.+?】/, '')
      .replace(/\*\*/g, '')
      .trim();
    // Try to find matching existing task
    for (const [existingText, status] of existing) {
      const existingKey = existingText
        .replace(/【.+?】/, '')
        .replace(/\*\*/g, '')
        .replace('[DROPPED] ', '')
        .trim();
      if (key === existingKey || existingKey.includes(key.slice(0, 30)) || key.includes(existingKey.slice(0, 30))) {
        if (status.dropped) {
          task.done = false;
          task.text = '[DROPPED] ' + task.text.replace('[DROPPED] ', '');
        } else {
          task.done = status.done;
        }
        break;
      }
    }
  }

  return newTasks;
}

function main() {
  if (!existsSync(DAILY_DIR)) {
    console.error(`[tasks] Daily directory not found: ${DAILY_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(DAILY_DIR)
    .filter((f) => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f))
    .sort();

  console.log(`[tasks] Found ${files.length} diary files in ${DAILY_DIR}`);

  const tasksByWeek: Record<string, TaskItem[]> = {};

  for (const file of files) {
    const dateStr = file.replace('.md', '');
    const filePath = join(DAILY_DIR, file);
    const tasks = extractTasksFromDiary(filePath, dateStr);
    if (tasks.length === 0) continue;

    const week = getWeekKey(dateStr);
    tasksByWeek[week] = tasksByWeek[week] || [];
    tasksByWeek[week].push(...tasks);
  }

  // Deduplicate by text within each week (keep latest)
  for (const week of Object.keys(tasksByWeek)) {
    const seen = new Map<string, TaskItem>();
    for (const t of tasksByWeek[week]) {
      const key = t.text.replace(/【.+?】/, '').trim();
      const existing = seen.get(key);
      if (!existing || t.date > existing.date) {
        seen.set(key, t);
      }
    }
    tasksByWeek[week] = Array.from(seen.values());
  }

  if (!existsSync(TASKS_DIR)) mkdirSync(TASKS_DIR, { recursive: true });
  const weeklyDir = join(TASKS_DIR, 'weekly');
  if (!existsSync(weeklyDir)) mkdirSync(weeklyDir, { recursive: true });

  for (const [week, tasks] of Object.entries(tasksByWeek)) {
    const outputPath = join(weeklyDir, `${week}.md`);
    // Merge with existing file to preserve manual status updates
    const merged = mergeWithExisting(tasks, outputPath);
    const md = generateWeeklyTaskFile(week, merged);
    writeFileSync(outputPath, md);
    const completed = merged.filter((t) => t.done).length;
    const dropped = merged.filter((t) => !t.done && t.text.startsWith('[DROPPED]')).length;
    console.log(`[tasks] Wrote ${outputPath} (${merged.length} tasks, ${completed} done${dropped > 0 ? `, ${dropped} dropped` : ''})`);
  }

  console.log(`[tasks] Done. Processed ${files.length} diaries across ${Object.keys(tasksByWeek).length} weeks.`);
}

main();
