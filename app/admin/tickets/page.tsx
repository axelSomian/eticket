import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ShareTicketButtons from "@/components/ShareTicketButtons";

function statusLabel(s: string) {
  return s === "VALID" ? "Valide" : s === "USED" ? "Scanné" : "Annulé";
}
function statusClass(s: string) {
  return s === "VALID"
    ? "bg-green-500/10 text-green-400 border-green-500/20"
    : s === "USED"
    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20";
}

export default async function TicketsListPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tous les tickets</h1>
          <p className="text-gray-400 text-sm mt-1">{tickets.length} ticket(s)</p>
        </div>
        <Link
          href="/admin/create"
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition"
        >
          + Créer
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Aucun ticket créé.</p>
            <Link href="/admin/create" className="text-amber-400 text-sm hover:underline mt-2 inline-block">
              Créer le premier ticket →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Mobile cards (< sm) ── */}
            <div className="sm:hidden divide-y divide-gray-800">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tickets/${t.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-4 hover:bg-gray-800/50 active:bg-gray-800 transition"
                >
                  <div className="min-w-0">
                    <p className="text-amber-400 text-sm font-mono">{t.ticketNumber}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {t.ticketType === "GBONHI" ? "Offre Gbonhi" : "Individuel"}
                      {t.holderName && <span className="text-gray-300"> · {t.holderName}</span>}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                    {t.ticketType === "GBONHI" && (
                      <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Gbonhi
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Desktop table (≥ sm) ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Offre</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-amber-400 whitespace-nowrap">{t.ticketNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${
                            t.ticketType === "GBONHI"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-gray-700 text-gray-300 border-gray-600"
                          }`}>
                            {t.ticketType === "GBONHI" ? "Gbonhi" : "Individuel"}
                          </span>
                          {t.holderName && <span className="text-gray-400 text-xs pl-1">{t.holderName}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass(t.status)}`}>
                          {statusLabel(t.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap hidden lg:table-cell">
                        {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <ShareTicketButtons
                            ticketId={t.id}
                            ticketNumber={t.ticketNumber}
                            ticketType={t.ticketType}
                            variant="compact"
                          />
                          <Link href={`/admin/tickets/${t.id}`} className="text-amber-400 hover:text-amber-300 text-sm transition">
                            Détails →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
