"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/create", label: "Créer un ticket" },
    { href: "/admin/tickets", label: "Tous les tickets" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 font-bold mr-6 text-lg">🎟 Gala Admin</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
