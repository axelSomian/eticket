import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import DownloadButton from "@/components/DownloadButton";
import ShareButton from "@/components/ShareButton";

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { table: { select: { number: true } } },
  });
  if (!ticket) notFound();

  const qrData = JSON.stringify({ id: ticket.id, sig: ticket.signature });
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 280,
    color: { dark: "#101218", light: "#FFFFFF" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const ticketUrl = `${appUrl}/ticket/${ticket.id}`;

  const statusConfig = {
    VALID: { label: "Valide", className: "bg-green-500/10 text-green-400 border-green-500/20" },
    USED: { label: "Déjà utilisé", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    CANCELLED: { label: "Annulé", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  };

  const status = statusConfig[ticket.status];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-1">
          Gala de Retrouvailles
        </p>
        <h1 className="text-3xl font-bold text-white">Votre invitation</h1>
      </div>

      {/* Ticket Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Bandeau doré */}
        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
              {ticket.ticketType === "VIP" ? "Billet VIP" : "Billet Standard"}
            </p>
            <p className="text-black font-bold text-lg font-mono">{ticket.ticketNumber}</p>
          </div>
          {ticket.ticketType === "VIP" && (
            <div className="bg-black/15 px-3 py-1 rounded-full">
              <span className="text-black font-bold text-sm">VIP</span>
            </div>
          )}
        </div>

        {/* Séparateur perforé */}
        <div className="relative h-4 bg-gray-900">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-950" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-950" />
          <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-gray-700" />
        </div>

        {/* Contenu */}
        <div className="px-6 pb-6 pt-2 space-y-5">
          {/* Nom */}
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Invité(e)</p>
            <p className="text-white text-xl font-bold">
              {ticket.firstName} {ticket.lastName}
            </p>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {ticket.table?.number && (
              <div className="bg-gray-800/60 rounded-xl px-3 py-2">
                <p className="text-gray-500 text-xs mb-0.5">Table</p>
                <p className="text-white font-semibold">{ticket.table.number}</p>
              </div>
            )}
            <div className="bg-gray-800/60 rounded-xl px-3 py-2">
              <p className="text-gray-500 text-xs mb-0.5">Statut</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <Image
                src={qrCodeDataUrl}
                alt="QR Code de votre ticket"
                width={200}
                height={200}
                priority
              />
            </div>
            <p className="text-gray-500 text-xs text-center">
              Présentez ce QR code à l&apos;entrée
            </p>
          </div>

          {/* Boutons */}
          <div className="space-y-2">
            <DownloadButton ticketId={ticket.id} />
            <ShareButton url={ticketUrl} name={`${ticket.firstName} ${ticket.lastName}`} />
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-xs text-center mt-8 max-w-xs">
        Ce ticket est personnel et non cessible. Il sera invalidé après usage.
      </p>
    </div>
  );
}
