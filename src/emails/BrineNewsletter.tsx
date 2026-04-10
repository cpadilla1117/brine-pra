import { Html, Head, Body } from "@react-email/components";
import * as React from "react";
import type { BrineNewsletterData, GradeIndex } from "@/lib/newsletter-mock-data";
import { formatVolume, formatVolumeTotal } from "@/lib/format-helpers";

/* ============================================================
   HELPERS
   ============================================================ */

const sans =
  "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const mono = "'SFMono-Regular', 'Roboto Mono', 'Courier New', monospace";

function gradePill(grade: string) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Basic: { bg: "#FEF7EE", color: "#7A4100", border: "#FAC775" },
    Secondary: { bg: "#EBF3FD", color: "#0C447C", border: "#B5D4F4" },
    "Frac-Ready": { bg: "#E8F7F2", color: "#0A6B50", border: "#9FE1CB" },
  };
  const s = styles[grade] || styles["Basic"];
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        border: `0.5px solid ${s.border}`,
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "6px",
        fontFamily: sans,
      }}
    >
      {grade}
    </span>
  );
}

function deltaDisplay(delta: number | null) {
  if (delta === null || delta === 0)
    return <span style={{ color: "#AEAEB2", fontSize: "12px", fontFamily: mono }}>—</span>;
  if (delta > 0)
    return (
      <span style={{ color: "#1D9E75", fontSize: "12px", fontFamily: mono }}>
        &#9650; ${delta.toFixed(2)}
      </span>
    );
  return (
    <span style={{ color: "#FF3B30", fontSize: "12px", fontFamily: mono }}>
      &#9660; ${Math.abs(delta).toFixed(2)}
    </span>
  );
}

type SpreadData = {
  basin: string;
  spread: number;
  direction: "up" | "down" | "steady";
};

function computeSpreads(rows: GradeIndex[]): SpreadData[] {
  const basins = new Map<
    string,
    { fracReady: number | null; basic: number | null; fracDelta: number | null; basicDelta: number | null }
  >();
  for (const row of rows) {
    if (!basins.has(row.basin))
      basins.set(row.basin, { fracReady: null, basic: null, fracDelta: null, basicDelta: null });
    const entry = basins.get(row.basin)!;
    if (row.grade === "Frac-Ready" && !row.thin) { entry.fracReady = row.vwap; entry.fracDelta = row.delta; }
    if (row.grade === "Basic" && !row.thin) { entry.basic = row.vwap; entry.basicDelta = row.delta; }
  }
  const spreads: SpreadData[] = [];
  basins.forEach((vals, basin) => {
    if (vals.fracReady !== null && vals.basic !== null) {
      const spread = vals.fracReady - vals.basic;
      const fracD = vals.fracDelta ?? 0;
      const basicD = vals.basicDelta ?? 0;
      const d = fracD - basicD;
      const direction: "up" | "down" | "steady" = d > 0.005 ? "up" : d < -0.005 ? "down" : "steady";
      spreads.push({ basin, spread, direction });
    }
  });
  return spreads.slice(0, 3);
}

function generateHeroHeadline(data: BrineNewsletterData, spreads: SpreadData[]): { headline: string; subline: string } {
  const nonThin = data.index_rows.filter((r) => !r.thin && r.vwap !== null);
  if (nonThin.length === 0) return { headline: "Market data is still coming in this week.", subline: "Check back for the full index." };

  const top = nonThin.reduce((a, b) => ((a.vwap ?? 0) > (b.vwap ?? 0) ? a : b));
  const widestSpread = spreads.length > 0 ? spreads.reduce((a, b) => (a.spread > b.spread ? a : b)) : null;

  if (top.delta !== null && top.delta > 0.01) {
    return {
      headline: `${top.basin} ${top.grade} climbs to $${top.vwap?.toFixed(2)}/BBL as operator demand stays firm across the basin.`,
      subline: `Prices rose $${top.delta.toFixed(2)} week-over-week on ${formatVolume(top.volume_bbl_per_day ?? 0)} of reported volume from ${top.reporter_count} contributors.`,
    };
  }
  if (top.delta !== null && top.delta < -0.01) {
    return {
      headline: `${top.basin} ${top.grade} eases to $${top.vwap?.toFixed(2)}/BBL as completion activity moderates.`,
      subline: `A pullback of $${Math.abs(top.delta).toFixed(2)} from last week, though volumes remain solid at ${formatVolume(top.volume_bbl_per_day ?? 0)}.`,
    };
  }
  if (widestSpread && widestSpread.spread > 0.2) {
    return {
      headline: `Treatment economics hit $${widestSpread.spread.toFixed(2)}/BBL in ${widestSpread.basin} \u2014 the math for recycling keeps getting better.`,
      subline: `The gap between Basic disposal and Frac-Ready water is ${widestSpread.direction === "up" ? "widening" : "holding"}, making treatment infrastructure investments increasingly compelling.`,
    };
  }
  return {
    headline: `${top.basin} ${top.grade} holds at $${top.vwap?.toFixed(2)}/BBL in a stable week across major basins.`,
    subline: `${formatVolume(top.volume_bbl_per_day ?? 0)} of verified volume from ${top.reporter_count} contributors. Markets steady heading into next week.`,
  };
}

function generateNarrative(data: BrineNewsletterData, spreads: SpreadData[]): string[] {
  const nonThin = data.index_rows.filter((r) => !r.thin && r.vwap !== null);
  if (nonThin.length === 0) return ["Not enough verified data to generate commentary this week."];

  const top = nonThin.reduce((a, b) => ((a.vwap ?? 0) > (b.vwap ?? 0) ? a : b));
  const paragraphs: string[] = [];

  // P1: Lead with the top performer
  const verb = top.delta !== null && top.delta > 0 ? "climbed" : top.delta !== null && top.delta < 0 ? "pulled back" : "held steady";
  const deltaNote = top.delta !== null && top.delta !== 0
    ? ` The ${top.delta > 0 ? "gain" : "decline"} of $${Math.abs(top.delta).toFixed(2)}/BBL ${top.delta > 0 ? "suggests continued demand pressure from active completion programs" : "likely reflects a pause in frac scheduling by at least one major operator"}.`
    : "";
  paragraphs.push(
    `${top.basin} ${top.grade} water ${verb} to $${top.vwap?.toFixed(2)}/BBL this week on ${formatVolume(top.volume_bbl_per_day ?? 0)} of reported volume across ${top.reporter_count} contributors.${deltaNote}`
  );

  // P2: Spread commentary
  if (spreads.length > 0) {
    const widest = spreads.reduce((a, b) => (a.spread > b.spread ? a : b));
    const spreadVerb = widest.direction === "up" ? "widened" : widest.direction === "down" ? "narrowed" : "held";
    const implication = widest.direction === "up"
      ? "For operators with recycling infrastructure, this spread means every barrel you treat and upgrade earns you an extra $" + widest.spread.toFixed(2) + ". At scale, that adds up fast."
      : widest.direction === "down"
      ? "Watch this number \u2014 if the spread continues to narrow, the economics of building new treatment capacity get harder to justify."
      : "Steady spreads give operators planning certainty for treatment infrastructure investment decisions.";
    paragraphs.push(
      `The BRINE Spread in ${widest.basin} ${spreadVerb} to $${widest.spread.toFixed(2)}/BBL this week. ${implication}`
    );
  }

  // P3: Forward-looking
  paragraphs.push(
    "Looking ahead: keep an eye on completion schedules across the Permian and Delaware. Seasonal demand patterns typically firm through late Q2, which could put upward pressure on Frac-Ready pricing in the coming weeks."
  );

  return paragraphs;
}

/* ============================================================
   SHARED STYLES
   ============================================================ */

const thStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#AEAEB2",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "10px 16px",
  textAlign: "left",
  borderBottom: "1px solid #E8E8ED",
  background: "transparent",
};

const tdBase: React.CSSProperties = {
  padding: "16px",
  verticalAlign: "middle",
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function BrineNewsletter(props: BrineNewsletterData) {
  const { issue_number, publish_date, index_rows, deals, week_start, week_end } = props;

  const spreads = computeSpreads(index_rows);
  const { headline, subline } = generateHeroHeadline(props, spreads);
  const narrative = generateNarrative(props, spreads);

  const nonThinRows = index_rows.filter((r) => !r.thin);
  const basinsCovered = new Set(nonThinRows.map((r) => r.basin)).size;
  const fracReadyRows = nonThinRows.filter((r) => r.grade === "Frac-Ready");
  const avgFracReady = fracReadyRows.length > 0
    ? fracReadyRows.reduce((s, r) => s + (r.vwap ?? 0), 0) / fracReadyRows.length
    : 0;
  const totalVolume = nonThinRows.reduce((s, r) => s + (r.volume_bbl_per_day ?? 0), 0);
  const totalReporters = nonThinRows.reduce((s, r) => s + r.reporter_count, 0);

  return (
    <Html>
      <Head />
      <Body style={{ margin: "0", padding: "20px 0", backgroundColor: "#F5F5F7", fontFamily: sans }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", borderRadius: "12px", overflow: "hidden", border: "1px solid #E8E8ED" }}>

          {/* ====== HEADER ====== */}
          <div style={{ background: "#FFFFFF", padding: "40px 48px 32px", borderBottom: "1px solid #E8E8ED" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top" }}>
                    <div style={{ fontFamily: mono, fontSize: "22px", fontWeight: 600, color: "#1D1D1F", letterSpacing: "0.08em" }}>
                      BRINE<span style={{ color: "#1D9E75" }}>.</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    <div style={{ fontSize: "11px", color: "#AEAEB2", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Issue {issue_number} &middot; {publish_date}
                    </div>
                    <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "2px" }}>
                      Week of {week_start} &mdash; {week_end}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <h1 style={{ fontSize: "26px", fontWeight: 300, color: "#1D1D1F", lineHeight: "1.35", letterSpacing: "-0.02em", margin: "24px 0 12px", maxWidth: "560px" }}>
              {headline}
            </h1>
            <p style={{ fontSize: "15px", color: "#6E6E73", lineHeight: "1.6", margin: "0", maxWidth: "520px" }}>
              {subline}
            </p>
          </div>

          {/* ====== STAT BAR ====== */}
          <div style={{ background: "#F5F5F7", padding: "24px 48px", borderBottom: "1px solid #E8E8ED" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <StatBox label="BASINS ACTIVE" value={String(basinsCovered)} context="publishing this week" border />
                  <StatBox label="AVG FRAC-READY" value={`$${avgFracReady.toFixed(2)}`} context="volume-weighted avg" border price />
                  <StatBox label="TOTAL VOLUME" value={formatVolumeTotal(totalVolume)} context="across all active basins" border volume />
                  <StatBox label="CONTRIBUTORS" value={String(totalReporters)} context="operators reporting" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== BODY ====== */}
          <div style={{ background: "#FFFFFF", padding: "0 48px 48px" }}>

            {/* ====== PRICE INDEX ====== */}
            <SectionLabel>Price Index</SectionLabel>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Basin</th>
                  <th style={thStyle}>Grade</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>$/BBL</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Chg</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Volume</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Contributors</th>
                </tr>
              </thead>
              <tbody>
                {index_rows.map((row, i) => {
                  const isLast = i === index_rows.length - 1;
                  return (
                    <tr key={`${row.basin}-${row.grade}`} style={{ borderBottom: isLast ? "none" : "1px solid #F5F5F7" }}>
                      <td style={{ ...tdBase, fontSize: "13px", fontWeight: 500, color: "#1D1D1F" }}>{row.basin}</td>
                      <td style={tdBase}>{gradePill(row.grade)}</td>
                      <td style={{ ...tdBase, textAlign: "right" }}>
                        {row.thin ? (
                          <span style={{ fontSize: "12px", color: "#AEAEB2", fontStyle: "italic" }}>Not enough data this week</span>
                        ) : (
                          <span style={{ fontFamily: mono, fontSize: "15px", fontWeight: 600, color: "#1D1D1F" }}>${row.vwap?.toFixed(2)}</span>
                        )}
                      </td>
                      <td style={{ ...tdBase, textAlign: "right" }}>
                        {row.thin ? <span style={{ color: "#AEAEB2" }}>—</span> : deltaDisplay(row.delta)}
                      </td>
                      <td style={{ ...tdBase, textAlign: "right", fontFamily: mono, fontSize: "13px", color: "#6E6E73" }}>
                        {row.thin ? <span style={{ color: "#AEAEB2" }}>—</span> : formatVolume(row.volume_bbl_per_day ?? 0)}
                      </td>
                      <td style={{ ...tdBase, textAlign: "right", fontSize: "13px", color: "#AEAEB2" }}>
                        {row.reporter_count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ====== BRINE SPREAD ====== */}
            {spreads.length > 0 && (
              <>
                <SectionLabel>Brine Spread</SectionLabel>
                <p style={{ fontSize: "13px", color: "#6E6E73", lineHeight: "1.7", margin: "0 0 16px" }}>
                  The spread between Basic disposal water and Frac-Ready treated water tells operators whether investment in treatment infrastructure is economically justified this week.
                </p>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "12px 0", marginLeft: "-12px" }}>
                  <tbody>
                    <tr>
                      {spreads.map((s) => {
                        const dirColor = s.direction === "up" ? "#1D9E75" : s.direction === "down" ? "#FF9500" : "#AEAEB2";
                        const dirText = s.direction === "up"
                          ? "\u25B2 Widening \u2014 treatment economics improving"
                          : s.direction === "down"
                          ? "\u25BC Narrowing \u2014 watch disposal capacity"
                          : "\u2014 Holding steady";
                        return (
                          <td key={s.basin} style={{ background: "#F5F5F7", borderRadius: "12px", padding: "20px 24px", verticalAlign: "top" }}>
                            <div style={{ fontSize: "11px", color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{s.basin}</div>
                            <div style={{ fontFamily: mono, fontSize: "28px", fontWeight: 300, color: "#1D1D1F" }}>${s.spread.toFixed(2)}</div>
                            <div style={{ fontSize: "11px", color: dirColor, marginTop: "8px", lineHeight: "1.5" }}>{dirText}</div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* ====== DEALS ====== */}
            <SectionLabel>This Week&apos;s Deals</SectionLabel>
            <p style={{ fontSize: "13px", color: "#6E6E73", lineHeight: "1.7", margin: "0 0 16px" }}>
              The week&apos;s largest verified transactions, anonymized to protect reporter confidentiality. These deals anchor the BRINE index.
            </p>
            {deals.map((deal, i) => (
              <div key={i} style={{ border: "1px solid #E8E8ED", borderRadius: "12px", padding: "24px 28px", marginBottom: "12px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>
                        <div style={{ fontFamily: mono, fontSize: "28px", fontWeight: 300, color: "#1D1D1F" }}>${deal.price_per_bbl.toFixed(2)}/BBL</div>
                        <div style={{ marginTop: "10px" }}>{gradePill(deal.grade)}</div>
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ fontSize: "12px", color: "#AEAEB2" }}>{deal.basin}</div>
                        <div style={{ fontFamily: mono, fontSize: "14px", color: "#1D1D1F", fontWeight: 500, marginTop: "2px" }}>{formatVolume(deal.volume_bbl_per_day)}</div>
                        <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "2px" }}>Week of {deal.week_of}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #F5F5F7", fontSize: "12px", color: "#AEAEB2" }}>
                  Verified arm&apos;s-length transaction &middot; Included in BRINE index calculation
                </div>
              </div>
            ))}

            {/* ====== NARRATIVE ====== */}
            <SectionLabel>What&apos;s Moving &amp; Why</SectionLabel>
            {narrative.map((p, i) => (
              <p key={i} style={{ fontSize: "14px", color: "#3D3D3F", lineHeight: "1.8", margin: "0 0 14px", fontWeight: 400 }}>{p}</p>
            ))}

            {/* ====== WHY IT MATTERS ====== */}
            <div style={{ background: "#E8F7F2", borderRadius: "12px", padding: "24px 28px", margin: "32px 0" }}>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "#0A6B50", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                Why this matters
              </div>
              <p style={{ fontSize: "14px", color: "#1D3D30", lineHeight: "1.75", margin: "0" }}>
                Produced water is the largest waste stream in U.S. energy production &mdash; and one of the most underleveraged resources. Every barrel of water recycled instead of disposed reduces freshwater demand, lowers disposal costs, and shrinks the environmental footprint of oil and gas operations.
                <br /><br />
                When you report your transactions to BRINE, you are helping build the price transparency that makes the recycled water market function. A market that functions efficiently recycles more water. That is good for your bottom line and good for the basin you operate in.
                <br /><br />
                <strong style={{ color: "#0A6B50" }}>BRINE exists to make that market real.</strong>
              </p>
            </div>

            {/* ====== REGULATORY ====== */}
            <SectionLabel>Policy to Watch</SectionLabel>
            <p style={{ fontSize: "13px", color: "#6E6E73", lineHeight: "1.7", margin: "0 0 16px" }}>
              Regulatory changes that affect how produced water is valued, moved, and treated. Staying ahead of these shifts is part of what your BRINE subscription is for.
            </p>

            <div style={{ padding: "14px 0", borderBottom: "1px solid #F5F5F7" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "top", width: "70px", paddingRight: "12px", paddingTop: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: "#FEF7EE", color: "#7A4100", border: "0.5px solid #FAC775", display: "inline-block", whiteSpace: "nowrap" }}>Texas</span>
                    </td>
                    <td style={{ fontSize: "13px", color: "#6E6E73", lineHeight: "1.7" }}>
                      <strong style={{ color: "#1D1D1F" }}>RRC proposed rule on produced water surface discharge</strong> &mdash; The Texas Railroad Commission published a draft framework for limited surface discharge of treated produced water. If finalized, Frac-Ready grade water meeting the proposed TDS threshold would qualify, potentially creating a new demand outlet and supporting prices. Comment period closes May 15.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ padding: "14px 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "top", width: "70px", paddingRight: "12px", paddingTop: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: "#FEF7EE", color: "#7A4100", border: "0.5px solid #FAC775", display: "inline-block", whiteSpace: "nowrap" }}>New Mexico</span>
                    </td>
                    <td style={{ fontSize: "13px", color: "#6E6E73", lineHeight: "1.7" }}>
                      <strong style={{ color: "#1D1D1F" }}>NMOCD tightens disposal well permit timelines</strong> &mdash; New permits now face a 90-day review window, up from 45 days. Operators report growing disposal capacity pressure in the Delaware, reflected in Basic grade pricing floors holding firm.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ====== FOOTER ====== */}
          <div style={{ background: "#F5F5F7", padding: "32px 48px", borderTop: "3px solid #1D9E75" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top" }}>
                    <div style={{ fontFamily: mono, fontSize: "15px", fontWeight: 600, color: "#1D1D1F" }}>BRINE<span style={{ color: "#1D9E75" }}>.</span></div>
                    <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "3px" }}>The Water Price Reporting Agency</div>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top", fontSize: "12px", color: "#6E6E73" }}>
                    <a href="#" style={{ color: "#6E6E73" }}>Manage my subscription</a>
                    &nbsp;&middot;&nbsp;
                    <a href="#" style={{ color: "#6E6E73" }}>Download data</a>
                    &nbsp;&middot;&nbsp;
                    <a href="#" style={{ color: "#6E6E73" }}>View methodology</a>
                    &nbsp;&middot;&nbsp;
                    <a href="#" style={{ color: "#6E6E73" }}>Unsubscribe</a>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ height: "1px", background: "#E8E8ED", margin: "20px 0" }} />

            <p style={{ fontSize: "12px", color: "#AEAEB2", textAlign: "center", lineHeight: "1.7", margin: "0 0 12px" }}>
              Every transaction reported to BRINE helps build a more transparent, efficient water market. Thank you for being part of it.
            </p>

            <p style={{ fontSize: "10px", color: "#C7C7CC", textAlign: "center", margin: "0", lineHeight: "1.7" }}>
              Index reflects volume-weighted average of Verified and Published operator submissions. Not enough data rule: fewer than 3 reporters or less than 10,000 BBL/day &mdash; no index published for that cell. Credibility over completeness, always. &middot; &copy; 2026 BRINE Intelligence LLC &middot; brine.io
            </p>
          </div>

        </div>
      </Body>
    </Html>
  );
}

/* ---- helper components ---- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: "40px 0 20px" }}>
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "3px", verticalAlign: "top", paddingRight: "12px" }}>
              <div style={{ width: "3px", height: "16px", background: "#1D9E75", borderRadius: "2px" }} />
            </td>
            <td>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "#1D1D1F", letterSpacing: "0.04em" }}>{children}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ height: "1px", background: "#E8E8ED", marginTop: "12px" }} />
    </div>
  );
}

function StatBox({ label, value, context, border, price, volume }: { label: string; value: string; context: string; border?: boolean; price?: boolean; volume?: boolean }) {
  const isCompact = price || volume;
  return (
    <td style={{ verticalAlign: "top", paddingRight: border ? "40px" : "0", borderRight: border ? "1px solid #E8E8ED" : "none", minWidth: "120px" }}>
      <div style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#AEAEB2", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{
        fontFamily: price ? mono : sans,
        fontSize: isCompact ? "26px" : "32px",
        fontWeight: price ? 300 : 200,
        color: "#1D1D1F",
        letterSpacing: price ? "-0.01em" : volume ? "-0.02em" : "-0.03em",
        lineHeight: "1",
        margin: "6px 0 4px",
        whiteSpace: "nowrap",
      }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#AEAEB2", whiteSpace: "nowrap" }}>{context}</div>
    </td>
  );
}
