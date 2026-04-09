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

function gradeColor(grade: string) {
  switch (grade) {
    case "Basic":
      return "text-accent-basic border-accent-basic/30 bg-accent-basic/10";
    case "Secondary":
      return "text-accent-secondary border-accent-secondary/30 bg-accent-secondary/10";
    case "Frac-Ready":
      return "text-accent-frac border-accent-frac/30 bg-accent-frac/10";
    default:
      return "";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "Draft":
      return "text-muted-foreground border-border bg-muted";
    case "Submitted":
      return "text-accent-secondary border-accent-secondary/30 bg-accent-secondary/10";
    case "Verified":
      return "text-accent-green border-accent-green/30 bg-accent-green/10";
    case "Published":
      return "text-accent-frac border-accent-frac/30 bg-accent-frac/10";
    default:
      return "";
  }
}

type StatusFilter = "all" | "Submitted" | "Verified" | "Published" | "Draft";

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
      const filtered =
        filter === "all"
          ? DEMO_TRANSACTIONS
          : DEMO_TRANSACTIONS.filter((t) => t.status === filter);
      setTransactions(filtered);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (prof) setProfile(prof as Profile);

    if (prof?.role !== "admin") {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  }

  async function updateStatus(
    txId: string,
    newStatus: "Verified" | "Published" | "Draft"
  ) {
    if (DEMO) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, status: newStatus } : t))
      );
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
    setIndexResult(
      `Index calculated: ${eligible} basin × grade rows (${thinCount} thin market${thinCount !== 1 ? "s" : ""}).`
    );
    setIndexRunning(false);
  }

  if (profile && profile.role !== "admin") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-accent-red">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Admin privileges required.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review submissions and run price index
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runIndexCalculation}
              disabled={indexRunning}
              className="px-4 py-2 bg-accent-frac text-background text-sm font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {indexRunning ? "Calculating..." : "Run Index Calculation"}
            </button>
          </div>
        </div>

        {indexResult && (
          <div className="mb-6 text-sm px-4 py-3 rounded border border-accent-green/30 bg-accent-green/10 text-accent-green">
            {indexResult}
          </div>
        )}

        {/* Index Preview Table */}
        {indexData && (
          <div className="border border-border rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-3 bg-card border-b border-border">
              <h2 className="text-sm font-medium">
                Computed Index — Week of {indexData.week_start}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-2 text-left">Basin</th>
                    <th className="px-4 py-2 text-left">Grade</th>
                    <th className="px-4 py-2 text-right">VWAP</th>
                    <th className="px-4 py-2 text-right">Delta</th>
                    <th className="px-4 py-2 text-right">Volume</th>
                    <th className="px-4 py-2 text-right">Reporters</th>
                    <th className="px-4 py-2 text-left">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {indexData.index_rows.map((row, i) => (
                    <tr
                      key={`${row.basin}-${row.grade}`}
                      className={`border-b border-border/50 ${
                        i % 2 === 0 ? "bg-card/30" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">{row.basin}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${gradeColor(
                            row.grade
                          )}`}
                        >
                          {row.grade}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {row.thin ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          `$${row.vwap?.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {row.thin || row.delta === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : row.delta > 0 ? (
                          <span className="text-accent-green">
                            +${row.delta.toFixed(2)}
                          </span>
                        ) : row.delta < 0 ? (
                          <span className="text-accent-red">
                            -${Math.abs(row.delta).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">$0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {row.thin ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          formatVolume(row.volume_bbl_per_day ?? 0)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {row.reporter_count}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.thin && (
                          <span className="text-xs px-2 py-0.5 rounded border border-accent-basic/30 bg-accent-basic/10 text-accent-basic">
                            Thin Market
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 12-month Frac-Ready trend chart */}
        <div className="mb-8">
          <FracReadyChart />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Filter:
          </span>
          {(
            ["all", "Submitted", "Verified", "Published", "Draft"] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                filter === s
                  ? "bg-muted text-foreground border-border"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {/* Submissions Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium">All Submissions</h2>
            <span className="text-xs text-muted-foreground">
              {transactions.length} results
            </span>
          </div>
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No transactions match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Seller</th>
                    <th className="px-4 py-2 text-left">Basin</th>
                    <th className="px-4 py-2 text-left">Grade</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-right">Vol</th>
                    <th className="px-4 py-2 text-right">$/BBL</th>
                    <th className="px-4 py-2 text-right">TDS</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {tx.transaction_date_start}
                      </td>
                      <td className="px-4 py-2.5 text-xs truncate max-w-[120px]">
                        {tx.seller_name}
                      </td>
                      <td className="px-4 py-2.5">{tx.basin}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${gradeColor(
                            tx.water_grade
                          )}`}
                        >
                          {tx.water_grade}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {tx.transaction_type}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatVolume(tx.volume_bbl_per_day)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        ${Number(tx.price_per_bbl).toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {Number(tx.tds_ppm).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${statusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {tx.status === "Submitted" && (
                            <button
                              onClick={() => updateStatus(tx.id, "Verified")}
                              className="text-xs px-2 py-1 rounded text-accent-green hover:bg-accent-green/10 transition-colors"
                            >
                              Verify
                            </button>
                          )}
                          {tx.status === "Verified" && (
                            <button
                              onClick={() => updateStatus(tx.id, "Published")}
                              className="text-xs px-2 py-1 rounded text-accent-frac hover:bg-accent-frac/10 transition-colors"
                            >
                              Publish
                            </button>
                          )}
                          {tx.status !== "Draft" && (
                            <button
                              onClick={() => updateStatus(tx.id, "Draft")}
                              className="text-xs px-2 py-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
