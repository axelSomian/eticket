import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.HMAC_SECRET!;

export function signTicket(ticketId: string, ticketNumber: string): string {
  return createHmac("sha256", SECRET)
    .update(`${ticketId}:${ticketNumber}`)
    .digest("hex");
}

export function verifyTicketSignature(
  ticketId: string,
  ticketNumber: string,
  signature: string
): boolean {
  const expected = signTicket(ticketId, ticketNumber);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export function generateTicketNumber(index: number): string {
  const padded = String(index).padStart(4, "0");
  return `GALA-${padded}`;
}
