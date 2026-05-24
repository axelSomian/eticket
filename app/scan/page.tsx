import { requireScanner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRScanner from "@/components/QRScanner";
import LogoutButton from "@/components/LogoutButton";

export default async function ScanPage() {
  await requireScanner();

  const [total, used] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ["VALID", "USED"] } } }),
    prisma.ticket.count({ where: { status: "USED" } }),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-semibold text-sm">Scanner actif</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            <span className="text-white font-bold">{used}</span>
            <span className="text-gray-600"> / </span>
            <span className="text-white font-bold">{total}</span>
            <span className="text-gray-500 ml-1">entrées</span>
          </span>
          <LogoutButton />
        </div>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Gala de Retrouvailles</h1>
          <p className="text-gray-400 text-sm mt-1">Validation des tickets</p>
        </div>

        <QRScanner />
      </div>
    </div>
  );
}
