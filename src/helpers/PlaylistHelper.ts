import { Repositories } from "../repositories";
import { ArrayHelper } from "../apiBase/helpers";
import { Venue, Action } from "../models";

export class PlaylistHelper {


  public static async loadPlaylistActions(classroomId: string): Promise<Action[]> {
    const repo = Repositories.getCurrent();

    const currentSchedule = await repo.schedule.loadCurrent(classroomId);
    if (!currentSchedule) throw new Error(("Could not load schedule"));

    const venue: Venue = await repo.venue.loadPublic(currentSchedule.venueId);
    if (!venue) throw new Error(("Could not load venue: " + currentSchedule.venueId));

    const actions = await repo.action.loadPlaylistActions(venue.id)
    return actions;
  }


  public static async loadPlaylistFiles(actions: Action[]) {
    const repo = Repositories.getCurrent();
    const resourceIds: string[] = ArrayHelper.getIds(actions, "resourceId");
    const assetFiles = (resourceIds.length === 0) ? [] : await repo.asset.loadPlaylist(resourceIds);
    const variantFiles = (resourceIds.length === 0) ? [] : await repo.variant.loadPlaylist(resourceIds);
    return assetFiles.concat(variantFiles);
  }

  public static getBestFiles(action: Action, allFiles: any[]) {

    if (!action.assetId) {
      const assetFiles: any[] = []
      allFiles.forEach(f => { if (f.resourceId === action.resourceId && f.assetId) assetFiles.push(f); })
      if (assetFiles.length > 0) return assetFiles;
    }

    const preferredFileTypes = ["video/webm", "video/mp4", "image/jpeg", "image/png", "image/gif", "image/bitmap"]

    let availableFiles: any[] = [];
    if (action.assetId) availableFiles = ArrayHelper.getAll(allFiles, "assetId", action.assetId)
    else availableFiles = ArrayHelper.getAll(allFiles, "resourceId", action.resourceId);

    let bestIdx = 999;
    let bestFile: any = null;
    availableFiles.forEach(f => {
      const idx = preferredFileTypes.indexOf(f.fileType);
      if (idx > -1 && idx < bestIdx) { bestFile = f; bestIdx = idx; }
    });

    if (bestFile) return [bestFile];
    else return [];
  }




}