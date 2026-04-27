#!/bin/bash
set -e

# Wiki Observe — daily pipeline to scan raw/, ingest into wiki, rebuild semantic layout
# Triggered by cron daily at 00:12 CST

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/Users/jean"

APERTURE_DIR="/Users/jean/Documents/AI/project/aperture"
LOG_FILE="/tmp/wiki-observe.log"

cd "$APERTURE_DIR"

echo "=== [wiki-observe] $(date '+%Y-%m-%d %H:%M:%S') Starting ===" | tee -a "$LOG_FILE"

# Step 1: Refresh QMD index for the Obsidian vault
echo "[wiki-observe] Step 1/4: qmd update..." | tee -a "$LOG_FILE"
qmd update 2>&1 | tee -a "$LOG_FILE"

echo "[wiki-observe] Step 2/4: qmd embed -f..." | tee -a "$LOG_FILE"
qmd embed -f 2>&1 | tee -a "$LOG_FILE"

# Step 2: Run wiki-absorb via Claude Code (processes raw/ → wiki/)
echo "[wiki-observe] Step 3/4: /wiki-absorb..." | tee -a "$LOG_FILE"
claude -p "/wiki-absorb" --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"

# Step 3: Rebuild semantic layout from updated QMD
echo "[wiki-observe] Step 4/4: npm run build:semantic..." | tee -a "$LOG_FILE"
npm run build:semantic 2>&1 | tee -a "$LOG_FILE"

echo "=== [wiki-observe] $(date '+%Y-%m-%d %H:%M:%S') Done ===" | tee -a "$LOG_FILE"
