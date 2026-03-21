import { sql } from "kysely";
import { getDb } from "../db";
import { Download } from "../models";
import { UniqueIdHelper } from "../helpers";

export class DownloadRepository {
  public save(download: Download) {
    if (UniqueIdHelper.isMissing(download.id)) return this.create(download);
    else return this.update(download);
  }

  public async getDownloadCounts() {
    const result = await sql<any>`
      SELECT churchId, count(distinct(lessonId)) as downloadCount, max(downloadDate) as lastDownload
      FROM downloads WHERE churchId<>'' GROUP BY churchId HAVING count(distinct(lessonId)) > 0
    `.execute(getDb());
    return result.rows;
  }

  public async getDownloadCount(churchId: string) {
    const result = await sql<any>`
      SELECT count(distinct(lessonId)) as downloadCount, max(downloadDate) as lastDownload
      FROM downloads WHERE churchId=${churchId}
    `.execute(getDb());
    return result.rows[0] ?? null;
  }

  public async create(download: Download) {
    download.id = UniqueIdHelper.shortId();
    await getDb().insertInto("downloads").values({
      id: download.id,
      lessonId: download.lessonId,
      fileId: download.fileId,
      userId: download.userId,
      churchId: download.churchId,
      ipAddress: download.ipAddress,
      downloadDate: download.downloadDate,
      fileName: download.fileName
    }).execute();
    return download;
  }

  public async update(download: Download) {
    await getDb().updateTable("downloads").set({
      lessonId: download.lessonId,
      fileId: download.fileId,
      userId: download.userId,
      churchId: download.churchId,
      ipAddress: download.ipAddress,
      downloadDate: download.downloadDate,
      fileName: download.fileName
    }).where("id", "=", download.id).execute();
    return download;
  }

  public async loadExisting(candidate: Download): Promise<Download> {
    const date = new Date(candidate.downloadDate.toDateString());
    return await getDb().selectFrom("downloads").selectAll()
      .where("lessonId", "=", candidate.lessonId)
      .where("churchId", "=", candidate.churchId)
      .where("ipAddress", "=", candidate.ipAddress)
      .where("fileName", "=", candidate.fileName)
      .where("downloadDate", ">", date)
      .executeTakeFirst() as Download;
  }

  public async load(id: string): Promise<Download> {
    return await getDb().selectFrom("downloads").selectAll().where("id", "=", id).executeTakeFirst() as Download;
  }

  public async geo(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const result = await sql<any>`
      SELECT ip.lat, ip.lon, ip.city, ip.state, ip.country, count(*) as totalDownloads
      FROM downloads d
      INNER JOIN ipDetails ip ON ip.ipAddress=d.ipAddress
      INNER JOIN lessons l ON l.id=d.lessonId
      INNER JOIN studies s ON s.id=l.studyId
      WHERE s.programId=${programId} AND d.downloadDate BETWEEN ${startDate} AND ${endDate}
      GROUP BY ip.lat, ip.lon, ip.city, ip.state, ip.country
    `.execute(getDb());
    return result.rows;
  }

  public async countsByStudy(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const result = await sql<any>`
      SELECT s.id, s.name as studyName, count(distinct(ipAddress)) as downloadCount
      FROM downloads d
      INNER JOIN lessons l ON l.id=d.lessonId
      INNER JOIN studies s ON s.id=l.studyId
      WHERE s.programId=${programId} AND d.downloadDate BETWEEN ${startDate} AND ${endDate}
      GROUP BY s.id, s.name
      ORDER BY s.name
    `.execute(getDb());
    return result.rows;
  }

  public async uniqueChurches(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const result = await sql<any>`
      SELECT d.churchId
      FROM downloads d
      INNER JOIN lessons l ON l.id=d.lessonId
      INNER JOIN studies s ON s.id=l.studyId
      WHERE s.programId=${programId} AND d.downloadDate BETWEEN ${startDate} AND ${endDate}
        AND d.churchId IS NOT NULL AND d.churchId<>''
      GROUP BY d.churchId
    `.execute(getDb());
    return result.rows;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("downloads").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
