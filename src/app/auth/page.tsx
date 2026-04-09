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
      // Demo mode — skip Supabase, go straight to dashboard
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 400);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            BRINE
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            {mode === "login"
              ? "Sign in to your operator account"
              : "Create a new operator account"}
          </p>
          {DEMO && (
            <p className="text-xs text-accent-frac mt-2">
              Demo mode — enter anything to continue
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent-frac"
                placeholder="John Smith"
                required={!DEMO}
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent-frac"
              placeholder="you@company.com"
              required={!DEMO}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent-frac"
              placeholder="••••••••"
              required={!DEMO}
              minLength={DEMO ? 0 : 6}
            />
          </div>

          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-medium bg-accent-frac text-background rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "login"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
