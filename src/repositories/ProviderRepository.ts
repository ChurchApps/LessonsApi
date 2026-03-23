import { sql } from "kysely";
import { getDb } from "../db";
import { Provider } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProviderRepository {
  public save(provider: Provider) {
    if (UniqueIdHelper.isMissing(provider.id)) return this.create(provider);
    else return this.update(provider);
  }

  public async create(provider: Provider) {
    provider.id = UniqueIdHelper.shortId();
    await getDb().insertInto("providers").values({ id: provider.id, churchId: provider.churchId, name: provider.name }).execute();
    return provider;
  }

  public async update(provider: Provider) {
    await getDb().updateTable("providers").set({ name: provider.name }).where("id", "=", provider.id).where("churchId", "=", provider.churchId).execute();
    return provider;
  }

  public async loadStats(): Promise<Provider> {
    const result = await sql<any>`
      SELECT
        (SELECT count(*) FROM providers) as providers,
        (SELECT count(*) FROM studies WHERE live=1) as studies,
        (SELECT count(*) FROM lessons WHERE live=1) as lessons
    `.execute(getDb());
    return result.rows[0] as Provider;
  }

  public async loadPublic(id: string): Promise<Provider> {
    return await getDb().selectFrom("providers").selectAll().where("id", "=", id).executeTakeFirst() as Provider;
  }

  public async load(churchId: string, id: string): Promise<Provider> {
    return await getDb().selectFrom("providers").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Provider;
  }

  public async loadAll(churchId: string): Promise<Provider[]> {
    return await getDb().selectFrom("providers").selectAll().where("churchId", "=", churchId).execute() as Provider[];
  }

  public async loadPublicAll(): Promise<Provider[]> {
    return await getDb().selectFrom("providers").selectAll().execute() as Provider[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("providers").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
