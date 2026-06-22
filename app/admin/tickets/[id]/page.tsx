import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import TicketActions from "@/components/TicketActions";
import ShareTicketButtons from "@/components/ShareTicketButtons";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) notFound();

  const qrData = JSON.stringify({ id: ticket.id, sig: ticket.signature });
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 260,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets" className="text-gray-400 hover:text-white transition">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold text-white">Détail du ticket</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Infos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-amber-400 font-bold">{ticket.ticketNumber}</span>
            <div className="flex gap-2">
              {ticket.ticketType === "GBONHI" && (
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Gbonhi
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  ticket.status === "VALID"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : ticket.status === "USED"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {ticket.status === "VALID" ? "Valide" : ticket.status === "USED" ? "Scanné" : "Annulé"}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <Row label="Offre" value={ticket.ticketType === "GBONHI" ? "Gbonhi (6 places)" : "Individuel"} />
            {ticket.note && <Row label="Note" value={ticket.note} />}
            <Row
              label="Créé le"
              value={new Date(ticket.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            {ticket.usedAt && (
              <Row
                label="Scanné le"
                value={new Date(ticket.usedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4">
          <p className="text-gray-400 text-sm font-medium">QR Code</p>
          <div className="bg-white p-3 rounded-xl">
            <Image src={qrCodeDataUrl} alt="QR Code" width={200} height={200} />
          </div>
          <Link
            href={`/ticket/${ticket.id}`}
            target="_blank"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl text-sm text-center transition"
          >
            Voir le ticket public
          </Link>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Envoyer le ticket à l&apos;invité</p>
        <ShareTicketButtons
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          ticketType={ticket.ticketType}
          variant="full"
        />
      </div>

      <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}
