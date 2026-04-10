"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DEMO } from "@/lib/demo-data";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (DEMO) {
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 400);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } },
        });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    color: "#1D1D1F",
    background: "#FAFAFA",
    border: "0.5px solid #E8E8ED",
    borderRadius: "8px",
    outline: "none",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F5F7" }}>
      <div
        style={{
          width: "400px",
          background: "#FFFFFF",
          border: "0.5px solid #E8E8ED",
          borderRadius: "20px",
          padding: "48px",
        }}
      >
        <div className="text-center" style={{ marginBottom: "32px" }}>
          <h1
            className="font-mono"
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#1D1D1F",
              letterSpacing: "0.08em",
            }}
          >
            BRINE<span style={{ color: "#1D9E75" }}>.</span>
          </h1>
          <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: "8px" }}>
            {mode === "login"
              ? "Sign in to your operator account"
              : "Create a new operator account"}
          </p>
          {DEMO && (
            <p style={{ fontSize: "13px", color: "#1D9E75", marginTop: "8px" }}>
              Demo mode — enter anything to continue
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#1D1D1F", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                placeholder="John Smith"
                required={!DEMO}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#1D1D1F", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@company.com"
              required={!DEMO}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#1D1D1F", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required={!DEMO}
              minLength={DEMO ? 0 : 6}
            />
          </div>

          {error && (
            <div style={{ fontSize: "13px", color: "#FF3B30", background: "#FFF5F5", border: "0.5px solid #FFD4D4", borderRadius: "8px", padding: "10px 14px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 32px",
              fontSize: "15px",
              fontWeight: 500,
              background: "#1D9E75",
              color: "#FFFFFF",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
              marginTop: "8px",
            }}
          >
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: "24px" }}>
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            className="hover:underline"
            style={{ fontSize: "13px", color: "#6E6E73", background: "none", border: "none", cursor: "pointer" }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
