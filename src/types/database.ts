/** Basin identifiers for major US produced water markets */
export type Basin =
  | "Permian"
  | "Delaware"
  | "DJ"
  | "Midland"
  | "Eagle Ford"
  | "Bakken"
  | "Other";

/**
 * Water grade classification based on treatment level and KPIs.
 * - Basic: TDS > 150,000 ppm, untreated raw produced water
 * - Secondary: TDS 50,000–150,000 ppm, partial treatment
 * - Frac-Ready: TDS < 50,000 ppm, bacteria < 100 CFU/mL, TSS < 50 ppm
 */
export type WaterGrade = "Basic" | "Secondary" | "Frac-Ready";

/** Type of water transaction */
export type TransactionType = "Sale" | "Purchase" | "Disposal" | "Transfer";

/** Workflow status for transaction submissions */
export type SubmissionStatus = "Draft" | "Submitted" | "Verified" | "Published";

/** User role within the platform */
export type UserRole = "operator" | "admin";

/** Company (E&P operator) record */
export interface Company {
  id: string;
  name: string;
  basin: Basin;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

/** User profile linked to Supabase Auth */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Weekly water transaction submission from an operator */
export interface Transaction {
  id: string;
  operator_id: string;
  company_id: string;
  basin: Basin;
  transaction_date_start: string;
  transaction_date_end: string;
  volume_bbl_per_day: number;
  price_per_bbl: number;
  water_grade: WaterGrade;
  transaction_type: TransactionType;
  buyer_name: string | null;
  seller_name: string;
  tds_ppm: number;
  chlorides_ppm: number | null;
  tss_ppm: number | null;
  bacteria_count: number | null;
  notes: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Calculated weekly price index per basin × grade */
export interface PriceIndex {
  id: string;
  basin: Basin;
  water_grade: WaterGrade;
  week_start: string;
  week_end: string;
  vwap: number;
  total_volume: number;
  reporter_count: number;
  transaction_count: number;
  week_on_week_delta: number | null;
  prior_vwap: number | null;
  is_thin_market: boolean;
  calculated_at: string;
}

/**
 * Supabase database type map.
 * Used for typed client queries.
 */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Company, "id" | "created_at" | "updated_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at" | "updated_at">>;
      };
      price_index: {
        Row: PriceIndex;
        Insert: Omit<PriceIndex, "id">;
        Update: Partial<Omit<PriceIndex, "id">>;
      };
    };
  };
}
