import { z } from "zod";

const BASINS = [
  "Permian",
  "Delaware",
  "DJ",
  "Midland",
  "Eagle Ford",
  "Bakken",
  "Other",
] as const;

const WATER_GRADES = ["Basic", "Secondary", "Frac-Ready"] as const;

const TRANSACTION_TYPES = ["Sale", "Purchase", "Disposal", "Transfer"] as const;

/**
 * Zod schema for the weekly transaction submission form.
 * Validates all required fields and enforces business rules:
 * - Price must be > $0.00
 * - Volume must be > 0
 * - Date range end >= start
 * - TDS, chlorides, TSS, bacteria must be >= 0
 */
export const transactionSchema = z
  .object({
    basin: z.enum(BASINS, { required_error: "Basin is required" }),
    transaction_date_start: z.string().min(1, "Start date is required"),
    transaction_date_end: z.string().min(1, "End date is required"),
    volume_bbl_per_day: z.coerce
      .number({ invalid_type_error: "Volume must be a number" })
      .positive("Volume must be greater than 0"),
    price_per_bbl: z.coerce
      .number({ invalid_type_error: "Price must be a number" })
      .positive("Price must be greater than $0.00"),
    water_grade: z.enum(WATER_GRADES, {
      required_error: "Water grade is required",
    }),
    transaction_type: z.enum(TRANSACTION_TYPES, {
      required_error: "Transaction type is required",
    }),
    buyer_name: z.string().optional(),
    tds_ppm: z.coerce
      .number({ invalid_type_error: "TDS must be a number" })
      .nonnegative("TDS must be >= 0"),
    chlorides_ppm: z.coerce
      .number({ invalid_type_error: "Chlorides must be a number" })
      .nonnegative("Chlorides must be >= 0")
      .optional()
      .or(z.literal("")),
    tss_ppm: z.coerce
      .number({ invalid_type_error: "TSS must be a number" })
      .nonnegative("TSS must be >= 0")
      .optional()
      .or(z.literal("")),
    bacteria_count: z.coerce
      .number({ invalid_type_error: "Bacteria count must be a number" })
      .nonnegative("Bacteria count must be >= 0")
      .optional()
      .or(z.literal("")),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.transaction_date_start || !data.transaction_date_end)
        return true;
      return data.transaction_date_end >= data.transaction_date_start;
    },
    {
      message: "End date must be on or after start date",
      path: ["transaction_date_end"],
    }
  );

export type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * Auto-suggest water grade based on KPI inputs.
 * - Frac-Ready: TDS < 50,000, bacteria < 100, TSS < 50
 * - Secondary: TDS 50,000–150,000
 * - Basic: TDS > 150,000
 */
export function suggestWaterGrade(
  tds: number | undefined,
  bacteria: number | undefined,
  tss: number | undefined
): "Basic" | "Secondary" | "Frac-Ready" | null {
  if (tds === undefined || isNaN(tds)) return null;

  if (
    tds < 50000 &&
    (bacteria === undefined || bacteria < 100) &&
    (tss === undefined || tss < 50)
  ) {
    return "Frac-Ready";
  }

  if (tds >= 50000 && tds <= 150000) {
    return "Secondary";
  }

  if (tds > 150000) {
    return "Basic";
  }

  return "Secondary";
}
