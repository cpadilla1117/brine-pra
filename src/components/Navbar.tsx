"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/database";
import { DEMO, DEMO_PROFILE } from "@/lib/demo-data";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (DEMO) {
      setProfile(DEMO_PROFILE);
      return;
    }
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data as Profile);
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  const links = [
    ...NAV_LINKS,
    ...(profile?.role === "admin" ? ADMIN_LINKS : []),
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="font-mono text-sm font-bold tracking-wider text-foreground"
            >
              BRINE
            </Link>
            <div className="flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    pathname === link.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <>
                <span className="text-xs text-muted-foreground font-mono">
                  {profile.email}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                  {profile.role}
                </span>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
