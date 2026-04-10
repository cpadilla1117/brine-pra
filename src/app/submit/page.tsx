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

const BASINS = ["Permian", "Delaware", "DJ", "Midland", "Eagle Ford", "Bakken", "Other"] as const;
const TRANSACTION_TYPES = ["Sale", "Purchase", "Disposal", "Transfer"] as const;
const WATER_GRADES = ["Basic", "Secondary", "Frac-Ready"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: "15px",
  color: "#1D1D1F",
  background: "#FAFAFA",
  border: "0.5px solid #E8E8ED",
  borderRadius: "8px",
  outline: "none",
};

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
    if (DEMO) { setProfile(DEMO_PROFILE); return; }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data as Profile);
    }
    load();
  }, []);

  const tds = watch("tds_ppm");
  const bacteria = watch("bacteria_count");
  const tss = watch("tss_ppm");

  useEffect(() => {
    const grade = suggestWaterGrade(Number(tds), bacteria ? Number(bacteria) : undefined, tss ? Number(tss) : undefined);
    setSuggestedGrade(grade);
  }, [tds, bacteria, tss]);

  async function onSubmit(data: TransactionFormData, asDraft: boolean) {
    if (!profile) return;
    setSubmitting(true);
    if (DEMO) {
      setSubmitting(false);
      alert(`[DEMO] Would ${asDraft ? "save draft" : "submit"}: ${data.volume_bbl_per_day} BBL/day of ${data.water_grade} water in ${data.basin} at $${data.price_per_bbl}/BBL`);
      router.push("/dashboard");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("transactions").insert({
      operator_id: profile.id, company_id: profile.company_id!, basin: data.basin,
      transaction_date_start: data.transaction_date_start, transaction_date_end: data.transaction_date_end,
      volume_bbl_per_day: data.volume_bbl_per_day, price_per_bbl: data.price_per_bbl,
      water_grade: data.water_grade, transaction_type: data.transaction_type,
      buyer_name: data.buyer_name || null, seller_name: profile.full_name || profile.email,
      tds_ppm: data.tds_ppm, chlorides_ppm: data.chlorides_ppm ? Number(data.chlorides_ppm) : null,
      tss_ppm: data.tss_ppm ? Number(data.tss_ppm) : null,
      bacteria_count: data.bacteria_count ? Number(data.bacteria_count) : null,
      notes: data.notes || null, status: asDraft ? "Draft" : "Submitted",
      submitted_at: asDraft ? null : new Date().toISOString(),
    } as any);
    setSubmitting(false);
    if (error) { alert("Error: " + error.message); } else { router.push("/dashboard"); }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <Navbar />
      <main style={{ maxWidth: "720px", margin: "40px auto", padding: "0 32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 300, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Submit Transaction</h1>
          <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>Weekly water transaction data</p>
        </div>

        <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", padding: "40px 48px" }}>
          <form style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Transaction Details */}
            <SectionTitle>Transaction Details</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Basin" error={errors.basin?.message}>
                <select {...register("basin")} style={inputStyle}><option value="">Select basin...</option>{BASINS.map((b) => (<option key={b} value={b}>{b}</option>))}</select>
              </Field>
              <Field label="Transaction Type" error={errors.transaction_type?.message}>
                <select {...register("transaction_type")} style={inputStyle}>{TRANSACTION_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}</select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Week Start" error={errors.transaction_date_start?.message}>
                <input type="date" {...register("transaction_date_start")} style={inputStyle} />
              </Field>
              <Field label="Week End" error={errors.transaction_date_end?.message}>
                <input type="date" {...register("transaction_date_end")} style={inputStyle} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Volume (BBL/day)" error={errors.volume_bbl_per_day?.message}>
                <input type="number" step="0.01" {...register("volume_bbl_per_day")} style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }} placeholder="0.00" />
              </Field>
              <Field label="Price ($/BBL)" error={errors.price_per_bbl?.message}>
                <input type="number" step="0.0001" {...register("price_per_bbl")} style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }} placeholder="0.0000" />
              </Field>
            </div>
            <Field label="Buyer Name (optional)" error={errors.buyer_name?.message}>
              <input type="text" {...register("buyer_name")} style={inputStyle} placeholder="Leave blank to anonymize" />
            </Field>

            {/* Water Quality KPIs */}
            <SectionTitle>Water Quality KPIs</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="TDS (ppm)" error={errors.tds_ppm?.message}>
                <input type="number" step="0.01" {...register("tds_ppm")} style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }} placeholder="0.00" />
              </Field>
              <Field label="Chlorides (ppm)" error={errors.chlorides_ppm?.message}>
                <input type="number" step="0.01" {...register("chlorides_ppm")} style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }} placeholder="Optional" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="TSS (ppm)" error={errors.tss_ppm?.message}>
                <input type="number" step="0.01" {...register("tss_ppm")} style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }} placeholder="Optional" />
              </Field>
              <Field label="Bacteria (CFU/mL)" error={errors.bacteria_count?.message}>
                <input type="number" step="0.01" {...register("bacteria_count")} style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }} placeholder="Optional" />
              </Field>
            </div>

            {/* Water Grade */}
            <SectionTitle>Water Grade</SectionTitle>
            <Field label="Grade Classification" error={errors.water_grade?.message}>
              <div className="flex items-center gap-3">
                <select {...register("water_grade")} style={{ ...inputStyle, flex: 1 }}>
                  <option value="">Select grade...</option>
                  {WATER_GRADES.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
                {suggestedGrade && (
                  <button
                    type="button"
                    onClick={() => setValue("water_grade", suggestedGrade as TransactionFormData["water_grade"])}
                    style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "8px", border: "0.5px solid #1D9E75", color: "#1D9E75", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Suggest: {suggestedGrade}
                  </button>
                )}
              </div>
            </Field>
            <div style={{ fontSize: "13px", color: "#6E6E73", lineHeight: 1.8 }}>
              <p><span style={{ color: "#7A4100", fontWeight: 500 }}>Basic</span> — TDS &gt; 150,000 ppm</p>
              <p><span style={{ color: "#0C447C", fontWeight: 500 }}>Secondary</span> — TDS 50k–150k ppm</p>
              <p><span style={{ color: "#085041", fontWeight: 500 }}>Frac-Ready</span> — TDS &lt; 50k, bacteria &lt; 100, TSS &lt; 50</p>
            </div>

            {/* Notes */}
            <SectionTitle>Notes</SectionTitle>
            <Field label="Additional Notes (optional)" error={errors.notes?.message}>
              <textarea {...register("notes")} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Any additional context..." />
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3" style={{ paddingTop: "16px", borderTop: "0.5px solid #E8E8ED" }}>
              <button
                type="button"
                onClick={handleSubmit((d) => onSubmit(d, true))}
                disabled={submitting}
                style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 500, background: "transparent", border: "0.5px solid #E8E8ED", borderRadius: "8px", color: "#6E6E73", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleSubmit((d) => onSubmit(d, false))}
                disabled={submitting}
                style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 500, background: "#1D9E75", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </form>
        </div>
        <div style={{ height: "48px" }} />
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "0.5px solid #E8E8ED", paddingBottom: "8px" }}>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#1D1D1F", marginBottom: "6px" }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: "13px", color: "#FF3B30", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}
