import { Repositories } from "../repositories"
import { IpDetail } from "../models";
import Axios from "axios"
import { Environment } from "./Environment";

export class GeoHelper {
  static async lookupMissing() {
    const baseUrl = "https://api.ipgeolocation.io/ipgeo?apiKey=" + Environment.ipGeoKey + "&ip=";
    const pending = await Repositories.getCurrent().ipDetails.loadPendingLookup();
    const promises: Promise<any>[] = []
    for (const ip of pending) {
      const resp = await Axios.get(baseUrl + ip);
      const detail: IpDetail = {
        ipAddress: resp.data.ip,
        city: resp.data.city,
        state: resp.data.state_prov,
        country: resp.data.country_name,
        isp: resp.data.isp,
        lat: parseFloat(resp.data.latitude),
        lon: parseFloat(resp.data.longitude)
      };
      promises.push(Repositories.getCurrent().ipDetails.save(detail));
    }
    await Promise.all(promises);
  }
}