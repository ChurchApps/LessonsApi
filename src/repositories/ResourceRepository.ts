import { DB } from "@churchapps/apihelper"
import { Resource } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ResourceRepository {

  public save(resource: Resource) {
    if (UniqueIdHelper.isMissing(resource.id)) return this.create(resource); else return this.update(resource);
  }

  public async create(resource: Resource) {
    resource.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO resources (id, churchId, name, category, bundleId, loopVideo) VALUES (?, ?, ?, ?, ?, ?);";
    const params = [resource.id, resource.churchId, resource.name, resource.category, resource.bundleId, resource.loopVideo];
    await DB.query(sql, params);
    return resource;
  }

  public async update(resource: Resource) {
    const sql = "UPDATE resources SET name=?, category=?, bundleId=?, loopVideo=? WHERE id=? AND churchId=?";
    const params = [resource.name, resource.category, resource.bundleId, resource.loopVideo, resource.id, resource.churchId];
    await DB.query(sql, params);
    return resource;
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Resource[]> {
    return DB.query("SELECT * FROM resources WHERE bundleId in (SELECT id from bundles WHERE churchId=? AND contentType=? AND contentId=?) order by name", [churchId, contentType, contentId]) as Promise<Resource[]>
  }

  public loadByBundleId(churchId: string, bundleId: string): Promise<Resource[]> {
    return DB.query("SELECT * FROM resources WHERE churchId=? AND bundleId=? order by name", [churchId, bundleId]) as Promise<Resource[]>
  }

  public loadPublicForLesson(lessonId: string): Promise<Resource[]> {
    return DB.query("SELECT * FROM resources WHERE id in (SELECT resourceId from actions WHERE lessonId=?)", [lessonId]) as Promise<Resource[]>
  }

  public load(churchId: string, id: string): Promise<Resource> {
    return DB.queryOne("SELECT * FROM resources WHERE id=? and churchId=?", [id, churchId]) as Promise<Resource>
  }

  public loadWithoutChurchId(id: string): Promise<Resource> {
    return DB.queryOne("SELECT * FROM resources WHERE id=?", [id]) as Promise<Resource>
  }

  public loadNeedingWebm(): Promise<any[]> {
    const sql = "select r.churchId, r.id, r.name, f.contentPath"
      + " from files f"
      + " inner join variants v on v.fileId=f.id"
      + " inner join resources r on r.id=v.resourceId"
      + " left outer join variants v2 on v2.resourceId=v.resourceId and v2.name='WEBM'"
      + " where f.contentPath like '%.mp4%' and v2.id is null";
    return DB.query(sql, []) as Promise<Resource[]>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM resources WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }

}
