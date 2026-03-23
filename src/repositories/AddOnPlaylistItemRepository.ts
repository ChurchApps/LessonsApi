import { getDb } from "../db";
import { AddOnPlaylistItem } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AddOnPlaylistItemRepository {
  public save(addOnPlaylistItem: AddOnPlaylistItem) {
    if (UniqueIdHelper.isMissing(addOnPlaylistItem.id)) return this.create(addOnPlaylistItem);
    else return this.update(addOnPlaylistItem);
  }

  public async create(addOnPlaylistItem: AddOnPlaylistItem) {
    addOnPlaylistItem.id = UniqueIdHelper.shortId();
    await getDb().insertInto("addOnPlaylistItems").values({
      id: addOnPlaylistItem.id,
      churchId: addOnPlaylistItem.churchId,
      playlistId: addOnPlaylistItem.playlistId,
      addOnId: addOnPlaylistItem.addOnId,
      sort: addOnPlaylistItem.sort
    }).execute();
    return addOnPlaylistItem;
  }

  public async update(addOnPlaylistItem: AddOnPlaylistItem) {
    await getDb().updateTable("addOnPlaylistItems").set({ playlistId: addOnPlaylistItem.playlistId, addOnId: addOnPlaylistItem.addOnId, sort: addOnPlaylistItem.sort }).where("id", "=", addOnPlaylistItem.id).where("churchId", "=", addOnPlaylistItem.churchId).execute();
    return addOnPlaylistItem;
  }

  public async load(id: string): Promise<AddOnPlaylistItem> {
    return await getDb().selectFrom("addOnPlaylistItems").selectAll().where("id", "=", id).executeTakeFirst() as AddOnPlaylistItem;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("addOnPlaylistItems").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
