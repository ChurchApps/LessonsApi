import { DB } from "@churchapps/apihelper"
import { Asset } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ArrayHelper } from "@churchapps/apihelper";

export class AssetRepository {

  public save(asset: Asset) {
    if (UniqueIdHelper.isMissing(asset.id)) return this.create(asset); else return this.update(asset);
  }

  public async create(asset: Asset) {
    asset.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO assets (id, churchId, resourceId, fileId, name, sort) VALUES (?, ?, ?, ?, ?, ?);";
    const params = [asset.id, asset.churchId, asset.resourceId, asset.fileId, asset.name, asset.sort];
    await DB.query(sql, params);
    return asset;
  }

  public async update(asset: Asset) {
    const sql = "UPDATE assets SET resourceId=?, fileId=?, name=?, sort=? WHERE id=? AND churchId=?";
    const params = [asset.resourceId, asset.fileId, asset.name, asset.sort, asset.id, asset.churchId];
    await DB.query(sql, params);
    return asset;
  }

  public loadByResourceId(churchId: string, resourceId: string): Promise<Asset[]> {
    return DB.query("SELECT * FROM assets WHERE churchId=? AND resourceId=? ORDER BY sort", [churchId, resourceId]) as Promise<Asset[]>
  }

  public loadByResourceIds(churchId: string, resourceIds: string[]): Promise<Asset[]> {
    const sql = "SELECT * FROM assets WHERE churchId=? AND resourceId IN (" + ArrayHelper.fillArray("?", resourceIds.length) + ") ORDER BY sort";
    return DB.query(sql, [churchId].concat(resourceIds)) as Promise<Asset[]>
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Asset[]> {
    const subQuery = "SELECT r.id from resources r INNER JOIN bundles b on b.id=r.bundleId WHERE b.churchId=? AND b.contentType=? AND b.contentId=?";
    return DB.query("SELECT * FROM assets WHERE churchId=? AND resourceId in (" + subQuery + ") order by sort", [churchId, churchId, contentType, contentId]) as Promise<Asset[]>
  }

  public load(churchId: string, id: string): Promise<Asset> {
    return DB.queryOne("SELECT * FROM assets WHERE id=? and churchId=?", [id, churchId]) as Promise<Asset>
  }

  public loadPlaylist(resourceIds: string[]): Promise<any> {
    const sql = "select f.contentPath, r.id as resourceId, concat(r.name, ' - ', a.name) as resourceName, a.id as assetId, f.fileType, f.seconds from resources r"
      + " inner join assets a on a.resourceId=r.id"
      + " inner join files f on f.id=a.fileId"
      + " where r.id in (" + ArrayHelper.fillArray("?", resourceIds.length).join(", ") + ")"
      + " order by sort";
    return DB.query(sql, resourceIds) as Promise<Asset[]>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM assets WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }

}
