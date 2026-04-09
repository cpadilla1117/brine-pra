import { computeBrineIndex } from "./compute-index";

/** Grade-level price index row for the weekly newsletter */
export type GradeIndex = {
  basin: string;
  grade: "Basic" | "Secondary" | "Frac-Ready";
  vwap: number | null;
  delta: number | null;
  volume_bbl_per_day: number | null;
  reporter_count: number;
  thin: boolean;
};

/** Featured deal for the Deal Spotlight section */
export type DealSpotlight = {
  price_per_bbl: number;
  grade: "Basic" | "Secondary" | "Frac-Ready";
  basin: string;
  volume_bbl_per_day: number;
  week_of: string;
};

/** Full newsletter payload — swap data source behind getNewsletterData() */
export type BrineNewsletterData = {
  issue_number: number;
  publish_date: string;
  index_rows: GradeIndex[];
  deals: DealSpotlight[];
  week_start: string;
  week_end: string;
};

/**
 * Returns newsletter data computed from DEMO_TRANSACTIONS.
 * When Supabase is connected, change computeBrineIndex() to query the DB.
 */
export function getNewsletterData(): BrineNewsletterData {
  return computeBrineIndex();
}

// ============================================================
// ORIGINAL STATIC MOCK DATA — kept for fallback reference
// ============================================================
//
// const brineNewsletterData: BrineNewsletterData = {
//   issue_number: 12,
//   publish_date: "April 11, 2026",
//   week_start: "2026-04-06",
//   week_end: "2026-04-12",
//   index_rows: [
//     { basin: "Delaware", grade: "Frac-Ready", vwap: 0.28, delta: 0.02, volume_mbbl_per_day: 38.4, reporter_count: 5, thin: false },
//     { basin: "Delaware", grade: "Secondary", vwap: 0.16, delta: -0.01, volume_mbbl_per_day: 22.1, reporter_count: 4, thin: false },
//     { basin: "Delaware", grade: "Basic", vwap: 0.06, delta: 0.0, volume_mbbl_per_day: 14.7, reporter_count: 3, thin: false },
//     { basin: "DJ Basin", grade: "Frac-Ready", vwap: 0.31, delta: 0.03, volume_mbbl_per_day: 11.2, reporter_count: 3, thin: false },
//     { basin: "DJ Basin", grade: "Secondary", vwap: 0.14, delta: 0.0, volume_mbbl_per_day: 8.5, reporter_count: 3, thin: false },
//     { basin: "Eagle Ford", grade: "Secondary", vwap: 0.18, delta: -0.02, volume_mbbl_per_day: 15.3, reporter_count: 4, thin: false },
//     { basin: "Eagle Ford", grade: "Frac-Ready", vwap: null, delta: null, volume_mbbl_per_day: null, reporter_count: 2, thin: true },
//     { basin: "Permian", grade: "Frac-Ready", vwap: 0.26, delta: 0.01, volume_mbbl_per_day: 62.8, reporter_count: 8, thin: false },
//     { basin: "Permian", grade: "Secondary", vwap: 0.13, delta: -0.01, volume_mbbl_per_day: 41.3, reporter_count: 7, thin: false },
//     { basin: "Permian", grade: "Basic", vwap: 0.05, delta: 0.0, volume_mbbl_per_day: 28.9, reporter_count: 6, thin: false },
//   ],
//   deals: [
//     { price_per_bbl: 0.32, grade: "Frac-Ready", basin: "DJ Basin", volume_bbl_per_day: 14200, week_of: "2026-04-06" },
//     { price_per_bbl: 0.04, grade: "Basic", basin: "Permian", volume_bbl_per_day: 35000, week_of: "2026-04-06" },
//   ],
// };
