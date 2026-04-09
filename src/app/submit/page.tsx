"use client";

import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transactionSchema,
  type TransactionFormData,
  suggestWaterGrade,
} from "@/lib/validators";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import type { Profile } from "@/types/database";
import { DEMO, DEMO_PROFILE } from "@/lib/demo-data";

const BASINS = [
  "Permian",
  "Delaware",
  "DJ",
  "Midland",
  "Eagle Ford",
  "Bakken",
  "Other",
] as const;
const TRANSACTION_TYPES = [
  "Sale",
  "Purchase",
  "Disposal",
  "Transfer",
] as const;
const WATER_GRADES = ["Basic", "Secondary", "Frac-Ready"] as const;

export default function SubmitPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestedGrade, setSuggestedGrade] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: { transaction_type: "Sale" },
  });

  useEffect(() => {
    if (DEMO) {
      setProfile(DEMO_PROFILE);
      return;
    }
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as Profile);
    }
    load();
  }, []);

  // Auto-suggest grade
  const tds = watch("tds_ppm");
  const bacteria = watch("bacteria_count");
  const tss = watch("tss_ppm");

  useEffect(() => {
    const grade = suggestWaterGrade(
      Number(tds),
      bacteria ? Number(bacteria) : undefined,
      tss ? Number(tss) : undefined
    );
    setSuggestedGrade(grade);
  }, [tds, bacteria, tss]);

  async function onSubmit(data: TransactionFormData, asDraft: boolean) {
    if (!profile) return;
    setSubmitting(true);

    if (DEMO) {
      setSubmitting(false);
      alert(
        `[DEMO] Would ${asDraft ? "save draft" : "submit"}: ${data.volume_bbl_per_day} BBL/day of ${data.water_grade} water in ${data.basin} at $${data.price_per_bbl}/BBL`
      );
      router.push("/dashboard");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("transactions").insert({
      operator_id: profile.id,
      company_id: profile.company_id!,
      basin: data.basin,
      transaction_date_start: data.transaction_date_start,
      transaction_date_end: data.transaction_date_end,
      volume_bbl_per_day: data.volume_bbl_per_day,
      price_per_bbl: data.price_per_bbl,
      water_grade: data.water_grade,
      transaction_type: data.transaction_type,
      buyer_name: data.buyer_name || null,
      seller_name: profile.full_name || profile.email,
      tds_ppm: data.tds_ppm,
      chlorides_ppm: data.chlorides_ppm ? Number(data.chlorides_ppm) : null,
      tss_ppm: data.tss_ppm ? Number(data.tss_ppm) : null,
      bacteria_count: data.bacteria_count ? Number(data.bacteria_count) : null,
      notes: data.notes || null,
      status: asDraft ? "Draft" : "Submitted",
      submitted_at: asDraft ? null : new Date().toISOString(),
    } as any);

    setSubmitting(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">Submit Transaction</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Weekly water transaction data
          </p>
        </div>

        <form className="space-y-6">
          {/* Transaction Details */}
          <FormSection title="Transaction Details">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Basin" error={errors.basin?.message}>
                <select {...register("basin")} className="form-input">
                  <option value="">Select basin...</option>
                  {BASINS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Transaction Type"
                error={errors.transaction_type?.message}
              >
                <select
                  {...register("transaction_type")}
                  className="form-input"
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Week Start"
                error={errors.transaction_date_start?.message}
              >
                <input
                  type="date"
                  {...register("transaction_date_start")}
                  className="form-input"
                />
              </FormField>
              <FormField
                label="Week End"
                error={errors.transaction_date_end?.message}
              >
                <input
                  type="date"
                  {...register("transaction_date_end")}
                  className="form-input"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Volume (BBL/day)"
                error={errors.volume_bbl_per_day?.message}
              >
                <input
                  type="number"
                  step="0.01"
                  {...register("volume_bbl_per_day")}
                  className="form-input font-mono"
                  placeholder="0.00"
                />
              </FormField>
              <FormField
                label="Price ($/BBL)"
                error={errors.price_per_bbl?.message}
              >
                <input
                  type="number"
                  step="0.0001"
                  {...register("price_per_bbl")}
                  className="form-input font-mono"
                  placeholder="0.0000"
                />
              </FormField>
            </div>
            <FormField
              label="Buyer Name (optional)"
              error={errors.buyer_name?.message}
            >
              <input
                type="text"
                {...register("buyer_name")}
                className="form-input"
                placeholder="Leave blank to anonymize"
              />
            </FormField>
          </FormSection>

          {/* Water Quality KPIs */}
          <FormSection title="Water Quality KPIs">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="TDS (ppm)" error={errors.tds_ppm?.message}>
                <input
                  type="number"
                  step="0.01"
                  {...register("tds_ppm")}
                  className="form-input font-mono"
                  placeholder="0.00"
                />
              </FormField>
              <FormField
                label="Chlorides (ppm)"
                error={errors.chlorides_ppm?.message}
              >
                <input
                  type="number"
                  step="0.01"
                  {...register("chlorides_ppm")}
                  className="form-input font-mono"
                  placeholder="Optional"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="TSS (ppm)" error={errors.tss_ppm?.message}>
                <input
                  type="number"
                  step="0.01"
                  {...register("tss_ppm")}
                  className="form-input font-mono"
                  placeholder="Optional"
                />
              </FormField>
              <FormField
                label="Bacteria (CFU/mL)"
                error={errors.bacteria_count?.message}
              >
                <input
                  type="number"
                  step="0.01"
                  {...register("bacteria_count")}
                  className="form-input font-mono"
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Water Grade */}
          <FormSection title="Water Grade">
            <FormField
              label="Grade Classification"
              error={errors.water_grade?.message}
            >
              <div className="flex items-center gap-3">
                <select
                  {...register("water_grade")}
                  className="form-input flex-1"
                >
                  <option value="">Select grade...</option>
                  {WATER_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {suggestedGrade && (
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        "water_grade",
                        suggestedGrade as TransactionFormData["water_grade"]
                      )
                    }
                    className="text-xs px-3 py-1.5 rounded border border-accent-frac/30 text-accent-frac hover:bg-accent-frac/10 transition-colors whitespace-nowrap"
                  >
                    Suggest: {suggestedGrade}
                  </button>
                )}
              </div>
            </FormField>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>
                <span className="text-accent-basic">BASIC</span> — TDS &gt;
                150,000 ppm
              </p>
              <p>
                <span className="text-accent-secondary">SECONDARY</span> — TDS
                50k–150k ppm
              </p>
              <p>
                <span className="text-accent-frac">FRAC-READY</span> — TDS &lt;
                50k, bacteria &lt; 100 CFU/mL, TSS &lt; 50
              </p>
            </div>
          </FormSection>

          {/* Notes */}
          <FormSection title="Notes">
            <FormField
              label="Additional Notes (optional)"
              error={errors.notes?.message}
            >
              <textarea
                {...register("notes")}
                className="form-input min-h-[80px] resize-y"
                placeholder="Any additional context..."
              />
            </FormField>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, true))}
              disabled={submitting}
              className="px-4 py-2 text-sm border border-border rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, false))}
              disabled={submitting}
              className="px-4 py-2 bg-accent-frac text-background text-sm font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </form>
      </main>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: var(--foreground);
        }
        .form-input::placeholder {
          color: var(--muted-foreground);
        }
        .form-input:focus {
          outline: none;
          border-color: var(--accent-frac);
        }
      `}</style>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
    </div>
  );
}
