import { sql } from "kysely";
import { getDb } from "../db";
import { File } from "../models";
import { UniqueIdHelper } from "../helpers";

export class FileRepository {
  public save(file: File) {
    if (UniqueIdHelper.isMissing(file.id)) return this.create(file);
    else return this.update(file);
  }

  public async create(file: File) {
    file.id = UniqueIdHelper.shortId();
    await getDb().insertInto("files").values({
      id: file.id,
      churchId: file.churchId,
      fileName: file.fileName,
      contentPath: file.contentPath,
      fileType: file.fileType,
      size: file.size,
      seconds: file.seconds,
      dateModified: sql`NOW()`,
      thumbPath: file.thumbPath
    }).execute();
    return file;
  }

  public async update(file: File) {
    await getDb().updateTable("files").set({
      fileName: file.fileName,
      contentPath: file.contentPath,
      fileType: file.fileType,
      size: file.size,
      seconds: file.seconds,
      dateModified: file.dateModified,
      thumbPath: file.thumbPath
    }).where("id", "=", file.id).where("churchId", "=", file.churchId).execute();
    return file;
  }

  public async load(churchId: string, id: string): Promise<File> {
    return await getDb().selectFrom("files").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as File;
  }

  public async loadPublicByIds(ids: string[]): Promise<File[]> {
    if (ids.length === 0) return [];
    return await getDb().selectFrom("files").selectAll().where("id", "in", ids).execute() as File[];
  }

  public async loadByIds(churchId: string, ids: string[]): Promise<File[]> {
    if (ids.length === 0) return [];
    return await getDb().selectFrom("files").selectAll().where("churchId", "=", churchId).where("id", "in", ids).execute() as File[];
  }

  public async loadForChurch(churchId: string): Promise<File[]> {
    return await getDb().selectFrom("files").selectAll().where("churchId", "=", churchId).execute() as File[];
  }

  public async loadAll(): Promise<File[]> {
    return await getDb().selectFrom("files").selectAll().execute() as File[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("files").where("id", "=", id).where("churchId", "=", churchId).execute();
  }

  public async cleanUp(churchId: string): Promise<any> {
    const referenced = getDb().selectFrom("bundles").select("fileId").where("fileId", "is not", null)
      .unionAll(getDb().selectFrom("assets").select("fileId").where("fileId", "is not", null))
      .unionAll(getDb().selectFrom("variants").select("fileId").where("fileId", "is not", null));
    return await getDb().deleteFrom("files").where("churchId", "=", churchId).where("id", "not in", referenced).execute();
  }
}
