import { DB } from "@churchapps/apihelper"
import { AddOn } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AddOnRepository {

  public save(addOn: AddOn) {
    if (UniqueIdHelper.isMissing(addOn.id)) return this.create(addOn); else return this.update(addOn);
  }

  public async create(addOn: AddOn) {
    addOn.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO addOns (id, churchId, providerId, category, name, image, addOnType, fileId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [addOn.id, addOn.churchId, addOn.providerId, addOn.category, addOn.name, addOn.image, addOn.addOnType, addOn.fileId];
    await DB.query(sql, params);
    return addOn;
  }

  public async update(addOn: AddOn) {
    const sql = "UPDATE addOns SET providerId=?, category=?, name=?, image=?, addOnType=?, fileId=? WHERE id=? AND churchId=?";
    const params = [addOn.providerId, addOn.category, addOn.name, addOn.image, addOn.addOnType, addOn.fileId, addOn.id, addOn.churchId];
    await DB.query(sql, params);
    return addOn;
  }

  public loadAll(churchId: string): Promise<AddOn[]> {
    return DB.query("SELECT * FROM addOns WHERE churchId=? order by category, name", [churchId]);
  }

  public load(id: string): Promise<AddOn> {
    return DB.queryOne("SELECT * FROM addOns WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<AddOn> {
    return DB.query("DELETE FROM addOns WHERE id=? AND churchId=?", [id, churchId]);
  }

}
