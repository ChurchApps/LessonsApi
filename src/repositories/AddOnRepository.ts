import { getDb } from "../db";
import { AddOn } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AddOnRepository {
  public save(addOn: AddOn) {
    if (UniqueIdHelper.isMissing(addOn.id)) return this.create(addOn);
    else return this.update(addOn);
  }

  public async create(addOn: AddOn) {
    addOn.id = UniqueIdHelper.shortId();
    await getDb().insertInto("addOns").values({
      id: addOn.id,
      churchId: addOn.churchId,
      providerId: addOn.providerId,
      category: addOn.category,
      name: addOn.name,
      image: addOn.image,
      addOnType: addOn.addOnType,
      fileId: addOn.fileId
    }).execute();
    return addOn;
  }

  public async update(addOn: AddOn) {
    await getDb().updateTable("addOns").set({
      providerId: addOn.providerId,
      category: addOn.category,
      name: addOn.name,
      image: addOn.image,
      addOnType: addOn.addOnType,
      fileId: addOn.fileId
    }).where("id", "=", addOn.id).where("churchId", "=", addOn.churchId).execute();
    return addOn;
  }

  public async loadPublic(): Promise<AddOn[]> {
    return await getDb().selectFrom("addOns").selectAll().orderBy("category").orderBy("name").execute() as AddOn[];
  }

  public async loadAll(churchId: string): Promise<AddOn[]> {
    return await getDb().selectFrom("addOns").selectAll().where("churchId", "=", churchId).orderBy("category").orderBy("name").execute() as AddOn[];
  }

  public async loadPublicForLesson(lessonId: string): Promise<AddOn[]> {
    return await getDb().selectFrom("addOns").selectAll()
      .where("id", "in", getDb().selectFrom("actions").select("addOnId").where("lessonId", "=", lessonId))
      .execute() as AddOn[];
  }

  public async load(id: string): Promise<AddOn> {
    return await getDb().selectFrom("addOns").selectAll().where("id", "=", id).executeTakeFirst() as AddOn;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("addOns").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
