import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export type LiveStats = {
  total: number;
  valid: number;
  used: number;
  cancelled: number;
  vip: number;
};

async function fetchStats(): Promise<LiveStats> {
  const [total, valid, used, cancelled, vip] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "VALID" } }),
    prisma.ticket.count({ where: { status: "USED" } }),
    prisma.ticket.count({ where: { status: "CANCELLED" } }),
    prisma.ticket.count({ where: { ticketType: "VIP" } }),
  ]);
  return { total, valid, used, cancelled, vip };
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

      // Send immediately then every 3s
      await send();
      const interval = setInterval(send, 3000);

      // Close after 55s — EventSource reconnects automatically
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
