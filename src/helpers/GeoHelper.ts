import { Repositories } from "../repositories";
import { IpDetail } from "../models";
import Axios from "axios";
import { Environment } from "./Environment";

export class GeoHelper {
  static async lookupMissing() {
    // Skip if API key is missing
    if (!Environment.ipGeoKey) {
      console.warn("GeoHelper.lookupMissing skipped: missing ipGeoKey");
      return;
    }

    const baseUrl = "https://api.ipgeolocation.io/ipgeo?apiKey=" + Environment.ipGeoKey + "&ip=";
    const pending = await Repositories.getCurrent().ipDetails.loadPendingLookup();
    if (!Array.isArray(pending) || pending.length === 0) return;

    // Process sequentially with light delay; stop on 429 to respect rate limits
    for (const ip of pending) {
      try {
        const resp = await Axios.get(baseUrl + ip);
        const detail: IpDetail = {
          ipAddress: resp.data.ip,
          city: resp.data.city,
          state: resp.data.state_prov,
          country: resp.data.country_name,
          isp: resp.data.isp,
          lat: parseFloat(resp.data.latitude),
          lon: parseFloat(resp.data.longitude),
        };
        await Repositories.getCurrent().ipDetails.save(detail);
        // small delay to avoid hammering the API
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429) {
          console.warn("GeoHelper.lookupMissing rate limited (429). Pausing remaining lookups until next run.");
          break; // leave remaining pending for a future invocation
        }
        console.error("GeoHelper.lookupMissing failed for ip", ip, err?.message || err);
        // continue with next IP
      }
    }
  }
}
