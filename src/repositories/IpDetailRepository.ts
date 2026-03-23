import { getDb } from "../db";
import { IpDetail } from "../models";
import { UniqueIdHelper } from "../helpers";

export class IpDetailRepository {
  public save(detail: IpDetail) {
    if (UniqueIdHelper.isMissing(detail.id)) return this.create(detail);
    else return this.update(detail);
  }

  public async create(detail: IpDetail) {
    detail.id = UniqueIdHelper.shortId();
    await getDb().insertInto("ipDetails").values({
      id: detail.id,
      ipAddress: detail.ipAddress,
      city: detail.city,
      state: detail.state,
      country: detail.country,
      lat: detail.lat,
      lon: detail.lon,
      isp: detail.isp
    }).execute();
    return detail;
  }

  public async update(detail: IpDetail) {
    await getDb().updateTable("ipDetails").set({
      ipAddress: detail.ipAddress,
      city: detail.city,
      state: detail.state,
      country: detail.country,
      lat: detail.lat,
      lon: detail.lon,
      isp: detail.isp
    }).where("id", "=", detail.id).execute();
    return detail;
  }

  public async loadPendingLookup() {
    const rows = await getDb().selectFrom("downloads")
      .select("ipAddress")
      .where("ipAddress", "like", "%.%.%.%")
      .where("ipAddress", "not in", getDb().selectFrom("ipDetails").select("ipAddress"))
      .groupBy("ipAddress")
      .limit(10)
      .execute();
    return rows.map((d) => d.ipAddress);
  }
}
