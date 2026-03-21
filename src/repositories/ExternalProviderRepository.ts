import { getDb } from "../db";
import { ExternalProvider } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ExternalProviderRepository {
  public save(externalProvider: ExternalProvider) {
    if (UniqueIdHelper.isMissing(externalProvider.id)) return this.create(externalProvider);
    else return this.update(externalProvider);
  }

  public async create(externalProvider: ExternalProvider) {
    externalProvider.id = UniqueIdHelper.shortId();
    await getDb().insertInto("externalProviders").values({ id: externalProvider.id, churchId: externalProvider.churchId, name: externalProvider.name, apiUrl: externalProvider.apiUrl }).execute();
    return externalProvider;
  }

  public async update(externalProvider: ExternalProvider) {
    await getDb().updateTable("externalProviders").set({ name: externalProvider.name, apiUrl: externalProvider.apiUrl }).where("id", "=", externalProvider.id).where("churchId", "=", externalProvider.churchId).execute();
    return externalProvider;
  }

  public async loadPublic(id: string): Promise<ExternalProvider> {
    return await getDb().selectFrom("externalProviders").selectAll().where("id", "=", id).executeTakeFirst() as ExternalProvider;
  }

  public async load(churchId: string, id: string): Promise<ExternalProvider> {
    return await getDb().selectFrom("externalProviders").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as ExternalProvider;
  }

  public async loadAll(churchId: string): Promise<ExternalProvider[]> {
    return await getDb().selectFrom("externalProviders").selectAll().where("churchId", "=", churchId).execute() as ExternalProvider[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("externalProviders").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
