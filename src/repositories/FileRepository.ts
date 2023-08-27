import { DB } from "@churchapps/apihelper"
import { File } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ArrayHelper } from "@churchapps/apihelper";

export class FileRepository {

  public save(file: File) {
    if (UniqueIdHelper.isMissing(file.id)) return this.create(file); else return this.update(file);
  }

  public async create(file: File) {
    file.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO files (id, churchId, fileName, contentPath, fileType, size, seconds, dateModified, thumbPath) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?);";
    const params = [file.id, file.churchId, file.fileName, file.contentPath, file.fileType, file.size, file.seconds, file.thumbPath];
    await DB.query(sql, params);
    return file;
  }

  public async update(file: File) {
    const sql = "UPDATE files SET fileName=?, contentPath=?, fileType=?, size=?, seconds=?, dateModified=?, thumbPath=? WHERE id=? AND churchId=?";
    const params = [file.fileName, file.contentPath, file.fileType, file.size, file.seconds, file.dateModified, file.thumbPath, file.id, file.churchId];
    await DB.query(sql, params);
    return file;
  }

  public load(churchId: string, id: string): Promise<File> {
    return DB.queryOne("SELECT * FROM files WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadByIds(churchId: string, ids: string[]): Promise<File[]> {
    const sql = "SELECT * FROM files WHERE churchId=? AND id IN (" + ArrayHelper.fillArray("?", ids.length) + ")";
    return DB.query(sql, [churchId].concat(ids));
  }

  public loadForChurch(churchId: string): Promise<File[]> {
    return DB.query("SELECT * FROM files WHERE churchId=?", [churchId]);
  }

  public loadAll(): Promise<File[]> {
    return DB.query("SELECT * FROM files", []);
  }

  public delete(churchId: string, id: string): Promise<File> {
    return DB.query("DELETE FROM files WHERE id=? AND churchId=?", [id, churchId]);
  }

  public cleanUp(): Promise<File> {
    const sql = "DELETE FROM files WHERE id NOT IN ("
      + " SELECT fileId FROM bundles where fileId is not null"
      + " UNION ALL"
      + " SELECT fileId FROM assets where fileId is not null"
      + " UNION ALL"
      + " SELECT fileId FROM variants where fileId is not null"
      + " )"
    return DB.query(sql, []);
  }


}
