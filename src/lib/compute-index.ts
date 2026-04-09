import { DEMO_TRANSACTIONS } from "./demo-data";
import type { Transaction } from "@/types/database";
import type { BrineNewsletterData, GradeIndex, DealSpotlight } from "./newsletter-mock-data";

const GRADE_ORDER: Record<string, number> = {
  "Frac-Ready": 0,
  Secondary: 1,
  Basic: 2,
};

/** BRINE launch date — issue 1, week 1 */
const LAUNCH_DATE = getLaunchMonday();

function getLaunchMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  thisMonday.setHours(0, 0, 0, 0);
  // 52 weeks ago
  const launch = new Date(thisMonday);
  launch.setDate(thisMonday.getDate() - 52 * 7);
  return launch;
}

function getMondayForOffset(weekOffset: number): Date {
  const now = new Date();
  const day = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  thisMonday.setHours(0, 0, 0, 0);
  const target = new Date(thisMonday);
  target.setDate(thisMonday.getDate() + weekOffset * 7);
  return target;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getIssueNumber(monday: Date): number {
  const weeksSinceLaunch = Math.round(
    (monday.getTime() - LAUNCH_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  // ~2 issues per week (Tue + Fri)
  return Math.max(1, Math.floor(weeksSinceLaunch * 2));
}

/**
 * Compute the BRINE price index for a given week.
 * @param weekOffset 0 = current week, -1 = last week, -2 = two weeks ago, etc.
 */
export function computeBrineIndex(weekOffset: number = 0): BrineNewsletterData {
  const monday = getMondayForOffset(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const ws = formatDate(monday);
  const we = formatDate(sunday);

  // Prior week for delta
  const priorMonday = new Date(monday);
  priorMonday.setDate(monday.getDate() - 7);
  const priorWs = formatDate(priorMonday);

  // Current week transactions: Verified or Published with start date in [ws, we]
  const currentTxs = DEMO_TRANSACTIONS.filter(
    (t) =>
      (t.status === "Verified" || t.status === "Published") &&
      t.transaction_date_start === ws
  );

  // Prior week transactions for delta
  const priorTxs = DEMO_TRANSACTIONS.filter(
    (t) =>
      (t.status === "Verified" || t.status === "Published") &&
      t.transaction_date_start === priorWs
  );

  // Build prior VWAP lookup
  const priorGroups = groupTransactions(priorTxs);
  const priorVwapMap = new Map<string, number>();
  priorGroups.forEach((txs, key) => {
    priorVwapMap.set(key, calcVwap(txs));
  });

  // Build current week index rows
  const currentGroups = groupTransactions(currentTxs);
  const indexRows: GradeIndex[] = [];

  currentGroups.forEach((txs, key) => {
    const [basin, grade] = key.split("::");
    const vwap = calcVwap(txs);
    const totalVolume = txs.reduce((s, t) => s + t.volume_bbl_per_day, 0);
    const reporters = new Set(txs.map((t) => t.seller_name)).size;
    const thin = reporters < 3 || totalVolume < 10000;

    const priorVwap = priorVwapMap.get(key) ?? null;
    const delta = priorVwap !== null ? round4(vwap - priorVwap) : null;

    indexRows.push({
      basin,
      grade: grade as GradeIndex["grade"],
      vwap: thin ? null : round4(vwap),
      delta: thin ? null : delta,
      volume_bbl_per_day: thin ? null : totalVolume,
      reporter_count: reporters,
      thin,
    });
  });

  // Sort: basin alpha, then Frac-Ready → Secondary → Basic
  indexRows.sort((a, b) => {
    const basinCmp = a.basin.localeCompare(b.basin);
    if (basinCmp !== 0) return basinCmp;
    return (GRADE_ORDER[a.grade] ?? 9) - (GRADE_ORDER[b.grade] ?? 9);
  });

  // Deal spotlight: top 2 by volume
  const deals: DealSpotlight[] = [...currentTxs]
    .sort((a, b) => b.volume_bbl_per_day - a.volume_bbl_per_day)
    .slice(0, 2)
    .map((t) => ({
      price_per_bbl: t.price_per_bbl,
      grade: t.water_grade,
      basin: t.basin,
      volume_bbl_per_day: t.volume_bbl_per_day,
      week_of: t.transaction_date_start,
    }));

  const issueNumber = getIssueNumber(monday);
  const publishDate = sunday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const result = {
    issue_number: issueNumber,
    publish_date: publishDate,
    week_start: ws,
    week_end: we,
    index_rows: indexRows,
    deals,
  };

  // Debug: print index summary to console
  console.table(
    result.index_rows.map((r) => ({
      basin: r.basin,
      grade: r.grade,
      reporters: r.reporter_count,
      vwap: r.vwap,
      thin: r.thin,
      volume: r.volume_bbl_per_day,
    }))
  );

  return result;
}

/** Historical weekly index for charting — returns one snapshot per week. */
export type WeeklyIndexPoint = {
  weekStart: string;
  weekLabel: string;
  permianFracReady: number | null;
  delawareFracReady: number | null;
  djFracReady: number | null;
};

export function computeHistoricalIndex(): WeeklyIndexPoint[] {
  const points: WeeklyIndexPoint[] = [];

  // Go back 52 weeks, compute index for each
  for (let offset = -51; offset <= 0; offset++) {
    const monday = getMondayForOffset(offset);
    const ws = formatDate(monday);

    const txs = DEMO_TRANSACTIONS.filter(
      (t) =>
        (t.status === "Verified" || t.status === "Published") &&
        t.transaction_date_start === ws
    );

    const groups = groupTransactions(txs);

    const getVwap = (basin: string, grade: string): number | null => {
      const key = `${basin}::${grade}`;
      const arr = groups.get(key);
      if (!arr || arr.length === 0) return null;
      const totalVol = arr.reduce((s, t) => s + t.volume_bbl_per_day, 0);
      const reporters = new Set(arr.map((t) => t.seller_name)).size;
      if (reporters < 3 || totalVol < 10000) return null; // thin
      return round4(calcVwap(arr));
    };

    const monthLabel = monday.toLocaleDateString("en-US", { month: "short" });
    const dayNum = monday.getDate();
    // Show month name only on first week of each month
    const label = dayNum <= 7 ? monthLabel : "";

    points.push({
      weekStart: ws,
      weekLabel: label,
      permianFracReady: getVwap("Permian", "Frac-Ready"),
      delawareFracReady: getVwap("Delaware", "Frac-Ready"),
      djFracReady: getVwap("DJ", "Frac-Ready"),
    });
  }

  return points;
}

/* ---- helpers ---- */

function groupTransactions(txs: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = `${tx.basin}::${tx.water_grade}`;
    const arr = groups.get(key);
    if (arr) {
      arr.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }
  return groups;
}

function calcVwap(txs: Transaction[]): number {
  const weightedSum = txs.reduce(
    (s, t) => s + t.price_per_bbl * t.volume_bbl_per_day,
    0
  );
  const totalVol = txs.reduce((s, t) => s + t.volume_bbl_per_day, 0);
  return weightedSum / totalVol;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
