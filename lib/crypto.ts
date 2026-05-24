import { createHmac } from "crypto";

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
  return expected === signature;
}

export function generateTicketNumber(index: number): string {
  const padded = String(index).padStart(4, "0");
  return `GALA-${padded}`;
}
