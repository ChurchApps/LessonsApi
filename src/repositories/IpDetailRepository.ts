import { sql } from "kysely";
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
    const result = await sql<any>`
      SELECT ipAddress FROM downloads
      WHERE ipAddress LIKE '%.%.%.%'
        AND ipAddress NOT IN (SELECT ipAddress FROM ipDetails)
      GROUP BY ipAddress LIMIT 10
    `.execute(getDb());
    return result.rows.map((d: any) => d.ipAddress);
  }
}
