"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Transaction, Profile } from "@/types/database";
import { DEMO, DEMO_PROFILE, DEMO_TRANSACTIONS } from "@/lib/demo-data";
import { formatVolume, formatVolumeTotal } from "@/lib/format-helpers";

function gradeClasses(grade: string) {
  switch (grade) {
    case "Basic":
      return { bg: "#FEF3E2", color: "#7A4100", border: "#FAC775" };
    case "Secondary":
      return { bg: "#E8F1FB", color: "#0C447C", border: "#B5D4F4" };
    case "Frac-Ready":
      return { bg: "#E1F5EE", color: "#085041", border: "#9FE1CB" };
    default:
      return { bg: "#F5F5F7", color: "#6E6E73", border: "#E8E8ED" };
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "Submitted":
      return { bg: "#FFF3E0", color: "#E65100" };
    case "Verified":
      return { bg: "#E8F5E9", color: "#1B5E20" };
    case "Published":
      return { bg: "#E3F2FD", color: "#0D47A1" };
    case "Draft":
      return { bg: "#F5F5F7", color: "#6E6E73" };
    default:
      return { bg: "#F5F5F7", color: "#6E6E73" };
  }
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (DEMO) {
      setProfile(DEMO_PROFILE);
      const txs =
        DEMO_PROFILE.role === "admin"
          ? [...DEMO_TRANSACTIONS].sort(
              (a, b) =>
                b.transaction_date_start.localeCompare(a.transaction_date_start) ||
                b.created_at.localeCompare(a.created_at)
            )
          : DEMO_TRANSACTIONS.filter(
              (t) => t.operator_id === DEMO_PROFILE.id
            ).sort((a, b) => b.created_at.localeCompare(a.created_at));
      setTransactions(txs);
      setLoading(false);
      return;
    }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profileData) setProfile(profileData as Profile);
      const { data: txData } = await supabase.from("transactions").select("*").eq("operator_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (txData) setTransactions(txData as Transaction[]);
      setLoading(false);
    }
    load();
  }, []);

  const latestWeek = useMemo(() => {
    if (transactions.length === 0) return "";
    const weeks = Array.from(new Set(transactions.map((t) => t.transaction_date_start)));
    weeks.sort();
    return weeks[weeks.length - 1];
  }, [transactions]);

  const latestWeekTx = useMemo(
    () => transactions.filter((t) => t.transaction_date_start === latestWeek),
    [transactions, latestWeek]
  );

  const submittedCount = latestWeekTx.filter((t) => t.status === "Submitted").length;
  const draftCount = latestWeekTx.filter((t) => t.status === "Draft").length;
  const latestWeekVolume = latestWeekTx
    .filter((t) => t.status === "Submitted" || t.status === "Verified" || t.status === "Published")
    .reduce((sum, t) => sum + t.volume_bbl_per_day, 0);

  const operatorCount = useMemo(() => new Set(transactions.map((t) => t.seller_name)).size, [transactions]);
  const basinCount = useMemo(() => new Set(transactions.map((t) => t.basin)).size, [transactions]);
  const reportingOperators = useMemo(() => new Set(latestWeekTx.map((t) => t.seller_name)).size, [latestWeekTx]);

  const thStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 500,
    color: "#AEAEB2",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "14px 20px",
    textAlign: "left",
  };

  const tdStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#1D1D1F",
    padding: "16px 20px",
    verticalAlign: "middle",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <Navbar />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
        {isAdmin && (
          <div style={{
            margin: "24px 0 0",
            fontSize: "13px",
            color: "#6E6E73",
            background: "#FAFAFA",
            border: "0.5px solid #E8E8ED",
            borderRadius: "8px",
            padding: "10px 16px",
          }}>
            Logged in as BRINE Market Administrator &middot; Read access to all operator submissions &middot; Operator data is anonymized in published index
          </div>
        )}

        <div className="flex items-center justify-between" style={{ padding: "40px 0 32px" }}>
          <div>
            {isAdmin ? (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 300, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                  Admin Dashboard
                </h1>
                <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>
                  {transactions.length.toLocaleString()} transactions &middot; {operatorCount} operators &middot; {basinCount} basins
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "28px", fontWeight: 300, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                  Dashboard
                </h1>
                <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>
                  {profile?.full_name ? `Welcome back, ${profile.full_name}` : "Operator portal"}
                </p>
              </>
            )}
          </div>
          <Link
            href="/submit"
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 500,
              background: "#1D9E75",
              color: "#FFFFFF",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            + New Submission
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" style={{ marginBottom: "24px" }}>
          <StatCard label="This Week" value={latestWeekTx.length} sub={`${latestWeekTx.length} transactions · week of ${latestWeek}`} />
          <StatCard label="Submitted" value={submittedCount} sub="awaiting verification" />
          <StatCard label="Drafts" value={draftCount} sub="pending submission" />
          <StatCard label="Total Volume" value={formatVolumeTotal(latestWeekVolume)} sub={`across all basins · ${reportingOperators} operators reporting`} mono />
        </div>

        {/* Table */}
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#1D1D1F" }}>Submission History</h2>
          </div>
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center", fontSize: "13px", color: "#AEAEB2" }}>Loading...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", fontSize: "13px", color: "#AEAEB2" }}>
              No submissions yet. <Link href="/submit" style={{ color: "#1D9E75" }}>Submit your first transaction</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
                    <th style={thStyle}>Date Range</th>
                    <th style={thStyle}>Seller</th>
                    <th style={thStyle}>Basin</th>
                    <th style={thStyle}>Grade</th>
                    <th style={thStyle}>Type</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Volume</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Price</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>TDS</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 100).map((tx) => {
                    const gc = gradeClasses(tx.water_grade);
                    const sc = statusClasses(tx.status);
                    return (
                      <tr key={tx.id} className="transition-colors" style={{ borderBottom: "0.5px solid #F0F0F5" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ ...tdStyle, fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px", color: "#6E6E73" }}>
                          {tx.transaction_date_start} &rarr; {tx.transaction_date_end}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{tx.seller_name}</td>
                        <td style={tdStyle}>{tx.basin}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", letterSpacing: "0.02em", background: gc.bg, color: gc.color, border: `0.5px solid ${gc.border}` }}>
                            {tx.water_grade}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: "#6E6E73" }}>{tx.transaction_type}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace" }}>
                          {formatVolume(tx.volume_bbl_per_day)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace", fontWeight: 500 }}>
                          ${Number(tx.price_per_bbl).toFixed(2)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px", color: "#6E6E73" }}>
                          {Number(tx.tds_ppm).toLocaleString()}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: sc.bg, color: sc.color }}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ height: "48px" }} />
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, mono }: { label: string; value: string | number; sub: string; mono?: boolean }) {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", padding: "24px 28px" }}>
      <div style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
        {label}
      </div>
      <div style={{ fontSize: "34px", fontWeight: 300, color: "#1D1D1F", letterSpacing: "-0.02em", fontFamily: mono ? "var(--font-geist-mono), monospace" : "inherit" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "8px" }}>{sub}</div>
    </div>
  );
}
