"use client";

import { useEffect, useState } from "react";
import { render } from "@react-email/render";
import BrineNewsletter from "@/emails/BrineNewsletter";
import { computeBrineIndex } from "@/lib/compute-index";
import type { BrineNewsletterData } from "@/lib/newsletter-mock-data";
import Navbar from "@/components/Navbar";

const WEEK_OPTIONS = [
  { label: "This week (current)", value: 0 },
  { label: "Last week", value: -1 },
  { label: "2 weeks ago", value: -2 },
  { label: "3 weeks ago", value: -3 },
  { label: "4 weeks ago", value: -4 },
  { label: "8 weeks ago", value: -8 },
  { label: "12 weeks ago", value: -12 },
];

export default function NewsletterPreviewPage() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [html, setHtml] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(-1);
  const [data, setData] = useState<BrineNewsletterData | null>(null);

  useEffect(() => {
    const d = computeBrineIndex(weekOffset);
    setData(d);
    render(<BrineNewsletter {...d} />).then(setHtml);
  }, [weekOffset]);

  async function handleSend() {
    if (!emailTo) {
      setResult("Enter a recipient email address.");
      return;
    }
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, weekOffset }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(`Sent! ID: ${json.id}`);
      } else {
        setResult(`Error: ${json.error}`);
      }
    } catch (err) {
      setResult(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Newsletter Preview</h1>
            {data && (
              <p className="text-sm text-muted-foreground mt-1">
                Issue {data.issue_number} &middot; {data.publish_date} &middot;{" "}
                {data.index_rows.length} index rows
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="email"
              placeholder="test@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent-frac w-56"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 bg-accent-frac text-background text-sm font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send test email"}
            </button>
          </div>
        </div>

        {result && (
          <div
            className={`mb-4 text-sm px-4 py-3 rounded border ${
              result.startsWith("Sent")
                ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                : "border-accent-red/30 bg-accent-red/10 text-accent-red"
            }`}
          >
            {result}
          </div>
        )}

        {/* Week selector */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">
            Week:
          </label>
          <select
            value={weekOffset}
            onChange={(e) => setWeekOffset(Number(e.target.value))}
            className="px-3 py-1.5 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent-frac"
          >
            {WEEK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {data && `${data.week_start} — ${data.week_end}`}
          </span>
        </div>

        {/* Email preview iframe */}
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          {html ? (
            <iframe
              srcDoc={html}
              style={{ width: "100%", height: "900px", border: "none" }}
              title="Newsletter preview"
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Rendering preview...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
