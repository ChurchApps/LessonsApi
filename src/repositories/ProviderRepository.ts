import { DB } from "../apiBase/db";
import { Provider } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProviderRepository {

  public save(provider: Provider) {
    return provider.id ? this.update(provider) : this.create(provider);
  }

  private async create(provider: Provider) {
    provider.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO providers (id, churchId, name) VALUES (?, ?, ?);";
    const params = [provider.id, provider.churchId, provider.name];
    await DB.query(sql, params);
    return provider;
  }

  private async update(provider: Provider) {
    const sql = "UPDATE providers SET name=? WHERE id=? AND churchId=?";
    const params = [provider.name, provider.id, provider.churchId];
    await DB.query(sql, params);
    return provider;
  }

  public loadPublic(id: string): Promise<Provider> {
    return DB.queryOne("SELECT * FROM providers WHERE id=?", [id]);
  }

  public load(churchId: string, id: string): Promise<Provider> {
    return DB.queryOne("SELECT * FROM providers WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadAll(churchId: string): Promise<Provider[]> {
    return DB.query("SELECT * FROM providers WHERE churchId=?", [churchId]);
  }

  public loadPublicAll(): Promise<Provider[]> {
    return DB.query("SELECT * FROM providers", []);
  }

  public delete(churchId: string, id: string): Promise<Provider> {
    return DB.query("DELETE FROM providers WHERE id=? AND churchId=?", [id, churchId]);
  }

}
