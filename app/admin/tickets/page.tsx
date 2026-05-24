import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TicketsListPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tous les tickets</h1>
          <p className="text-gray-400 text-sm mt-1">{tickets.length} ticket(s) au total</p>
        </div>
        <Link
          href="/admin/create"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition"
        >
          + Créer
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Aucun ticket créé pour le moment.</p>
            <Link href="/admin/create" className="text-amber-400 text-sm hover:underline mt-2 inline-block">
              Créer le premier ticket →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invité</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-amber-400">{t.ticketNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">
                        {t.firstName} {t.lastName}
                      </p>
                      {t.email && <p className="text-gray-500 text-xs">{t.email}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          t.ticketType === "VIP"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-gray-700 text-gray-300 border-gray-600"
                        }`}
                      >
                        {t.ticketType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{t.tableNumber || "—"}</td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="text-amber-400 hover:text-amber-300 text-sm transition"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
