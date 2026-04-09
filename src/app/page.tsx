import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="font-mono text-4xl font-bold tracking-tight">
          BRINE
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The Water Price Reporting Agency.
          <br />
          Basin-level benchmarks for Permian, Delaware, DJ, and beyond.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/auth"
            className="px-5 py-2 text-sm font-medium bg-accent-frac text-background rounded hover:opacity-90 transition-opacity"
          >
            Operator Login
          </Link>
        </div>
        <div className="pt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded border border-border bg-card">
            <div className="text-xs text-muted-foreground mb-1">
              Water Grades
            </div>
            <div className="text-sm font-mono space-y-0.5">
              <div className="grade-basic">Basic</div>
              <div className="grade-secondary">Secondary</div>
              <div className="grade-frac">Frac-Ready</div>
            </div>
          </div>
          <div className="p-3 rounded border border-border bg-card">
            <div className="text-xs text-muted-foreground mb-1">Coverage</div>
            <div className="text-sm font-mono">7 Basins</div>
          </div>
          <div className="p-3 rounded border border-border bg-card">
            <div className="text-xs text-muted-foreground mb-1">Index</div>
            <div className="text-sm font-mono">Weekly VWAP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
