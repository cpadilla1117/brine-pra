import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#FFFFFF" }}>
      <div className="text-center max-w-lg" style={{ padding: "64px 0" }}>
        <h1
          className="font-mono"
          style={{
            fontSize: "34px",
            fontWeight: 600,
            color: "#1D1D1F",
            letterSpacing: "0.08em",
          }}
        >
          BRINE<span style={{ color: "#1D9E75" }}>.</span>
        </h1>
        <p
          style={{
            fontSize: "17px",
            color: "#6E6E73",
            marginTop: "12px",
            lineHeight: 1.5,
            fontWeight: 300,
          }}
        >
          The Water Price Reporting Agency.
          <br />
          Basin-level benchmarks for Permian, Delaware, DJ, and beyond.
        </p>
        <div className="flex gap-3 justify-center" style={{ marginTop: "32px" }}>
          <Link
            href="/auth"
            style={{
              padding: "10px 24px",
              fontSize: "15px",
              fontWeight: 500,
              background: "#1D9E75",
              color: "#FFFFFF",
              borderRadius: "8px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Operator Login
          </Link>
        </div>
        <div
          className="grid grid-cols-3 gap-4"
          style={{ marginTop: "48px" }}
        >
          <div
            style={{
              padding: "20px 16px",
              borderRadius: "12px",
              border: "0.5px solid #E8E8ED",
              background: "#FAFAFA",
            }}
          >
            <div style={{ fontSize: "11px", color: "#AEAEB2", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Water Grades
            </div>
            <div className="font-mono" style={{ fontSize: "13px", color: "#1D1D1F", lineHeight: 1.8 }}>
              <div style={{ color: "#7A4100" }}>Basic</div>
              <div style={{ color: "#0C447C" }}>Secondary</div>
              <div style={{ color: "#085041" }}>Frac-Ready</div>
            </div>
          </div>
          <div
            style={{
              padding: "20px 16px",
              borderRadius: "12px",
              border: "0.5px solid #E8E8ED",
              background: "#FAFAFA",
            }}
          >
            <div style={{ fontSize: "11px", color: "#AEAEB2", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Coverage
            </div>
            <div className="font-mono" style={{ fontSize: "22px", fontWeight: 300, color: "#1D1D1F" }}>
              7 Basins
            </div>
          </div>
          <div
            style={{
              padding: "20px 16px",
              borderRadius: "12px",
              border: "0.5px solid #E8E8ED",
              background: "#FAFAFA",
            }}
          >
            <div style={{ fontSize: "11px", color: "#AEAEB2", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Index
            </div>
            <div className="font-mono" style={{ fontSize: "22px", fontWeight: 300, color: "#1D1D1F" }}>
              Weekly VWAP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
