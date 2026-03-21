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
    return await getDb().selectFrom("downloads")
      .select("churchId")
      .select(sql`count(distinct lessonId)`.as("downloadCount"))
      .select((eb) => eb.fn.max("downloadDate").as("lastDownload"))
      .where("churchId", "<>", "")
      .groupBy("churchId")
      .having(sql`count(distinct lessonId)`, ">", sql`0`)
      .execute();
  }

  public async getDownloadCount(churchId: string) {
    return await getDb().selectFrom("downloads")
      .select(sql`count(distinct lessonId)`.as("downloadCount"))
      .select((eb) => eb.fn.max("downloadDate").as("lastDownload"))
      .where("churchId", "=", churchId)
      .executeTakeFirst() ?? null;
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
    return await getDb().selectFrom("downloads as d")
      .innerJoin("ipDetails as ip", "ip.ipAddress", "d.ipAddress")
      .innerJoin("lessons as l", "l.id", "d.lessonId")
      .innerJoin("studies as s", "s.id", "l.studyId")
      .select(["ip.lat", "ip.lon", "ip.city", "ip.state", "ip.country"])
      .select((eb) => eb.fn.countAll().as("totalDownloads"))
      .where("s.programId", "=", programId)
      .where("d.downloadDate", ">=", startDate)
      .where("d.downloadDate", "<=", endDate)
      .groupBy(["ip.lat", "ip.lon", "ip.city", "ip.state", "ip.country"])
      .execute();
  }

  public async countsByStudy(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await getDb().selectFrom("downloads as d")
      .innerJoin("lessons as l", "l.id", "d.lessonId")
      .innerJoin("studies as s", "s.id", "l.studyId")
      .select(["s.id", "s.name"])
      .select(sql`count(distinct d.ipAddress)`.as("downloadCount"))
      .where("s.programId", "=", programId)
      .where("d.downloadDate", ">=", startDate)
      .where("d.downloadDate", "<=", endDate)
      .groupBy(["s.id", "s.name"])
      .orderBy("s.name")
      .execute();
  }

  public async uniqueChurches(programId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await getDb().selectFrom("downloads as d")
      .innerJoin("lessons as l", "l.id", "d.lessonId")
      .innerJoin("studies as s", "s.id", "l.studyId")
      .select("d.churchId")
      .where("s.programId", "=", programId)
      .where("d.downloadDate", ">=", startDate)
      .where("d.downloadDate", "<=", endDate)
      .where("d.churchId", "is not", null)
      .where("d.churchId", "<>", "")
      .groupBy("d.churchId")
      .execute();
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("downloads").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
