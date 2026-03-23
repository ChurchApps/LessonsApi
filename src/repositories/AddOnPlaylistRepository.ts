import { getDb } from "../db";
import { AddOnPlaylist } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AddOnPlaylistRepository {
  public save(addOnPlaylist: AddOnPlaylist) {
    if (UniqueIdHelper.isMissing(addOnPlaylist.id)) return this.create(addOnPlaylist);
    else return this.update(addOnPlaylist);
  }

  public async create(addOnPlaylist: AddOnPlaylist) {
    addOnPlaylist.id = UniqueIdHelper.shortId();
    await getDb().insertInto("addOnPlaylists").values({ id: addOnPlaylist.id, churchId: addOnPlaylist.churchId, providerId: addOnPlaylist.providerId, name: addOnPlaylist.name }).execute();
    return addOnPlaylist;
  }

  public async update(addOnPlaylist: AddOnPlaylist) {
    await getDb().updateTable("addOnPlaylists").set({ providerId: addOnPlaylist.providerId, name: addOnPlaylist.name }).where("id", "=", addOnPlaylist.id).where("churchId", "=", addOnPlaylist.churchId).execute();
    return addOnPlaylist;
  }

  public async load(id: string): Promise<AddOnPlaylist> {
    return await getDb().selectFrom("addOnPlaylists").selectAll().where("id", "=", id).executeTakeFirst() as AddOnPlaylist;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("addOnPlaylists").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
