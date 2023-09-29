import { DB } from "@churchapps/apihelper"
import { ExternalProvider } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ExternalProviderRepository {

  public save(externalProvider: ExternalProvider) {
    if (UniqueIdHelper.isMissing(externalProvider.id)) return this.create(externalProvider); else return this.update(externalProvider);
  }

  public async create(externalProvider: ExternalProvider) {
    externalProvider.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO externalProviders (id, churchId, name, apiUrl) VALUES (?, ?, ?, ?);";
    const params = [externalProvider.id, externalProvider.churchId, externalProvider.name, externalProvider.apiUrl];
    await DB.query(sql, params);
    return externalProvider;
  }

  public async update(externalProvider: ExternalProvider) {
    const sql = "UPDATE externalProviders SET name=?, apiUrl=? WHERE id=? AND churchId=?";
    const params = [externalProvider.name, externalProvider.apiUrl, externalProvider.id, externalProvider.churchId];
    await DB.query(sql, params);
    return externalProvider;
  }

  public load(churchId: string, id: string): Promise<ExternalProvider> {
    return DB.queryOne("SELECT * FROM externalProviders WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadAll(churchId: string): Promise<ExternalProvider[]> {
    console.log("SELECT * FROM externalProviders WHERE churchId=?", [churchId])
    return DB.query("SELECT * FROM externalProviders WHERE churchId=?", [churchId]);
  }

  public delete(churchId: string, id: string): Promise<ExternalProvider> {
    return DB.query("DELETE FROM externalProviders WHERE id=? AND churchId=?", [id, churchId]);
  }

}
