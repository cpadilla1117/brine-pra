import type { Profile, Transaction, Basin, WaterGrade, SubmissionStatus } from "@/types/database";

export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_PROFILE: Profile = {
  id: "brine-admin-001",
  email: "admin@brine.io",
  full_name: "BRINE Administrator",
  role: "admin",
  company_id: null,
  created_at: "2025-01-15T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const DEMO_OPERATOR_PROFILE: Profile = {
  id: "demo-user-001",
  email: "j.martinez@oxypermian.com",
  full_name: "Jorge Martinez",
  role: "operator",
  company_id: "company-001",
  created_at: "2025-06-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

/* ============================================================
   OPERATOR ROSTER — 23 operators across 5 basins
   3+ reporters per published basin/grade cell
   ============================================================ */

type Operator = {
  id: string;
  name: string;
  basin: Basin;
  grade: WaterGrade;
  volMin: number;
  volMax: number;
  premium: number;
};

const DEMO_OPERATORS: Operator[] = [
  // Permian Frac-Ready (3 reporters)
  { id: "op-001", name: "Oxy Permian",          basin: "Permian",    grade: "Frac-Ready", volMin:  450000, volMax:  850000, premium:  0.01 },
  { id: "op-002", name: "Exxon Midland",        basin: "Permian",    grade: "Frac-Ready", volMin:  600000, volMax: 1200000, premium:  0.00 },
  { id: "op-003", name: "Devon Energy",         basin: "Permian",    grade: "Frac-Ready", volMin:  280000, volMax:  550000, premium: -0.01 },
  // Permian Secondary (3 reporters)
  { id: "op-004", name: "Pioneer Water Svcs",   basin: "Permian",    grade: "Secondary",  volMin:  350000, volMax:  700000, premium:  0.01 },
  { id: "op-008", name: "Midland Recycle Co",   basin: "Permian",    grade: "Secondary",  volMin:  200000, volMax:  420000, premium:  0.00 },
  { id: "op-006", name: "Permian Basin Water",  basin: "Permian",    grade: "Secondary",  volMin:  250000, volMax:  500000, premium: -0.01 },
  // Permian Basic (3 reporters)
  { id: "op-014", name: "Oxy Basic Disposal",   basin: "Permian",    grade: "Basic",      volMin:  500000, volMax:  950000, premium:  0.01 },
  { id: "op-015", name: "Exxon Basic Disposal", basin: "Permian",    grade: "Basic",      volMin:  600000, volMax: 1100000, premium:  0.00 },
  { id: "op-016", name: "Permian Disposal LLC", basin: "Permian",    grade: "Basic",      volMin:  250000, volMax:  500000, premium: -0.01 },
  // Delaware Frac-Ready (3 reporters)
  { id: "op-009", name: "Oxy Delaware",         basin: "Delaware",   grade: "Frac-Ready", volMin:  310000, volMax:  620000, premium:  0.01 },
  { id: "op-010", name: "Exxon Delaware",       basin: "Delaware",   grade: "Frac-Ready", volMin:  400000, volMax:  750000, premium:  0.00 },
  { id: "op-011", name: "Chevron Delaware",     basin: "Delaware",   grade: "Frac-Ready", volMin:  280000, volMax:  560000, premium: -0.01 },
  // Delaware Secondary (2 reporters — intentionally thin market)
  { id: "op-012", name: "Delaware Water Svcs",  basin: "Delaware",   grade: "Secondary",  volMin:  150000, volMax:  300000, premium:  0.00 },
  { id: "op-013", name: "Pioneer Delaware",     basin: "Delaware",   grade: "Secondary",  volMin:  200000, volMax:  400000, premium: -0.01 },
  // DJ Basin Frac-Ready (3 reporters)
  { id: "op-017", name: "Chevron DJ",           basin: "DJ",         grade: "Frac-Ready", volMin:  140000, volMax:  280000, premium:  0.01 },
  { id: "op-018", name: "Oxy DJ Basin",         basin: "DJ",         grade: "Frac-Ready", volMin:  110000, volMax:  220000, premium:  0.00 },
  { id: "op-019", name: "DJ Water Partners",    basin: "DJ",         grade: "Frac-Ready", volMin:   80000, volMax:  160000, premium: -0.01 },
  // Eagle Ford Secondary (3 reporters)
  { id: "op-005", name: "ConocoPhillips EF",    basin: "Eagle Ford", grade: "Secondary",  volMin:  180000, volMax:  380000, premium:  0.01 },
  { id: "op-021", name: "Eagle Ford Water Co",  basin: "Eagle Ford", grade: "Secondary",  volMin:  120000, volMax:  260000, premium:  0.00 },
  { id: "op-022", name: "EF Disposal Group",    basin: "Eagle Ford", grade: "Secondary",  volMin:   90000, volMax:  200000, premium: -0.01 },
  // Bakken Basic (3 reporters)
  { id: "op-007", name: "Oxy Bakken",           basin: "Bakken",     grade: "Basic",      volMin:  100000, volMax:  210000, premium:  0.01 },
  { id: "op-024", name: "Continental Bakken",   basin: "Bakken",     grade: "Basic",      volMin:   80000, volMax:  170000, premium:  0.00 },
  { id: "op-025", name: "Bakken Water Svcs",    basin: "Bakken",     grade: "Basic",      volMin:   60000, volMax:  130000, premium: -0.01 },
];

/* ============================================================
   SEEDED PRNG — deterministic so data is stable across renders
   ============================================================ */

function createRng(seed: number) {
  let s = seed;
  return function next(): number {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ============================================================
   PRICE BASELINES per basin/grade
   ============================================================ */

type BasinGradeKey = string; // "Permian::Frac-Ready" etc.

const BASE_PRICES: Record<BasinGradeKey, number> = {
  "Permian::Frac-Ready":   0.28,
  "Permian::Secondary":    0.17,
  "Permian::Basic":        0.06,
  "Delaware::Frac-Ready":  0.26,
  "Delaware::Secondary":   0.15,
  "DJ::Frac-Ready":        0.23,
  "Eagle Ford::Secondary": 0.16,
  "Bakken::Basic":         0.05,
};

const PRICE_FLOORS: Record<BasinGradeKey, number> = {
  "Permian::Frac-Ready":   0.22,
  "Permian::Secondary":    0.12,
  "Permian::Basic":        0.03,
  "Delaware::Frac-Ready":  0.20,
  "Delaware::Secondary":   0.10,
  "DJ::Frac-Ready":        0.18,
  "Eagle Ford::Secondary": 0.11,
  "Bakken::Basic":         0.03,
};

/** TDS ranges by grade */
const TDS_RANGES: Record<WaterGrade, [number, number]> = {
  "Frac-Ready": [28000, 48000],
  "Secondary":  [55000, 130000],
  "Basic":      [160000, 240000],
};

/** Transaction types by grade */
const TX_TYPES_BY_GRADE: Record<WaterGrade, Transaction["transaction_type"][]> = {
  "Basic":      ["Disposal", "Sale"],
  "Secondary":  ["Sale", "Transfer"],
  "Frac-Ready": ["Sale", "Purchase"],
};

/* ============================================================
   WEEK DATE HELPERS
   ============================================================ */

function getMonday(weeksAgo: number): Date {
  const now = new Date();
  const day = now.getDay();
  const todayMonday = new Date(now);
  todayMonday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  todayMonday.setHours(0, 0, 0, 0);
  const target = new Date(todayMonday);
  target.setDate(todayMonday.getDate() - weeksAgo * 7);
  return target;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/* ============================================================
   GENERATOR
   ============================================================ */

function generateDemoTransactions(): Transaction[] {
  const rng = createRng(42);
  const txs: Transaction[] = [];
  let txCounter = 1;

  // Track cumulative price drift per basin/grade key
  const allKeys = Object.keys(BASE_PRICES);
  const priceDrift: Record<string, number> = {};
  for (const k of allKeys) priceDrift[k] = 0;

  for (let weekIdx = 51; weekIdx >= 0; weekIdx--) {
    const monday = getMonday(weekIdx);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const dateStart = formatDate(monday);
    const dateEnd = formatDate(sunday);

    // Advance price drift for this week
    // ~12% annual growth = 0.12/52 ≈ 0.00231 per week as a ratio
    for (const key of allKeys) {
      const base = BASE_PRICES[key];
      const trendStep = base * 0.00231;
      const noise = (rng() - 0.5) * 2 * base * 0.06;
      priceDrift[key] += trendStep + noise;
    }

    // Status based on age
    let baseStatus: SubmissionStatus;
    if (weekIdx > 2) {
      baseStatus = "Published";
    } else if (weekIdx >= 1) {
      baseStatus = "Verified";
    } else {
      baseStatus = "Submitted";
    }

    for (const op of DEMO_OPERATORS) {
      // 5% skip chance
      if (rng() < 0.05) continue;

      const bgKey = `${op.basin}::${op.grade}`;

      const tx = buildTx(
        txCounter++,
        op,
        op.grade,
        bgKey,
        dateStart,
        dateEnd,
        weekIdx,
        baseStatus,
        priceDrift,
        rng
      );
      txs.push(tx);

      // 15% chance of a second transaction at a different grade
      if (rng() < 0.15) {
        const altGrade = pickAlternateGrade(op.grade, rng);
        const altKey = `${op.basin}::${altGrade}`;
        // Only if we have a base price for this basin/grade combo
        if (BASE_PRICES[altKey] !== undefined) {
          const tx2 = buildTx(
            txCounter++,
            op,
            altGrade,
            altKey,
            dateStart,
            dateEnd,
            weekIdx,
            baseStatus,
            priceDrift,
            rng
          );
          txs.push(tx2);
        }
      }
    }
  }

  return txs;
}

function buildTx(
  counter: number,
  op: Operator,
  grade: WaterGrade,
  bgKey: string,
  dateStart: string,
  dateEnd: string,
  weekIdx: number,
  baseStatus: SubmissionStatus,
  drift: Record<string, number>,
  rng: () => number
): Transaction {
  const base = BASE_PRICES[bgKey] ?? 0.10;
  const floor = PRICE_FLOORS[bgKey] ?? 0.03;

  // Price = base + cumulative drift + operator premium
  const rawPrice = base + (drift[bgKey] ?? 0) + op.premium;
  const price = Math.max(floor, Math.round(rawPrice * 100) / 100);

  // Volume with +/- 8% noise, capped at 3M
  const midVol = (op.volMin + op.volMax) / 2;
  const volNoise = (rng() - 0.5) * 0.16 * midVol;
  const volume = Math.min(3_000_000, Math.round(Math.max(op.volMin * 0.9, midVol + volNoise)));

  // TDS
  const [tdsMin, tdsMax] = TDS_RANGES[grade];
  const tds = Math.round(tdsMin + rng() * (tdsMax - tdsMin));

  // Status: this week gets 70/30 Submitted/Draft split
  let status = baseStatus;
  if (weekIdx === 0) {
    status = rng() < 0.7 ? "Submitted" : "Draft";
  }

  // Transaction type
  const types = TX_TYPES_BY_GRADE[grade];
  const txType = types[Math.floor(rng() * types.length)];

  // Submitted timestamp
  const submittedAt =
    status === "Draft"
      ? null
      : new Date(
          new Date(dateStart).getTime() +
            Math.floor(rng() * 5) * 86400000 +
            Math.floor(rng() * 43200000)
        ).toISOString();

  return {
    id: `tx-${String(counter).padStart(4, "0")}`,
    operator_id: op.id,
    company_id: `company-${op.id.split("-")[1]}`,
    basin: op.basin,
    transaction_date_start: dateStart,
    transaction_date_end: dateEnd,
    volume_bbl_per_day: volume,
    price_per_bbl: price,
    water_grade: grade,
    transaction_type: txType,
    buyer_name: txType === "Disposal" ? null : `Buyer-${Math.floor(rng() * 50)}`,
    seller_name: op.name,
    tds_ppm: tds,
    chlorides_ppm: Math.round(tds * (0.5 + rng() * 0.15)),
    tss_ppm: grade === "Frac-Ready" ? Math.round(15 + rng() * 35) : Math.round(50 + rng() * 400),
    bacteria_count: grade === "Frac-Ready" ? Math.round(20 + rng() * 80) : Math.round(100 + rng() * 2000),
    notes: null,
    status,
    submitted_at: submittedAt,
    created_at: submittedAt || new Date(dateStart).toISOString(),
    updated_at: submittedAt || new Date(dateStart).toISOString(),
  };
}

function pickAlternateGrade(primary: WaterGrade, rng: () => number): WaterGrade {
  const grades: WaterGrade[] = ["Basic", "Secondary", "Frac-Ready"];
  const others = grades.filter((g) => g !== primary);
  return others[Math.floor(rng() * others.length)];
}

/* ============================================================
   EXPORTS
   ============================================================ */

export const DEMO_TRANSACTIONS: Transaction[] = generateDemoTransactions();
