"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/create", label: "Créer un ticket" },
    { href: "/admin/tickets", label: "Tickets" },
    { href: "/admin/users", label: "Utilisateurs" },
    { href: "/admin/settings", label: "Paramètres" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 relative z-40" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo + desktop links */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-amber-400 font-bold text-lg mr-4 shrink-0">🎟 Admin</span>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  pathname === l.href
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm hidden lg:block truncate max-w-[120px]">{username}</span>
          <button
            onClick={logout}
            className="hidden md:block text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            Déconnexion
          </button>
          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl hover:bg-gray-800 transition gap-[5px]"
            aria-label="Menu"
          >
            <span
              className="block w-5 h-0.5 bg-gray-400 transition-all duration-200 origin-center"
              style={{ transform: open ? "translateY(6.5px) rotate(45deg)" : "" }}
            />
            <span
              className="block w-5 h-0.5 bg-gray-400 transition-all duration-200"
              style={{ opacity: open ? 0 : 1 }}
            />
            <span
              className="block w-5 h-0.5 bg-gray-400 transition-all duration-200 origin-center"
              style={{ transform: open ? "translateY(-6.5px) rotate(-45deg)" : "" }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 border-t border-gray-800" : "max-h-0"
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
          <span className="text-gray-500 text-sm">{username}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
