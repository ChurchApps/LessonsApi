import { DB } from "@churchapps/apihelper";
import { AddOnPlaylistItem } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AddOnPlaylistItemRepository {
  public save(addOnPlaylistItem: AddOnPlaylistItem) {
    if (UniqueIdHelper.isMissing(addOnPlaylistItem.id)) return this.create(addOnPlaylistItem);
    else return this.update(addOnPlaylistItem);
  }

  public async create(addOnPlaylistItem: AddOnPlaylistItem) {
    addOnPlaylistItem.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO addOnPlaylistItems (id, churchId, playlistId, addOnId, sort) VALUES (?, ?, ?, ?, ?);";
    const params = [addOnPlaylistItem.id, addOnPlaylistItem.churchId, addOnPlaylistItem.playlistId, addOnPlaylistItem.addOnId, addOnPlaylistItem.sort];
    await DB.query(sql, params);
    return addOnPlaylistItem;
  }

  public async update(addOnPlaylistItem: AddOnPlaylistItem) {
    const sql = "UPDATE addOnPlaylistItems SET playlistId=?, addOnId=?, sort=? WHERE id=? AND churchId=?";
    const params = [addOnPlaylistItem.playlistId, addOnPlaylistItem.addOnId, addOnPlaylistItem.sort, addOnPlaylistItem.id, addOnPlaylistItem.churchId];
    await DB.query(sql, params);
    return addOnPlaylistItem;
  }

  public load(id: string): Promise<AddOnPlaylistItem> {
    return DB.queryOne("SELECT * FROM addOnPlaylistItems WHERE id=?", [id]) as Promise<AddOnPlaylistItem>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM addOnPlaylistItems WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}
