import crypto from "crypto";

const DEFAULT_SECRET = "pea-ice-cream-guest-order-secret-makassar-2026";
const SECRET = process.env.GUEST_ORDER_SECRET || DEFAULT_SECRET;

/**
 * Buat signed guest token untuk pesanan tertentu.
 * Format token: `${ref}.${timestamp}.${hmac}`
 */
export function generateGuestToken(orderRef: string): { token: string; hash: string } {
  const timestamp = Date.now().toString();
  const payload = `${orderRef}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  const token = `${orderRef}.${timestamp}.${hmac}`;

  // Hash untuk disimpan di database
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, hash };
}

/**
 * Validasi signed guest token.
 * Memastikan token ditujukan untuk orderRef yang sesuai dan belum kadaluarsa (7 hari).
 */
export function verifyGuestToken(orderRef: string, token: string | undefined): boolean {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [tokenRef, timestampStr, providedHmac] = parts;
    if (tokenRef !== orderRef) return false;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 hari

    if (isNaN(timestamp) || now - timestamp > maxAge || timestamp > now + 60000) {
      return false;
    }

    const payload = `${orderRef}:${timestampStr}`;
    const expectedHmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}
