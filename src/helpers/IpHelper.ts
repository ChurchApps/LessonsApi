export class IpHelper {
  /**
   * True for an address a geolocation provider can answer for. Loopback, private, link-local,
   * carrier-NAT, multicast and unspecified ranges are false: they come from calls made inside the
   * VPC and never resolve (ipgeolocation.io answers 423 for them, forever).
   */
  static isPublic(ip: string | undefined | null): boolean {
    if (!ip || typeof ip !== "string") return false;
    const value = ip.trim();
    if (value.includes(":")) return this.isPublicV6(value);
    return this.isPublicV4(value);
  }

  private static isPublicV4(ip: string): boolean {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    const octets = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
    if (octets.some((o) => Number.isNaN(o) || o > 255)) return false;
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a >= 224) return false;
    return true;
  }

  private static isPublicV6(ip: string): boolean {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mapped) return this.isPublicV4(mapped[1]);
    if (lower === "::1" || lower === "::") return false;
    if (lower.startsWith("fe80:") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return false;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
    if (lower.startsWith("ff")) return false;
    return /^[0-9a-f:]+$/.test(lower);
  }
}
