"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Transaction, Profile } from "@/types/database";
import { DEMO, DEMO_PROFILE, DEMO_TRANSACTIONS } from "@/lib/demo-data";
import { formatVolume, formatVolumeTotal } from "@/lib/format-helpers";

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

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (DEMO) {
      setProfile(DEMO_PROFILE);
      // Admin sees all transactions; operator sees only their own
      const txs =
        DEMO_PROFILE.role === "admin"
          ? [...DEMO_TRANSACTIONS].sort(
              (a, b) =>
                b.transaction_date_start.localeCompare(
                  a.transaction_date_start
                ) || b.created_at.localeCompare(a.created_at)
            )
          : DEMO_TRANSACTIONS.filter(
              (t) => t.operator_id === DEMO_PROFILE.id
            ).sort((a, b) => b.created_at.localeCompare(a.created_at));
      setTransactions(txs);
      setLoading(false);
      return;
    }
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("operator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (txData) setTransactions(txData as Transaction[]);
      setLoading(false);
    }
    load();
  }, []);

  // Find the most recent week in the dataset
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

  const submittedCount = latestWeekTx.filter(
    (t) => t.status === "Submitted"
  ).length;
  const draftCount = latestWeekTx.filter(
    (t) => t.status === "Draft"
  ).length;
  const latestWeekVolume = latestWeekTx
    .filter(
      (t) =>
        t.status === "Submitted" ||
        t.status === "Verified" ||
        t.status === "Published"
    )
    .reduce((sum, t) => sum + t.volume_bbl_per_day, 0);

  const operatorCount = useMemo(
    () => new Set(transactions.map((t) => t.seller_name)).size,
    [transactions]
  );
  const basinCount = useMemo(
    () => new Set(transactions.map((t) => t.basin)).size,
    [transactions]
  );
  const reportingOperators = useMemo(
    () => new Set(latestWeekTx.map((t) => t.seller_name)).size,
    [latestWeekTx]
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin && (
          <div className="mb-6 text-xs text-muted-foreground bg-muted/50 border border-border rounded px-4 py-2.5">
            Logged in as BRINE Market Administrator &middot; Read access to all operator submissions &middot; Operator data is anonymized in published index
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            {isAdmin ? (
              <>
                <h1 className="text-xl font-semibold">BRINE Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {transactions.length.toLocaleString()} transactions across{" "}
                  {operatorCount} operators &middot; {basinCount} basins
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile?.full_name
                    ? `Welcome back, ${profile.full_name}`
                    : "Operator portal"}
                </p>
              </>
            )}
          </div>
          <Link
            href="/submit"
            className="px-4 py-2 bg-accent-frac text-background text-sm font-medium rounded hover:opacity-90 transition-opacity"
          >
            + New Submission
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="This Week"
            value={latestWeekTx.length}
            sub={`${latestWeekTx.length} transactions · week of ${latestWeek}`}
          />
          <StatCard
            label="Submitted"
            value={submittedCount}
            sub="awaiting verification"
          />
          <StatCard
            label="Drafts"
            value={draftCount}
            sub="pending submission"
          />
          <StatCard
            label="Total Volume"
            value={formatVolumeTotal(latestWeekVolume)}
            sub={`across all basins · ${reportingOperators} operators reporting`}
            mono
          />
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-card border-b border-border">
            <h2 className="text-sm font-medium">Submission History</h2>
          </div>
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No submissions yet.{" "}
              <Link
                href="/submit"
                className="text-accent-frac hover:underline"
              >
                Submit your first transaction
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="px-4 py-2 text-left">Date Range</th>
                    <th className="px-4 py-2 text-left">Seller</th>
                    <th className="px-4 py-2 text-left">Basin</th>
                    <th className="px-4 py-2 text-left">Grade</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-right">Volume</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">TDS</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 100).map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {tx.transaction_date_start} &rarr;{" "}
                        {tx.transaction_date_end}
                      </td>
                      <td className="px-4 py-2.5 text-xs truncate max-w-[140px]">
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
                        ${Number(tx.price_per_bbl).toFixed(2)}
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

function StatCard({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string | number;
  sub: string;
  mono?: boolean;
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-2xl font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
