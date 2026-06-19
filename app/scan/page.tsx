import { requireScanner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRScanner from "@/components/QRScanner";
import LogoutButton from "@/components/LogoutButton";
import LiveCounter from "@/components/LiveCounter";

export default async function ScanPage() {
  const session = await requireScanner();

  const [total, used] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ["VALID", "USED"] } } }),
    prisma.ticket.count({ where: { status: "USED" } }),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-semibold text-sm">Scanner actif</span>
        </div>
        <div className="flex items-center gap-4">
          <LiveCounter initialUsed={used} initialTotal={total} />
          <LogoutButton />
        </div>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Gala de Retrouvailles</h1>
          <p className="text-gray-400 text-sm mt-1">Validation des tickets</p>
        </div>

        <QRScanner username={session.username} />
      </div>
    </div>
  );
}
