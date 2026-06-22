import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export type LiveStats = {
  total: number;
  valid: number;
  used: number;
  cancelled: number;
  vip: number;
  revenue: number;
  individuelPaid: number;
  gbonhiOffersPaid: number;
};

async function fetchStats(): Promise<LiveStats> {
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
  return { total, valid, used, cancelled, vip, revenue, individuelPaid, gbonhiOffersPaid };
}

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const stats = await fetchStats();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
        } catch {
          // skip on DB error
        }
      };

      await send();
      const interval = setInterval(send, 3000);

      setTimeout(() => {
        clearInterval(interval);
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      }, 55_000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
