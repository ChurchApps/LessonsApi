import { DB } from "../apiBase/db";
import { IpDetail, Lesson } from "../models";
import { UniqueIdHelper, MySqlHelper } from "../helpers";

export class IpDetailRepository {

  public save(detail: IpDetail) {
    if (UniqueIdHelper.isMissing(detail.id)) return this.create(detail); else return this.update(detail);
  }

  public async create(detail: IpDetail) {
    detail.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO ipDetails (id, ipAddress, city, state, country, lat, lon, isp) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [detail.id, detail.ipAddress, detail.city, detail.state, detail.country, detail.lat, detail.lon, detail.isp];
    await DB.query(sql, params);
    return detail;
  }

  public async update(detail: IpDetail) {
    const sql = "UPDATE ipDetails SET ipAddress=?, city=?, state=?, country=?, lat=?, lon=?, isp=? WHERE id=?";
    const params = [detail.ipAddress, detail.city, detail.state, detail.country, detail.lat, detail.lon, detail.isp, detail.id];
    await DB.query(sql, params);
    return detail;
  }

  public async loadPendingLookup() {
    const sql = "select ipAddress from downloads"
      + " where ipAddress like '%.%.%.%'"
      + " and ipAddress not in (select ipAddress from ipDetails)"
      + " group by ipAddress limit 10";
    const data: any[] = await DB.query(sql, []);
    const result: string[] = [];
    data.forEach(d => result.push(d.ipAddress))
    return result;
  }


}
