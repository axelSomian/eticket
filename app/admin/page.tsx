import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LiveStats from "@/components/LiveStats";

export default async function AdminDashboard() {
  const [total, valid, used, cancelled, vip, individuelPaid, gbonhiPaid] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "VALID" } }),
    prisma.ticket.count({ where: { status: "USED" } }),
    prisma.ticket.count({ where: { status: "CANCELLED" } }),
    prisma.ticket.count({ where: { ticketType: "GBONHI" } }),
    prisma.ticket.count({ where: { ticketType: "INDIVIDUEL", status: { not: "CANCELLED" } } }),
    prisma.ticket.count({ where: { ticketType: "GBONHI", status: { not: "CANCELLED" } } }),
  ]);
  const gbonhiOffersPaid = Math.floor(gbonhiPaid / 6);
  const revenue = individuelPaid * 10_000 + gbonhiOffersPaid * 50_000;

  const recentTickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Gala de Retrouvailles</p>
        </div>
        <Link
          href="/admin/create"
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition"
        >
          + Créer un ticket
        </Link>
      </div>

      <LiveStats initial={{ total, valid, used, cancelled, vip, revenue, individuelPaid, gbonhiOffersPaid }} />

      {recentTickets.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-white font-semibold">Derniers tickets créés</h2>
            <Link href="/admin/tickets" className="text-amber-400 text-sm hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentTickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tickets/${t.id}`}
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-gray-800/50 transition"
              >
                <div className="min-w-0">
                  <p className="text-white font-medium font-mono">{t.ticketNumber}</p>
                  <p className="text-gray-500 text-sm">
                    {t.ticketType === "GBONHI" ? "Offre Gbonhi" : "Individuel"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.ticketType === "GBONHI" && (
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full hidden sm:inline">
                      Gbonhi
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    t.status === "VALID"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : t.status === "USED"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {t.status === "VALID" ? "Valide" : t.status === "USED" ? "Scanné" : "Annulé"}
                  </span>
                  <span className="text-gray-500 text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
