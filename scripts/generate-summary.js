/**
 * Generate a summary of the exchange rate fetch run.
 * Reads metrics from data/run-report.json (written by fetch-rates.js),
 * writes a markdown Job Summary to $GITHUB_STEP_SUMMARY, and
 * commits an updated rate-summary.json with real values.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(path.dirname(__dirname), "data");

async function generateSummary() {
  const finishedAt = new Date().toISOString();
  const startedAt = process.env.JOB_START_TIME || null;

  // Read the run report written by fetch-rates.js
  let report = null;
  try {
    const raw = await fs.readFile(path.join(dataDir, "run-report.json"), "utf8");
    report = JSON.parse(raw);
  } catch {
    // fetch-rates.js didn't run or failed before writing the report
  }

  const status = report?.error ? "error" : report?.skipped ? "skipped" : report ? "success" : "unknown";

  // Write rate-summary.json with real values
  const summary = {
    generated_at: finishedAt,
    started_at: startedAt,
    date: report?.source_date ?? new Date().toISOString().split("T")[0],
    status,
    skipped: report?.skipped ?? false,
    skipped_reason: report?.skipped_reason ?? null,
    error: report?.error ?? null,
    rates_fetched: report?.rates_fetched ?? null,
    base_currencies_processed: report?.base_currencies_processed ?? null,
    base_currencies_total: report?.base_currencies_total ?? null,
    base_currencies_failed: report?.base_currencies_failed ?? [],
    api_source: "frankfurter.app",
    next_fetch: getNextFetchTime(),
  };

  await fs.mkdir(dataDir, { recursive: true });

  const summaryPath = path.join(dataDir, "rate-summary.json");
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Summary written: ${summaryPath}`);

  // Write status.json
  const statusPath = path.join(dataDir, "status.json");
  await fs.writeFile(statusPath, JSON.stringify({
    last_update: summary.date,
    status: status === "success" ? "online" : status,
    rates_available: status === "success" || status === "skipped",
    next_update: summary.next_fetch,
  }, null, 2));
  console.log(`✅ Status file updated: ${statusPath}`);

  // Write GitHub Actions Job Summary
  await writeJobSummary({ summary, startedAt, finishedAt });
}

async function writeJobSummary({ summary, startedAt, finishedAt }) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return; // Not running in GitHub Actions

  const statusEmoji = { success: "✅", skipped: "⏭️", error: "❌", unknown: "❓" }[summary.status] ?? "❓";

  const duration = startedAt && finishedAt
    ? formatDuration(new Date(finishedAt) - new Date(startedAt))
    : "—";

  const failedList = summary.base_currencies_failed?.length
    ? summary.base_currencies_failed.join(", ")
    : "none";

  const rows = [
    ["Status", `${statusEmoji} ${summary.status}`],
    ["Started", startedAt ?? "—"],
    ["Finished", finishedAt],
    ["Duration", duration],
    ["Source date", summary.date],
    ["Rate pairs added", summary.rates_fetched?.toLocaleString() ?? (summary.skipped ? "skipped" : "—")],
    ["Base currencies processed", summary.base_currencies_total
      ? `${summary.base_currencies_processed} / ${summary.base_currencies_total}`
      : (summary.skipped ? "skipped" : "—")],
    ["Failed currencies", failedList],
  ];

  if (summary.skipped_reason) {
    rows.push(["Skip reason", summary.skipped_reason]);
  }
  if (summary.error) {
    rows.push(["Error", `\`${summary.error}\``]);
  }

  const tableRows = rows.map(([k, v]) => `| **${k}** | ${v} |`).join("\n");

  const markdown = `## Exchange Rate Fetch Report\n\n| Field | Value |\n|-------|-------|\n${tableRows}\n`;

  await fs.appendFile(summaryFile, markdown);
  console.log("✅ Job summary written");
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function getNextFetchTime() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  // Skip to Monday if tomorrow is Saturday (6) or Sunday (0)
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  next.setUTCHours(16, 0, 0, 0);
  return next.toISOString();
}

generateSummary().catch((error) => {
  console.error("❌ Failed to generate summary:", error);
  process.exit(1);
});

export { generateSummary };
