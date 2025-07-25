import { DB } from "@churchapps/apihelper"
import { Provider } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProviderRepository {

  public save(provider: Provider) {
    if (UniqueIdHelper.isMissing(provider.id)) return this.create(provider); else return this.update(provider);
  }

  public async create(provider: Provider) {
    provider.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO providers (id, churchId, name) VALUES (?, ?, ?);";
    const params = [provider.id, provider.churchId, provider.name];
    await DB.query(sql, params);
    return provider;
  }

  public async update(provider: Provider) {
    const sql = "UPDATE providers SET name=? WHERE id=? AND churchId=?";
    const params = [provider.name, provider.id, provider.churchId];
    await DB.query(sql, params);
    return provider;
  }

  public loadStats(): Promise<Provider> {
    const sql = "select "
      + "(select count(*) from providers) as providers, "
      + "(select count(*) from studies where live=1) as studies, "
      + "(select count(*) from lessons where live=1) as lessons"
    return DB.queryOne(sql, []) as Promise<Provider>
  }

  public loadPublic(id: string): Promise<Provider> {
    return DB.queryOne("SELECT * FROM providers WHERE id=?", [id]) as Promise<Provider>
  }

  public load(churchId: string, id: string): Promise<Provider> {
    return DB.queryOne("SELECT * FROM providers WHERE id=? AND churchId=?", [id, churchId]) as Promise<Provider>
  }

  public loadAll(churchId: string): Promise<Provider[]> {
    return DB.query("SELECT * FROM providers WHERE churchId=?", [churchId]) as Promise<Provider[]>
  }

  public loadPublicAll(): Promise<Provider[]> {
    return DB.query("SELECT * FROM providers", []) as Promise<Provider[]>
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM providers WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }

}
