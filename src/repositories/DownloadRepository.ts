import { DB } from "../apiBase/db";
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

  public load(id: string): Promise<Download> {
    return DB.queryOne("SELECT * FROM downloads WHERE id=?", [id]);
  }


  public delete(id: string): Promise<Download> {
    return DB.query("DELETE FROM downloads WHERE id=?", [id]);
  }

}
