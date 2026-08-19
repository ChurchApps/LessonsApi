jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("dns/promises", () => ({ lookup: jest.fn() }));

import axios from "axios";
import dns from "dns/promises";
import { assertSafeProviderUrl, fetchProviderJson, providerHostname, safeProviderLookup } from "../ProviderUrlHelper";

const lookup = dns.lookup as jest.Mock;
const axiosGet = axios.get as jest.Mock;

function publicLookup(hostname: string) {
  lookup.mockResolvedValue([{ address: "203.0.113.10", family: 4 }]);
  return hostname;
}

describe("assertSafeProviderUrl", () => {
  beforeEach(() => {
    lookup.mockReset();
    axiosGet.mockReset();
  });

  it("allows https lesson provider hosts that resolve publicly", async () => {
    publicLookup("api.lessons.church");
    await expect(assertSafeProviderUrl("https://api.lessons.church/lessons/public/tree")).resolves.toBeUndefined();
    publicLookup("api.staging.lessons.church");
    await expect(assertSafeProviderUrl("https://api.staging.lessons.church/lessons/public/tree")).resolves.toBeUndefined();
    publicLookup("curriculum.example.org");
    await expect(assertSafeProviderUrl("https://curriculum.example.org/feed.json")).resolves.toBeUndefined();
  });

  it("rejects http, credentials, and invalid URLs", async () => {
    await expect(assertSafeProviderUrl("http://api.lessons.church/feed")).rejects.toThrow("https");
    await expect(assertSafeProviderUrl("https://user:pass@api.lessons.church/feed")).rejects.toThrow("Invalid provider URL");
    await expect(assertSafeProviderUrl("not-a-url")).rejects.toThrow("Invalid provider URL");
    await expect(assertSafeProviderUrl("")).rejects.toThrow("Invalid provider URL");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects private, link-local, and metadata targets", async () => {
    await expect(assertSafeProviderUrl("https://127.0.0.1/latest")).rejects.toThrow("not allowed");
    await expect(assertSafeProviderUrl("https://169.254.169.254/latest/meta-data")).rejects.toThrow("not allowed");
    await expect(assertSafeProviderUrl("https://10.0.0.8/admin")).rejects.toThrow("not allowed");
    await expect(assertSafeProviderUrl("https://192.168.1.1/")).rejects.toThrow("not allowed");
    await expect(assertSafeProviderUrl("https://[::1]/")).rejects.toThrow("not allowed");
    await expect(assertSafeProviderUrl("https://localhost/feed")).rejects.toThrow("not allowed");
    await expect(assertSafeProviderUrl("https://metadata.google.internal/")).rejects.toThrow("not allowed");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects hosts that resolve to private or link-local addresses", async () => {
    lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    await expect(assertSafeProviderUrl("https://rebind.example/feed")).rejects.toThrow("not allowed");
    lookup.mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);
    await expect(assertSafeProviderUrl("https://meta.example/feed")).rejects.toThrow("not allowed");
    lookup.mockResolvedValue([{ address: "203.0.113.10", family: 4 }, { address: "10.1.2.3", family: 4 }]);
    await expect(assertSafeProviderUrl("https://mixed.example/feed")).rejects.toThrow("not allowed");
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it("rejects venue hosts outside the provider host and lessons.church", async () => {
    publicLookup("evil.example");
    await expect(assertSafeProviderUrl("https://evil.example/venue", ["curriculum.example.org"])).rejects.toThrow("not allowed");
    publicLookup("api.lessons.church");
    await expect(assertSafeProviderUrl("https://api.lessons.church/venues/public/feed/v1", ["curriculum.example.org"])).resolves.toBeUndefined();
    publicLookup("curriculum.example.org");
    await expect(assertSafeProviderUrl("https://curriculum.example.org/venues/v1", ["curriculum.example.org"])).resolves.toBeUndefined();
  });
});

describe("fetchProviderJson", () => {
  beforeEach(() => {
    lookup.mockReset();
    axiosGet.mockReset();
  });

  it("fetches allowlisted https URLs with redirects disabled", async () => {
    publicLookup("api.lessons.church");
    axiosGet.mockResolvedValue({ data: { programs: [] } });
    await expect(fetchProviderJson("https://api.lessons.church/lessons/public/tree")).resolves.toEqual({ programs: [] });
    expect(axiosGet).toHaveBeenCalledWith("https://api.lessons.church/lessons/public/tree", expect.objectContaining({ maxRedirects: 0 }));
  });

  it("does not fetch private or internal URLs", async () => {
    await expect(fetchProviderJson("https://169.254.169.254/latest/meta-data")).rejects.toThrow("not allowed");
    await expect(fetchProviderJson("http://127.0.0.1/")).rejects.toThrow();
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it("connects through an agent that re-checks the address it dials", async () => {
    publicLookup("api.lessons.church");
    axiosGet.mockResolvedValue({ data: {} });
    await fetchProviderJson("https://api.lessons.church/lessons/public/tree");
    expect(axiosGet.mock.calls[0][1].httpsAgent.options.lookup).toBe(safeProviderLookup);
  });

  it("blocks a rebind that flips to a private address after validation", async () => {
    lookup.mockResolvedValueOnce([{ address: "203.0.113.10", family: 4 }]);
    lookup.mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);
    // Stand in for the socket: dial using the agent's lookup rather than a second bare resolve.
    axiosGet.mockImplementation((url: string, config: any) => new Promise((resolve, reject) => {
      config.httpsAgent.options.lookup(new URL(url).hostname, { all: true, family: 0 }, (err: Error) => (err ? reject(err) : resolve({ data: {} })));
    }));
    await expect(fetchProviderJson("https://rebind.example/feed")).rejects.toThrow("not allowed");
  });
});

describe("safeProviderLookup", () => {
  beforeEach(() => lookup.mockReset());

  function callLookup(hostname: string, options: any) {
    return new Promise<any>((resolve, reject) => {
      safeProviderLookup(hostname, options, (err, address, family) => (err ? reject(err) : resolve({ address, family })));
    });
  }

  it("returns the checked addresses in both single and all forms", async () => {
    lookup.mockResolvedValue([{ address: "203.0.113.10", family: 4 }, { address: "2001:db8::1", family: 6 }]);
    await expect(callLookup("curriculum.example.org", { family: 0 })).resolves.toEqual({ address: "203.0.113.10", family: 4 });
    await expect(callLookup("curriculum.example.org", { all: true, family: 0 })).resolves.toEqual({ address: [{ address: "203.0.113.10", family: 4 }, { address: "2001:db8::1", family: 6 }], family: undefined });
    await expect(callLookup("curriculum.example.org", { family: 6 })).resolves.toEqual({ address: "2001:db8::1", family: 6 });
  });

  it("errors instead of dialing private, link-local, or unresolvable hosts", async () => {
    lookup.mockResolvedValue([{ address: "203.0.113.10", family: 4 }, { address: "127.0.0.1", family: 4 }]);
    await expect(callLookup("mixed.example", { family: 0 })).rejects.toThrow("not allowed");
    lookup.mockResolvedValue([{ address: "::ffff:169.254.169.254", family: 6 }]);
    await expect(callLookup("meta.example", { family: 0 })).rejects.toThrow("not allowed");
    lookup.mockResolvedValue([]);
    await expect(callLookup("nxdomain.example", { family: 0 })).rejects.toThrow("not allowed");
    lookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(callLookup("nxdomain.example", { family: 0 })).rejects.toThrow("not allowed");
  });

  it("errors when no checked address matches the requested family", async () => {
    lookup.mockResolvedValue([{ address: "203.0.113.10", family: 4 }]);
    await expect(callLookup("curriculum.example.org", { family: 6 })).rejects.toThrow("not allowed");
  });
});

describe("providerHostname", () => {
  it("returns the normalized host", () => {
    expect(providerHostname("https://API.Lessons.Church/lessons/public/tree")).toBe("api.lessons.church");
  });
});
