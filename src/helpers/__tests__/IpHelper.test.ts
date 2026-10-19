import { IpHelper } from "../IpHelper";

describe("IpHelper.isPublic", () => {
  it("rejects loopback, private, link-local and unspecified IPv4", () => {
    [
      "127.0.0.1", "10.63.25.57", "10.255.221.218", "172.16.0.1", "172.31.255.254", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1"
    ].forEach(ip => expect(IpHelper.isPublic(ip)).toBe(false));
  });

  it("accepts routable IPv4", () => {
    ["8.8.8.8", "172.32.0.1", "172.15.255.255", "11.0.0.1", "203.0.113.9"].forEach(ip => expect(IpHelper.isPublic(ip)).toBe(true));
  });

  it("handles IPv6 and garbage", () => {
    expect(IpHelper.isPublic("::1")).toBe(false);
    expect(IpHelper.isPublic("fe80::1")).toBe(false);
    expect(IpHelper.isPublic("fd12::1")).toBe(false);
    expect(IpHelper.isPublic("::ffff:10.0.0.1")).toBe(false);
    expect(IpHelper.isPublic("::ffff:8.8.8.8")).toBe(true);
    expect(IpHelper.isPublic("2001:4860:4860::8888")).toBe(true);
    expect(IpHelper.isPublic("")).toBe(false);
    expect(IpHelper.isPublic("not-an-ip")).toBe(false);
    expect(IpHelper.isPublic(undefined as any)).toBe(false);
  });
});
