import axios from "axios";
import dns from "dns/promises";
import https from "https";
import { BlockList, isIP, LookupFunction } from "net";

const TRUSTED_HOST_SUFFIXES = ["lessons.church"];
const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain", "metadata", "metadata.google.internal", "metadata.google.com"]);
const BLOCKED_HOST_SUFFIXES = [
  ".localhost", ".local", ".internal", ".lan", ".home", ".corp", ".private", ".localdomain", ".invalid"
];

const blocked = new BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("198.18.0.0", 15, "ipv4");
blocked.addSubnet("224.0.0.0", 4, "ipv4");
blocked.addAddress("255.255.255.255", "ipv4");
blocked.addAddress("::", "ipv6");
blocked.addAddress("::1", "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");

function normalizeHost(hostname: string) {
  return hostname.replace(/\.$/, "").toLowerCase();
}

function isTrustedHost(hostname: string) {
  return TRUSTED_HOST_SUFFIXES.some(suffix => hostname === suffix || hostname.endsWith("." + suffix));
}

function isBlockedHostname(hostname: string) {
  if (BLOCKED_HOSTS.has(hostname)) return true;
  return BLOCKED_HOST_SUFFIXES.some(suffix => hostname.endsWith(suffix));
}

function isBlockedAddress(address: string) {
  const ip = address.startsWith("::ffff:") ? address.slice(7) : address;
  const family = ip.includes(":") ? "ipv6" : "ipv4";
  return blocked.check(ip, family);
}

async function resolveAllowedAddresses(hostname: string) {
  const addresses = await dns.lookup(hostname, { all: true }).catch(() => []);
  if (!addresses?.length || addresses.some(a => isBlockedAddress(a.address))) throw new Error("Provider URL host is not allowed");
  return addresses;
}

// Used as the socket's own lookup so the connection binds to the address this check approved.
// Re-resolving inside the connect path removes the DNS rebinding window between validation and connect.
export const safeProviderLookup: LookupFunction = (hostname, options, callback) => {
  resolveAllowedAddresses(normalizeHost(hostname)).then(addresses => {
    const family = typeof options?.family === "number" ? options.family : 0;
    const matches = family === 4 || family === 6 ? addresses.filter(a => a.family === family) : addresses;
    if (!matches.length) throw new Error("Provider URL host is not allowed");
    if (options?.all) callback(null, matches);
    else callback(null, matches[0].address, matches[0].family);
  }).catch(err => { callback(err as NodeJS.ErrnoException, ""); });
};

const providerAgent = new https.Agent({ lookup: safeProviderLookup });

export function providerHostname(rawUrl: string) {
  return normalizeHost(new URL(rawUrl).hostname);
}

export async function assertSafeProviderUrl(rawUrl: string, extraAllowedHosts?: string[]) {
  if (!rawUrl || typeof rawUrl !== "string") throw new Error("Invalid provider URL");
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error("Invalid provider URL"); }
  if (parsed.protocol !== "https:") throw new Error("Provider URL must be https");
  if (parsed.username || parsed.password) throw new Error("Invalid provider URL");
  const hostname = normalizeHost(parsed.hostname.replace(/^\[|\]$/g, ""));
  if (!hostname || isIP(hostname) || isBlockedHostname(hostname)) throw new Error("Provider URL host is not allowed");
  if (extraAllowedHosts && !isTrustedHost(hostname) && !extraAllowedHosts.map(normalizeHost).includes(hostname)) throw new Error("Provider URL host is not allowed");
  await resolveAllowedAddresses(hostname);
}

export async function fetchProviderJson(rawUrl: string, extraAllowedHosts?: string[]) {
  await assertSafeProviderUrl(rawUrl, extraAllowedHosts);
  const response = await axios.get(rawUrl, { httpsAgent: providerAgent, maxRedirects: 0, timeout: 10000, validateStatus: status => status >= 200 && status < 300 });
  return response.data;
}
