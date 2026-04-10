"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import type { Transaction, Profile } from "@/types/database";
import { DEMO, DEMO_PROFILE, DEMO_TRANSACTIONS } from "@/lib/demo-data";
import { computeBrineIndex } from "@/lib/compute-index";
import type { BrineNewsletterData } from "@/lib/newsletter-mock-data";
import { formatVolume } from "@/lib/format-helpers";
import dynamic from "next/dynamic";

const FracReadyChart = dynamic(() => import("@/components/FracReadyChart"), {
  ssr: false,
});

function gradeStyle(grade: string) {
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

function statusStyle(status: string) {
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

type StatusFilter = "all" | "Submitted" | "Verified" | "Published" | "Draft";

const thStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#AEAEB2",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "14px 20px",
  textAlign: "left",
};

const tdBase: React.CSSProperties = {
  fontSize: "13px",
  color: "#1D1D1F",
  padding: "16px 20px",
  verticalAlign: "middle",
};

export default function AdminPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("Submitted");
  const [indexRunning, setIndexRunning] = useState(false);
  const [indexResult, setIndexResult] = useState<string | null>(null);
  const [indexData, setIndexData] = useState<BrineNewsletterData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    if (DEMO) {
      setProfile(DEMO_PROFILE);
      const filtered = filter === "all" ? DEMO_TRANSACTIONS : DEMO_TRANSACTIONS.filter((t) => t.status === filter);
      setTransactions(filtered);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (prof) setProfile(prof as Profile);
    if (prof?.role !== "admin") { setLoading(false); return; }
    let query = supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") { query = query.eq("status", filter); }
    const { data } = await query;
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  }

  async function updateStatus(txId: string, newStatus: "Verified" | "Published" | "Draft") {
    if (DEMO) {
      setTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, status: newStatus } : t)));
      return;
    }
    await supabase.from("transactions").update({ status: newStatus } as any).eq("id", txId);
    loadData();
  }

  function runIndexCalculation() {
    setIndexRunning(true);
    setIndexResult(null);
    setIndexData(null);
    const result = computeBrineIndex();
    setIndexData(result);
    const eligible = result.index_rows.length;
    const thinCount = result.index_rows.filter((r) => r.thin).length;
    setIndexResult(`Index calculated: ${eligible} basin × grade rows (${thinCount} thin market${thinCount !== 1 ? "s" : ""}).`);
    setIndexRunning(false);
  }

  if (profile && profile.role !== "admin") {
    return (
      <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
        <Navbar />
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 32px", textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#FF3B30" }}>Access Denied</h1>
          <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "8px" }}>Admin privileges required.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <Navbar />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
        <div className="flex items-center justify-between" style={{ padding: "40px 0 32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 300, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Admin Panel</h1>
            <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>Review submissions and run price index</p>
          </div>
          <button
            onClick={runIndexCalculation}
            disabled={indexRunning}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 500,
              background: "transparent",
              border: "0.5px solid #1D9E75",
              color: "#1D9E75",
              borderRadius: "8px",
              cursor: "pointer",
              opacity: indexRunning ? 0.5 : 1,
            }}
          >
            {indexRunning ? "Calculating..." : "Run Index Calculation"}
          </button>
        </div>

        {indexResult && (
          <div style={{ marginBottom: "24px", fontSize: "13px", padding: "12px 16px", borderRadius: "8px", border: "0.5px solid #9FE1CB", background: "#E8F5E9", color: "#1B5E20" }}>
            {indexResult}
          </div>
        )}

        {/* Index Preview Table */}
        {indexData && (
          <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
            <div style={{ padding: "14px 20px", background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
              <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#1D1D1F" }}>Computed Index — Week of {indexData.week_start}</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
                    <th style={thStyle}>Basin</th>
                    <th style={thStyle}>Grade</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>VWAP</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Delta</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Volume</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Reporters</th>
                    <th style={thStyle}>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {indexData.index_rows.map((row) => {
                    const gs = gradeStyle(row.grade);
                    return (
                      <tr key={`${row.basin}-${row.grade}`} style={{ borderBottom: "0.5px solid #F0F0F5" }}>
                        <td style={tdBase}>{row.basin}</td>
                        <td style={tdBase}>
                          <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: gs.bg, color: gs.color, border: `0.5px solid ${gs.border}` }}>{row.grade}</span>
                        </td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace" }}>
                          {row.thin ? <span style={{ color: "#AEAEB2" }}>—</span> : `$${row.vwap?.toFixed(2)}`}
                        </td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace" }}>
                          {row.thin || row.delta === null ? (
                            <span style={{ color: "#AEAEB2" }}>—</span>
                          ) : row.delta > 0 ? (
                            <span style={{ color: "#34C759" }}>+${row.delta.toFixed(2)}</span>
                          ) : row.delta < 0 ? (
                            <span style={{ color: "#FF3B30" }}>-${Math.abs(row.delta).toFixed(2)}</span>
                          ) : (
                            <span style={{ color: "#AEAEB2" }}>$0.00</span>
                          )}
                        </td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace" }}>
                          {row.thin ? <span style={{ color: "#AEAEB2" }}>—</span> : formatVolume(row.volume_bbl_per_day ?? 0)}
                        </td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace" }}>{row.reporter_count}</td>
                        <td style={tdBase}>
                          {row.thin && (
                            <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: "#FFF3E0", color: "#E65100" }}>Thin Market</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ marginBottom: "24px" }}>
          <FracReadyChart />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2" style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filter:</span>
          {(["all", "Submitted", "Verified", "Published", "Draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                border: filter === s ? "0.5px solid #E8E8ED" : "0.5px solid transparent",
                background: filter === s ? "#FFFFFF" : "transparent",
                color: filter === s ? "#1D1D1F" : "#6E6E73",
                fontWeight: filter === s ? 500 : 400,
                cursor: "pointer",
              }}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {/* Submissions Table */}
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "14px 20px", background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#1D1D1F" }}>All Submissions</h2>
            <span style={{ fontSize: "11px", color: "#AEAEB2" }}>{transactions.length} results</span>
          </div>
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center", fontSize: "13px", color: "#AEAEB2" }}>Loading...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", fontSize: "13px", color: "#AEAEB2" }}>No transactions match this filter.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Seller</th>
                    <th style={thStyle}>Basin</th>
                    <th style={thStyle}>Grade</th>
                    <th style={thStyle}>Type</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Vol</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>$/BBL</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>TDS</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const gs = gradeStyle(tx.water_grade);
                    const ss = statusStyle(tx.status);
                    return (
                      <tr key={tx.id} style={{ borderBottom: "0.5px solid #F0F0F5" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ ...tdBase, fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px", color: "#6E6E73" }}>{tx.transaction_date_start}</td>
                        <td style={{ ...tdBase, fontSize: "12px", fontWeight: 500 }}>{tx.seller_name}</td>
                        <td style={tdBase}>{tx.basin}</td>
                        <td style={tdBase}>
                          <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: gs.bg, color: gs.color, border: `0.5px solid ${gs.border}` }}>{tx.water_grade}</span>
                        </td>
                        <td style={{ ...tdBase, color: "#6E6E73" }}>{tx.transaction_type}</td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace" }}>{formatVolume(tx.volume_bbl_per_day)}</td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace", fontWeight: 500 }}>${Number(tx.price_per_bbl).toFixed(4)}</td>
                        <td style={{ ...tdBase, textAlign: "right", fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px", color: "#6E6E73" }}>{Number(tx.tds_ppm).toLocaleString()}</td>
                        <td style={tdBase}>
                          <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: ss.bg, color: ss.color }}>{tx.status}</span>
                        </td>
                        <td style={{ ...tdBase, textAlign: "right" }}>
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === "Submitted" && (
                              <button onClick={() => updateStatus(tx.id, "Verified")} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", color: "#1B5E20", background: "transparent", border: "none", cursor: "pointer" }}>Verify</button>
                            )}
                            {tx.status === "Verified" && (
                              <button onClick={() => updateStatus(tx.id, "Published")} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", color: "#0D47A1", background: "transparent", border: "none", cursor: "pointer" }}>Publish</button>
                            )}
                            {tx.status !== "Draft" && (
                              <button onClick={() => updateStatus(tx.id, "Draft")} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", color: "#6E6E73", background: "transparent", border: "none", cursor: "pointer" }}>Reject</button>
                            )}
                          </div>
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
