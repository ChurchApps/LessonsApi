import { DB } from "../apiBase/db";
import { Bundle } from "../models";
import { UniqueIdHelper } from "../helpers";

export class BundleRepository {

  public save(bundle: Bundle) {
    if (UniqueIdHelper.isMissing(bundle.id)) return this.create(bundle); else return this.update(bundle);
  }

  public async create(bundle: Bundle) {
    bundle.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO bundles (id, churchId, contentType, contentId, name, fileId, pendingUpdate) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [bundle.id, bundle.churchId, bundle.contentType, bundle.contentId, bundle.name, bundle.fileId, bundle.pendingUpdate];
    await DB.query(sql, params);
    return bundle;
  }

  public async update(bundle: Bundle) {
    const sql = "UPDATE bundles SET contentType=?, contentId=?, name=?, fileId=?, pendingUpdate=? WHERE id=? AND churchId=?";
    const params = [bundle.contentType, bundle.contentId, bundle.name, bundle.fileId, bundle.pendingUpdate, bundle.id, bundle.churchId];
    await DB.query(sql, params);
    return bundle;
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Bundle[]> {
    return DB.query("SELECT * FROM bundles WHERE churchId=? AND contentType=? AND contentId=? order by name", [churchId, contentType, contentId]);
  }

  public loadPendingUpdate(limit: number): Promise<Bundle[]> {
    return DB.query("SELECT * FROM bundles WHERE pendingUpdate=1 limit " + limit.toString(), []);
  }


  public loadPublicForLesson(lessonId: string): Promise<Bundle[]> {
    return DB.query("SELECT * FROM bundles WHERE id in (SELECT bundleId FROM resources WHERE id in (SELECT resourceId from actions WHERE lessonId=?))", [lessonId]);
  }

  public load(churchId: string, id: string): Promise<Bundle> {
    return DB.queryOne("SELECT * FROM bundles WHERE id=? and churchId=?", [id, churchId]);
  }



  public delete(churchId: string, id: string): Promise<Bundle> {
    return DB.query("DELETE FROM bundles WHERE id=? AND churchId=?", [id, churchId]);
  }

}
