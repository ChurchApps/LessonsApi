import { DB } from "@churchapps/apihelper"
import { Customization } from "../models";
import { UniqueIdHelper } from "../helpers";

export class CustomizationRepository {

  public save(customization: Customization) {
    if (UniqueIdHelper.isMissing(customization.id)) return this.create(customization); else return this.update(customization);
  }

  public async create(customization: Customization) {
    customization.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO customizations (id, churchId, venueId, classroomId, contentType, contentId, action, actionContent) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [customization.id, customization.churchId, customization.venueId, customization.classroomId, customization.contentType, customization.contentId, customization.action, customization.actionContent];
    await DB.query(sql, params);
    return customization;
  }

  public async update(customization: Customization) {
    const sql = "UPDATE customizations SET venueId=?, classroomId=?, contentType=?, contentId=?, action=?, actionContent=? WHERE id=? AND churchId=?";
    const params = [customization.venueId, customization.classroomId, customization.contentType, customization.contentId, customization.action, customization.actionContent, customization.id, customization.churchId];
    await DB.query(sql, params);
    return customization;
  }


  public loadByVenueId(churchId: string, venueId: string): Promise<Customization[]> {
    return DB.query("SELECT * FROM customizations WHERE churchId=? and venueId=?", [churchId, venueId]);
  }

  public load(churchId: string, id: string): Promise<Customization> {
    return DB.queryOne("SELECT * FROM customizations WHERE id=? and churchId=?", [id, churchId]);
  }

  public delete(churchId: string, id: string): Promise<Customization> {
    return DB.query("DELETE FROM customizations WHERE id=? AND churchId=?", [id, churchId]);
  }

}
