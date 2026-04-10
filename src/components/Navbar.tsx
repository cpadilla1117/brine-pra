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
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "#E8E8ED",
        borderWidth: "0 0 0.5px 0",
        height: "52px",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-mono text-[17px] font-semibold tracking-[0.08em]"
          style={{ color: "#1D1D1F" }}
        >
          BRINE<span style={{ color: "#1D9E75" }}>.</span>
        </Link>

        <div className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors"
              style={{
                fontSize: "13px",
                fontWeight: pathname === link.href ? 500 : 400,
                color: pathname === link.href ? "#1D1D1F" : "#6E6E73",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <>
              <span style={{ fontSize: "13px", color: "#6E6E73" }}>
                {profile.email}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#0A6B50",
                  background: "#E8F7F2",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  border: "0.5px solid #1D9E75",
                  textTransform: "uppercase",
                }}
              >
                {profile.role}
              </span>
            </>
          )}
          <button
            onClick={handleSignOut}
            className="hover:underline"
            style={{ fontSize: "13px", color: "#6E6E73", background: "none", border: "none", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
