import { DB } from "@churchapps/apihelper";
import { AddOnPlaylist } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AddOnPlaylistRepository {
  public save(addOnPlaylist: AddOnPlaylist) {
    if (UniqueIdHelper.isMissing(addOnPlaylist.id)) return this.create(addOnPlaylist);
    else return this.update(addOnPlaylist);
  }

  public async create(addOnPlaylist: AddOnPlaylist) {
    addOnPlaylist.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO addOnPlaylists (id, churchId, providerId, name) VALUES (?, ?, ?, ?);";
    const params = [addOnPlaylist.id, addOnPlaylist.churchId, addOnPlaylist.providerId, addOnPlaylist.name];
    await DB.query(sql, params);
    return addOnPlaylist;
  }

  public async update(addOnPlaylist: AddOnPlaylist) {
    const sql = "UPDATE addOnPlaylists SET providerId=?, name=? WHERE id=? AND churchId=?";
    const params = [addOnPlaylist.providerId, addOnPlaylist.name, addOnPlaylist.id, addOnPlaylist.churchId];
    await DB.query(sql, params);
    return addOnPlaylist;
  }

  public load(id: string): Promise<AddOnPlaylist> {
    return DB.queryOne("SELECT * FROM addOnPlaylists WHERE id=?", [id]) as Promise<AddOnPlaylist>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM addOnPlaylists WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}
