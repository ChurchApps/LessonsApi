import { DB } from "@churchapps/apihelper"
import { Download } from "../models";
import { UniqueIdHelper } from "../helpers";

export class DownloadRepository {

  public save(download: Download) {
    if (UniqueIdHelper.isMissing(download.id)) return this.create(download); else return this.update(download);
  }

  public async create(download: Download) {
    download.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO downloads (id, lessonId, fileId, userId, churchId, ipAddress, downloadDate, fileName) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [download.id, download.lessonId, download.fileId, download.userId, download.churchId, download.ipAddress, download.downloadDate, download.fileName];
    await DB.query(sql, params);
    return download;
  }

  public async update(download: Download) {
    const sql = "UPDATE downloads SET lessonId=?, fileId=?, userId=?, churchId=?, ipAddress=?, downloadDate=?, fileName=? WHERE id=?";
    const params = [download.lessonId, download.fileId, download.userId, download.churchId, download.ipAddress, download.downloadDate, download.fileName, download.id];
    await DB.query(sql, params);
    return download;
  }

  public loadExisting(candidate: Download): Promise<Download> {
    const sql = "SELECT * FROM downloads WHERE lessonId=? AND churchId=? AND ipAddress=? AND fileName=? AND downloadDate>?";
    const date = new Date(candidate.downloadDate.toDateString());
    return DB.queryOne(sql, [candidate.lessonId, candidate.churchId, candidate.ipAddress, candidate.fileName, date]);
  }

  public load(id: string): Promise<Download> {
    return DB.queryOne("SELECT * FROM downloads WHERE id=?", [id]);
  }

  public geo(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const sql = "SELECT ip.lat, ip.lon, ip.city, ip.state, ip.country, count(*) as totalDownloads"
      + " FROM downloads d"
      + " INNER JOIN ipDetails ip on ip.ipAddress=d.ipAddress"
      + " INNER JOIN lessons l ON l.id=d.lessonId"
      + " INNER JOIN studies s on s.id=l.studyId"
      + " WHERE s.programId=? AND d.downloadDate between ? AND ?"
      + " GROUP by  ip.lat, ip.lon, ip.city, ip.state, ip.country"
    return DB.query(sql, [programId, startDate, endDate]);
  }

  public countsByStudy(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // const sql = "SELECT s.id, s.name as studyName, count(distinct(IF(d.churchId IS NULL or d.churchId='', ipAddress, d.churchId))) as downloadCount"
    const sql = "SELECT s.id, s.name as studyName, count(distinct(ipAddress)) as downloadCount"
      + " FROM downloads d"
      + " INNER JOIN lessons l ON l.id=d.lessonId"
      + " INNER JOIN studies s on s.id=l.studyId"
      + " WHERE s.programId=? AND d.downloadDate between ? AND ?"
      + " GROUP by s.id, s.name"
      + " ORDER by s.name"

    return DB.query(sql, [programId, startDate, endDate]);
  }

  public uniqueChurches(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const sql = "SELECT d.churchId"
      + " FROM downloads d"
      + " INNER JOIN lessons l ON l.id=d.lessonId"
      + " INNER JOIN studies s on s.id=l.studyId"
      + " WHERE s.programId=? AND d.downloadDate between ? AND ?"
      + " AND d.churchId IS NOT NULL and d.churchId<>''"
      + " group by d.churchId"

    return DB.query(sql, [programId, startDate, endDate]);
  }


  public delete(id: string): Promise<Download> {
    return DB.query("DELETE FROM downloads WHERE id=?", [id]);
  }

}
