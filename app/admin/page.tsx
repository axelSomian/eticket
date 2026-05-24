import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [total, valid, used, cancelled, vip] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "VALID" } }),
    prisma.ticket.count({ where: { status: "USED" } }),
    prisma.ticket.count({ where: { status: "CANCELLED" } }),
    prisma.ticket.count({ where: { ticketType: "VIP" } }),
  ]);

  const recentTickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "Total invités", value: total, max: 250, color: "amber" },
    { label: "Valides", value: valid, color: "green" },
    { label: "Scannés / Entrés", value: used, color: "blue" },
    { label: "Annulés", value: cancelled, color: "red" },
    { label: "VIP", value: vip, color: "purple" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Gala de Retrouvailles</p>
        </div>
        <Link
          href="/admin/create"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition"
        >
          + Créer un ticket
        </Link>
      </div>

      {/* Barre de progression */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-300 font-medium">Capacité</span>
          <span className="text-white font-bold">{total} / 250</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${Math.min((total / 250) * 100, 100)}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">{250 - total} places restantes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tickets récents */}
      {recentTickets.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-white font-semibold">Derniers tickets créés</h2>
            <Link href="/admin/tickets" className="text-amber-400 text-sm hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentTickets.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {t.firstName} {t.lastName}
                  </p>
                  <p className="text-gray-500 text-sm">{t.ticketNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  {t.ticketType === "VIP" && (
                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      VIP
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      t.status === "VALID"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : t.status === "USED"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {t.status === "VALID" ? "Valide" : t.status === "USED" ? "Scanné" : "Annulé"}
                  </span>
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    className="text-gray-400 hover:text-white text-sm transition"
                  >
                    →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
