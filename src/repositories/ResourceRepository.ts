import { DB } from "../apiBase/db";
import { Resource } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ResourceRepository {

  public save(resource: Resource) {
    if (UniqueIdHelper.isMissing(resource.id)) return this.create(resource); else return this.update(resource);
  }

  public async create(resource: Resource) {
    resource.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO resources (id, churchId, contentType, contentId, name) VALUES (?, ?, ?, ?, ?);";
    const params = [resource.id, resource.churchId, resource.contentType, resource.contentId, resource.name];
    await DB.query(sql, params);
    return resource;
  }

  public async update(resource: Resource) {
    const sql = "UPDATE resources SET contentType=?, contentId=?, name=? WHERE id=? AND churchId=?";
    const params = [resource.name, resource.contentType, resource.contentId, resource.name, resource.id, resource.churchId];
    await DB.query(sql, params);
    return resource;
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Resource[]> {
    return DB.query("SELECT * FROM resources WHERE churchId=? AND contentType=? AND contentId=? order by name", [churchId, contentType, contentId]);
  }

  public loadPublicForLesson(lessonId: string): Promise<Resource[]> {
    return DB.query("SELECT * FROM resources WHERE id in (SELECT resourceId from actions WHERE lessonId=?)", [lessonId]);
  }

  public load(churchId: string, id: string): Promise<Resource> {
    return DB.queryOne("SELECT * FROM resources WHERE id=? and churchId=?", [id, churchId]);
  }

  public delete(churchId: string, id: string): Promise<Resource> {
    return DB.query("DELETE FROM resources WHERE id=? AND churchId=?", [id, churchId]);
  }

}
