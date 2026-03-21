import { getDb } from "../db";
import { Customization } from "../models";
import { UniqueIdHelper } from "../helpers";

export class CustomizationRepository {
  public save(customization: Customization) {
    if (UniqueIdHelper.isMissing(customization.id)) return this.create(customization);
    else return this.update(customization);
  }

  public async create(customization: Customization) {
    customization.id = UniqueIdHelper.shortId();
    await getDb().insertInto("customizations").values({
      id: customization.id,
      churchId: customization.churchId,
      venueId: customization.venueId,
      classroomId: customization.classroomId,
      contentType: customization.contentType,
      contentId: customization.contentId,
      action: customization.action,
      actionContent: customization.actionContent
    }).execute();
    return customization;
  }

  public async update(customization: Customization) {
    await getDb().updateTable("customizations").set({
      venueId: customization.venueId,
      classroomId: customization.classroomId,
      contentType: customization.contentType,
      contentId: customization.contentId,
      action: customization.action,
      actionContent: customization.actionContent
    }).where("id", "=", customization.id).where("churchId", "=", customization.churchId).execute();
    return customization;
  }

  public async loadByVenueId(churchId: string, venueId: string): Promise<Customization[]> {
    return await getDb().selectFrom("customizations").selectAll().where("churchId", "=", churchId).where("venueId", "=", venueId).execute() as Customization[];
  }

  public async load(churchId: string, id: string): Promise<Customization> {
    return await getDb().selectFrom("customizations").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Customization;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("customizations").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
