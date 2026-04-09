import { Html, Head, Body } from "@react-email/components";
import * as React from "react";
import type { BrineNewsletterData, GradeIndex } from "@/lib/newsletter-mock-data";
import { formatVolume, formatVolumeTotal } from "@/lib/format-helpers";

/* ============================================================
   HELPERS
   ============================================================ */

const mono = "monospace";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function gradePill(grade: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    Basic: { bg: "#FAEEDA", color: "#633806" },
    Secondary: { bg: "#E6F1FB", color: "#0C447C" },
    "Frac-Ready": { bg: "#E1F5EE", color: "#085041" },
  };
  const s = styles[grade] || styles["Basic"];
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "4px",
        fontFamily: "sans-serif",
        letterSpacing: "0.03em",
      }}
    >
      {grade}
    </span>
  );
}

function deltaDisplay(delta: number | null) {
  if (delta === null || delta === 0)
    return <span style={{ color: "#888780" }}>—</span>;
  if (delta > 0)
    return (
      <span style={{ color: "#1D9E75" }}>+${delta.toFixed(2)}</span>
    );
  return (
    <span style={{ color: "#D85A30" }}>
      -${Math.abs(delta).toFixed(2)}
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
    {
      fracReady: number | null;
      basic: number | null;
      fracDelta: number | null;
      basicDelta: number | null;
    }
  >();

  for (const row of rows) {
    if (!basins.has(row.basin)) {
      basins.set(row.basin, {
        fracReady: null,
        basic: null,
        fracDelta: null,
        basicDelta: null,
      });
    }
    const entry = basins.get(row.basin)!;
    if (row.grade === "Frac-Ready" && !row.thin) {
      entry.fracReady = row.vwap;
      entry.fracDelta = row.delta;
    }
    if (row.grade === "Basic" && !row.thin) {
      entry.basic = row.vwap;
      entry.basicDelta = row.delta;
    }
  }

  const spreads: SpreadData[] = [];
  basins.forEach((vals, basin) => {
    if (vals.fracReady !== null && vals.basic !== null) {
      const spread = vals.fracReady - vals.basic;
      // Direction: compare deltas to estimate spread movement
      const fracD = vals.fracDelta ?? 0;
      const basicD = vals.basicDelta ?? 0;
      const spreadDelta = fracD - basicD;
      const direction: "up" | "down" | "steady" =
        spreadDelta > 0.005 ? "up" : spreadDelta < -0.005 ? "down" : "steady";
      spreads.push({ basin, spread, direction });
    }
  });

  return spreads.slice(0, 3);
}

function generateNarrative(data: BrineNewsletterData, spreads: SpreadData[]) {
  const nonThin = data.index_rows.filter((r) => !r.thin && r.vwap !== null);
  if (nonThin.length === 0) {
    return {
      p1: "Insufficient data to generate market narrative this week.",
      p2: "",
    };
  }

  // Paragraph 1: strongest performing grade/basin (highest vwap)
  const top = nonThin.reduce((a, b) => ((a.vwap ?? 0) > (b.vwap ?? 0) ? a : b));
  const verb =
    top.delta !== null && top.delta > 0
      ? "rose"
      : top.delta !== null && top.delta < 0
      ? "fell"
      : "held steady";
  const deltaNote =
    top.delta !== null && top.delta !== 0
      ? ` The move of $${Math.abs(top.delta).toFixed(2)}/BBL ${
          top.delta > 0
            ? "continues a trend of firming prices"
            : "reverses last week\u2019s gains"
        } in the basin.`
      : "";

  const volDisplay = top.volume_bbl_per_day
    ? formatVolume(top.volume_bbl_per_day)
    : "—";
  const p1 = `${top.basin} ${top.grade} ${verb} to $${top.vwap?.toFixed(
    2
  )}/BBL this week on ${volDisplay} across ${top.reporter_count} reporters.${deltaNote}`;

  // Paragraph 2: widest spread basin
  let p2 = "";
  if (spreads.length > 0) {
    const widest = spreads.reduce((a, b) => (a.spread > b.spread ? a : b));
    const spreadVerb =
      widest.direction === "up"
        ? "widened"
        : widest.direction === "down"
        ? "narrowed"
        : "held";
    const economics =
      widest.direction === "up"
        ? "increasingly compelling"
        : widest.direction === "down"
        ? "softening"
        : "stable";
    p2 = `The BRINE Spread in ${
      widest.basin
    } ${spreadVerb} at $${widest.spread.toFixed(
      2
    )}/BBL, suggesting treatment economics are ${economics} at current price levels.`;
  }

  return { p1, p2 };
}

/* ============================================================
   SHARED STYLES
   ============================================================ */

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#888780",
  borderBottom: "1px solid #e8e6df",
  paddingBottom: "8px",
  margin: "28px 0 14px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  fontSize: "10px",
  color: "#888780",
  fontWeight: 400,
  padding: "8px 10px",
  borderBottom: "1px solid #e8e6df",
  letterSpacing: "0.06em",
};

const tdBase: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #f0ede8",
};

const statBoxLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#888780",
  marginBottom: "4px",
};

const statBoxValueStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  fontFamily: mono,
  color: "#0a0f1e",
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function BrineNewsletter(props: BrineNewsletterData) {
  const { issue_number, publish_date, index_rows, deals } = props;

  const spreads = computeSpreads(index_rows);
  const narrative = generateNarrative(props, spreads);

  // Stat bar computations
  const nonThinRows = index_rows.filter((r) => !r.thin);
  const basinsCovered = new Set(nonThinRows.map((r) => r.basin)).size;
  const fracReadyRows = nonThinRows.filter((r) => r.grade === "Frac-Ready");
  const avgFracReady =
    fracReadyRows.length > 0
      ? fracReadyRows.reduce((s, r) => s + (r.vwap ?? 0), 0) /
        fracReadyRows.length
      : 0;
  const totalVolume = nonThinRows.reduce(
    (s, r) => s + (r.volume_bbl_per_day ?? 0),
    0
  );
  const totalReporters = nonThinRows.reduce(
    (s, r) => s + r.reporter_count,
    0
  );

  return (
    <Html>
      <Head />
      <Body
        style={{
          margin: "0",
          padding: "20px 0",
          backgroundColor: "#f0efeb",
          fontFamily: sans,
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
          }}
        >
          {/* ====== HEADER ====== */}
          <div
            style={{
              background: "#0a0f1e",
              padding: "28px 32px 24px",
              borderRadius: "10px 10px 0 0",
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: "28px",
                fontWeight: 500,
                color: "#e8e6df",
                letterSpacing: "0.08em",
              }}
            >
              BRINE<span style={{ color: "#1D9E75" }}>.</span>
            </div>
            <div
              style={{
                fontFamily: mono,
                fontSize: "11px",
                color: "#888780",
                letterSpacing: "0.06em",
                marginTop: "6px",
              }}
            >
              BASIN RESOURCE INTELLIGENCE &amp; NEGOTIATED EXCHANGE
              &nbsp;&middot;&nbsp; ISSUE {issue_number}
              &nbsp;&middot;&nbsp; {publish_date}
            </div>
          </div>

          {/* ====== STAT BAR ====== */}
          <div
            style={{
              background: "#f5f4f0",
              padding: "16px 32px",
              borderBottom: "1px solid #e8e6df",
            }}
          >
            {/*
              Using table layout for email compatibility instead of flex.
            */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "0 16px 0 0", verticalAlign: "top" }}>
                    <div style={statBoxLabelStyle}>BASINS COVERED</div>
                    <div style={statBoxValueStyle}>{basinsCovered}</div>
                  </td>
                  <td style={{ padding: "0 16px 0 0", verticalAlign: "top" }}>
                    <div style={statBoxLabelStyle}>AVG FRAC-READY</div>
                    <div style={statBoxValueStyle}>
                      ${avgFracReady.toFixed(2)}
                    </div>
                  </td>
                  <td style={{ padding: "0 16px 0 0", verticalAlign: "top" }}>
                    <div style={statBoxLabelStyle}>TOTAL VOLUME</div>
                    <div style={statBoxValueStyle}>
                      {formatVolumeTotal(totalVolume)}
                    </div>
                  </td>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div style={statBoxLabelStyle}>REPORTERS</div>
                    <div style={statBoxValueStyle}>{totalReporters}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== BODY ====== */}
          <div
            style={{
              background: "#ffffff",
              padding: "0 32px 32px",
              border: "1px solid #e8e6df",
              borderTop: "none",
              borderRadius: "0 0 10px 10px",
            }}
          >
            {/* ====== PRICE INDEX TABLE ====== */}
            <div style={sectionLabelStyle}>PRICE INDEX</div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: mono,
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "#f5f4f0" }}>
                  <th style={{ ...thStyle, textAlign: "left" }}>BASIN</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>GRADE</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>$/BBL</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>WK DELTA</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>
                    VOLUME
                  </th>
                  <th style={{ ...thStyle, textAlign: "right" }}>REPORTERS</th>
                </tr>
              </thead>
              <tbody>
                {index_rows.map((row, i) => (
                  <tr
                    key={`${row.basin}-${row.grade}`}
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#fafaf8",
                    }}
                  >
                    <td
                      style={{
                        ...tdBase,
                        color: "#666",
                        fontSize: "12px",
                      }}
                    >
                      {row.basin}
                    </td>
                    <td style={tdBase}>{gradePill(row.grade)}</td>
                    <td style={{ ...tdBase, textAlign: "right" }}>
                      {row.thin ? (
                        <span
                          style={{
                            color: "#aaa",
                            fontStyle: "italic",
                            fontSize: "11px",
                            fontFamily: sans,
                          }}
                        >
                          thin market
                        </span>
                      ) : (
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#0a0f1e",
                          }}
                        >
                          ${row.vwap?.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdBase, textAlign: "right" }}>
                      {row.thin ? (
                        <span style={{ color: "#888780" }}>—</span>
                      ) : (
                        deltaDisplay(row.delta)
                      )}
                    </td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "right",
                        color: "#444",
                        fontSize: "12px",
                      }}
                    >
                      {row.thin ? (
                        <span style={{ color: "#888780" }}>—</span>
                      ) : (
                        formatVolume(row.volume_bbl_per_day ?? 0)
                      )}
                    </td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "right",
                        color: "#888780",
                      }}
                    >
                      {row.reporter_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ====== BRINE SPREAD ====== */}
            {spreads.length > 0 && (
              <>
                <div style={sectionLabelStyle}>
                  BRINE SPREAD (FRAC-READY – BASIC)
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "12px 0",
                    marginLeft: "-12px",
                    marginTop: "4px",
                  }}
                >
                  <tbody>
                    <tr>
                      {spreads.map((s) => {
                        const dirColor =
                          s.direction === "up"
                            ? "#1D9E75"
                            : s.direction === "down"
                            ? "#D85A30"
                            : "#888780";
                        const dirText =
                          s.direction === "up"
                            ? "\u25B2 widening"
                            : s.direction === "down"
                            ? "\u25BC narrowing"
                            : "— steady";
                        return (
                          <td
                            key={s.basin}
                            style={{
                              border: "1px solid #e8e6df",
                              borderRadius: "8px",
                              padding: "14px 16px",
                              verticalAlign: "top",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#888780",
                                marginBottom: "4px",
                              }}
                            >
                              {s.basin}
                            </div>
                            <div
                              style={{
                                fontSize: "22px",
                                fontWeight: 600,
                                fontFamily: mono,
                                color: "#0a0f1e",
                              }}
                            >
                              ${s.spread.toFixed(2)}/BBL
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#888780",
                                marginTop: "4px",
                              }}
                            >
                              Frac-Ready premium over Basic
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                marginTop: "6px",
                                color: dirColor,
                              }}
                            >
                              {dirText}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* ====== DEAL SPOTLIGHT ====== */}
            <div style={sectionLabelStyle}>DEAL SPOTLIGHT</div>
            {deals.map((deal, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e8e6df",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  marginBottom: "12px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: "24px",
                            fontWeight: 600,
                            color: "#0a0f1e",
                          }}
                        >
                          ${deal.price_per_bbl.toFixed(2)}/BBL
                        </div>
                        <div style={{ marginTop: "8px" }}>
                          {gradePill(deal.grade)}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ fontSize: "12px", color: "#888780" }}>
                          {deal.basin}
                        </div>
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: "13px",
                            color: "#0a0f1e",
                            marginTop: "2px",
                          }}
                        >
                          {deal.volume_bbl_per_day.toLocaleString()} BBL/d
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#aaa",
                            marginTop: "2px",
                          }}
                        >
                          Week of {deal.week_of}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            {/* ====== MARKET NARRATIVE ====== */}
            <div style={sectionLabelStyle}>MARKET NARRATIVE</div>
            <p
              style={{
                fontSize: "13px",
                color: "#444",
                lineHeight: "1.8",
                fontFamily: sans,
                margin: "0 0 12px",
              }}
            >
              {narrative.p1}
            </p>
            {narrative.p2 && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#444",
                  lineHeight: "1.8",
                  fontFamily: sans,
                  margin: "0 0 12px",
                }}
              >
                {narrative.p2}
              </p>
            )}

            {/* ====== REGULATORY WATCH ====== */}
            <div style={sectionLabelStyle}>REGULATORY WATCH</div>

            <div
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #f0ede8",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        verticalAlign: "top",
                        width: "70px",
                        paddingRight: "12px",
                        paddingTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "#FEF3C7",
                          color: "#92400E",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                      >
                        Texas
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: "1.7",
                      }}
                    >
                      <strong style={{ color: "#222" }}>
                        RRC proposed rule on produced water surface discharge
                      </strong>{" "}
                      — The Texas Railroad Commission published a draft
                      framework for limited surface discharge of treated
                      produced water. If finalized, Frac-Ready grade water
                      meeting the proposed TDS threshold would qualify,
                      potentially creating a new demand outlet and supporting
                      prices. Comment period closes May 15.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ padding: "12px 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        verticalAlign: "top",
                        width: "70px",
                        paddingRight: "12px",
                        paddingTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "#FEF3C7",
                          color: "#92400E",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                      >
                        New Mexico
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: "1.7",
                      }}
                    >
                      <strong style={{ color: "#222" }}>
                        NMOCD tightens disposal well permit timelines
                      </strong>{" "}
                      — New permits now face a 90-day review window, up from
                      45 days. Operators report growing disposal capacity
                      pressure in the Delaware, reflected in Basic grade
                      pricing floors holding firm.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ====== FOOTER ====== */}
          <div
            style={{
              marginTop: "0",
              padding: "20px 32px",
              background: "#f5f4f0",
              borderTop: "2px solid #1D9E75",
              borderRadius: "0 0 10px 10px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top" }}>
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#0a0f1e",
                      }}
                    >
                      BRINE<span style={{ color: "#1D9E75" }}>.</span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#888780",
                        marginTop: "4px",
                      }}
                    >
                      &copy; 2026 BRINE Intelligence LLC &middot; Published
                      by BRINE Market Administration &middot;
                      admin@brine.io &middot; brine.io
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontSize: "11px",
                      color: "#888780",
                      verticalAlign: "top",
                    }}
                  >
                    <a href="#" style={{ color: "#888780" }}>
                      Manage subscription
                    </a>
                    &nbsp;&middot;&nbsp;
                    <a href="#" style={{ color: "#888780" }}>
                      Download data (CSV)
                    </a>
                    &nbsp;&middot;&nbsp;
                    <a href="#" style={{ color: "#888780" }}>
                      View methodology
                    </a>
                    &nbsp;&middot;&nbsp;
                    <a href="#" style={{ color: "#888780" }}>
                      Unsubscribe
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                marginTop: "16px",
                fontSize: "10px",
                color: "#aaa",
                lineHeight: "1.7",
                borderTop: "1px solid #e8e6df",
                paddingTop: "12px",
              }}
            >
              Index reflects volume-weighted average of Verified and Published
              operator submissions. Thin market rule: fewer than 3 reporters
              or less than 10,000 BBL/day — no index published for that cell.
              Credibility over completeness. &nbsp;&middot;&nbsp; BRINE is
              published every Tuesday and Friday. &nbsp;&middot;&nbsp;
              Methodology available at brine.io/methodology
            </div>
          </div>
        </div>
      </Body>
    </Html>
  );
}
