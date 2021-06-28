import { DB } from "../apiBase/db";
import { AssociatedResource } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AssociatedResourceRepository {

  public save(associatedResource: AssociatedResource) {
    if (UniqueIdHelper.isMissing(associatedResource.id)) return this.create(associatedResource); else return this.update(associatedResource);
  }

  public async create(associatedResource: AssociatedResource) {
    associatedResource.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO associatedResources (id, churchId, lessonId, contentType, contentId, resourceId, assetId) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [associatedResource.id, associatedResource.churchId, associatedResource.lessonId, associatedResource.contentType, associatedResource.contentId, associatedResource.resourceId, associatedResource.assetId];
    await DB.query(sql, params);
    return associatedResource;
  }

  public async update(associatedResource: AssociatedResource) {
    const sql = "UPDATE associatedResources SET lessonId=?, contentType=?, contentId=?, resourceId=?, assetIt=? WHERE id=? AND churchId=?";
    const params = [associatedResource.lessonId, associatedResource.contentType, associatedResource.contentId, associatedResource.resourceId, associatedResource.assetId, associatedResource.id, associatedResource.churchId];
    await DB.query(sql, params);
    return associatedResource;
  }

  public loadByFileIdId(fileId: string): Promise<AssociatedResource[]> {
    return DB.query("SELECT * FROM associatedResources WHERE fileId=?", [fileId]);
  }

  public loadByContentTypeId(contentType: string, contentId: string): Promise<AssociatedResource[]> {
    return DB.query("SELECT * FROM associatedResources WHERE contentType=? AND contentId=?", [contentType, contentId]);
  }

  public load(id: string): Promise<AssociatedResource> {
    return DB.queryOne("SELECT * FROM associatedResources WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<AssociatedResource> {
    return DB.query("DELETE FROM associatedResources WHERE id=? AND churchId=?", [id, churchId]);
  }

  public deleteForFile(churchId: string, fileId: string) {
    const sql = "DELETE FROM associatedResources WHERE churchId=? AND fileId=?"
    const params = [churchId, fileId];
    return DB.query(sql, params);
  }

}
