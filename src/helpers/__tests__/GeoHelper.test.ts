const save = jest.fn(async (d: any) => d);
const loadPendingLookup = jest.fn(async () => ["10.63.25.57", "127.0.0.1", "8.8.8.8"]);
jest.mock("../../repositories", () => ({ Repositories: { getCurrent: () => ({ ipDetails: { loadPendingLookup, save } }) } }));
jest.mock("../Environment", () => ({ Environment: { ipGeoKey: "test-key" } }));
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (url: string) => {
      if (url.endsWith("ip=8.8.8.8")) return { data: { ip: "8.8.8.8", city: "Mountain View", state_prov: "California", country_name: "United States", isp: "Google", latitude: "37.4", longitude: "-122.1" } };
      // ipgeolocation.io answers 423 for private / bogon addresses.
      return Promise.reject({ response: { status: 423 }, message: "Request failed with status code 423" });
    })
  }
}));

import Axios from "axios";
import { GeoHelper } from "../GeoHelper";

// zipBundles timer, prod: 9,404 "GeoHelper.lookupMissing failed ... 423" lines in 7 days, all for the same
// five private addresses (10.x, 127.0.0.1) retried every 5 minutes. Those can never resolve; skip them quietly.
describe("GeoHelper.lookupMissing", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("looks up only public addresses and logs no error for private ones", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    await GeoHelper.lookupMissing();
    const urls = (Axios.get as jest.Mock).mock.calls.map(c => c[0]);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/ip=8\.8\.8\.8$/);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toMatchObject({ ipAddress: "8.8.8.8", city: "Mountain View", lat: 37.4, lon: -122.1 });
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
