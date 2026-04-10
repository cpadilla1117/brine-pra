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

const inputStyle: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: "13px",
  color: "#1D1D1F",
  background: "#FAFAFA",
  border: "0.5px solid #E8E8ED",
  borderRadius: "8px",
  outline: "none",
  width: "220px",
};

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
    if (!emailTo) { setResult("Enter a recipient email address."); return; }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, weekOffset }),
      });
      const json = await res.json();
      if (json.success) { setResult(`Sent! ID: ${json.id}`); }
      else { setResult(`Error: ${json.error}`); }
    } catch (err) {
      setResult(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally { setSending(false); }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <Navbar />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
        <div className="flex items-center justify-between" style={{ padding: "40px 0 24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 300, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Newsletter Preview</h1>
            {data && (
              <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "4px" }}>
                Issue {data.issue_number} &middot; {data.publish_date} &middot; {data.index_rows.length} index rows
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="email"
              placeholder="test@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 500,
                background: "#1D9E75",
                color: "#FFFFFF",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                opacity: sending ? 0.5 : 1,
              }}
            >
              {sending ? "Sending..." : "Send test email"}
            </button>
          </div>
        </div>

        {result && (
          <div style={{
            marginBottom: "16px",
            fontSize: "13px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: result.startsWith("Sent") ? "0.5px solid #9FE1CB" : "0.5px solid #FFD4D4",
            background: result.startsWith("Sent") ? "#E8F5E9" : "#FFF5F5",
            color: result.startsWith("Sent") ? "#1B5E20" : "#FF3B30",
          }}>
            {result}
          </div>
        )}

        {/* Week selector */}
        <div className="flex items-center gap-3" style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>Week:</span>
          <select
            value={weekOffset}
            onChange={(e) => setWeekOffset(Number(e.target.value))}
            style={{ ...inputStyle, width: "auto" }}
          >
            {WEEK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span style={{ fontSize: "11px", color: "#AEAEB2" }}>
            {data && `${data.week_start} — ${data.week_end}`}
          </span>
        </div>

        {/* Email preview */}
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", overflow: "hidden" }}>
          {html ? (
            <iframe
              srcDoc={html}
              style={{ width: "100%", height: "900px", border: "none" }}
              title="Newsletter preview"
            />
          ) : (
            <div className="flex items-center justify-center" style={{ height: "192px", fontSize: "13px", color: "#AEAEB2" }}>
              Rendering preview...
            </div>
          )}
        </div>
        <div style={{ height: "48px" }} />
      </main>
    </div>
  );
}
