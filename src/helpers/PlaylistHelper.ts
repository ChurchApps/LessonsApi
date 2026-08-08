import { Repositories } from "../repositories";
import { ArrayHelper } from "@churchapps/apihelper";
import { Action, ExternalVideo } from "../models";
import { VimeoHelper } from "./VimeoHelper";

export class PlaylistHelper {
  public static async loadPlaylistVideos(actions: Action[]) {
    const repo = Repositories.getCurrent();
    const videoIds: string[] = ArrayHelper.getIds(actions, "externalVideoId");
    const videos = videoIds.length === 0 ? [] : await repo.externalVideo.loadByIds(videoIds);

    const addOnIds: string[] = ArrayHelper.getIds(actions, "addOnId");
    const addOnVideos = addOnIds.length === 0 ? [] : await repo.externalVideo.loadByContentTypeIds("addOn", addOnIds);
    videos.push(...addOnVideos);

    await this.refreshExpiredLinks(videos);
    return videos;
  }

  // Playlists serve stored play720/play1080 Vimeo links, which are signed and expire;
  // refresh stale ones here or players get dead URLs. On Vimeo failure keep stale links.
  private static async refreshExpiredLinks(videos: ExternalVideo[]) {
    const now = new Date();
    const expired = videos.filter(v => v.videoProvider?.toLowerCase() === "vimeo" && (!v.downloadsExpire || new Date(v.downloadsExpire) < now));
    await Promise.all(expired.map(async v => {
      try { await VimeoHelper.updateVimeoLinks(v); } catch (e) { console.error("Failed to refresh Vimeo links for video " + v.id, e); }
    }));
  }

  public static async loadPlaylistFiles(actions: Action[]) {
    const repo = Repositories.getCurrent();
    const resourceIds: string[] = ArrayHelper.getIds(actions, "resourceId");
    const assetFiles = resourceIds.length === 0 ? [] : await repo.asset.loadPlaylist(resourceIds);
    const variantFiles = resourceIds.length === 0 ? [] : await repo.variant.loadPlaylist(resourceIds);
    return assetFiles.concat(variantFiles);
  }

  public static getBestFiles(action: Action, allFiles: any[]) {
    if (!action.assetId) {
      const assetFiles: any[] = [];
      allFiles.forEach(f => {
        if (f.resourceId === action.resourceId && f.assetId) assetFiles.push(f);
      });
      if (assetFiles.length > 0) return assetFiles;
    }

    const preferredFileTypes = ["video/webm", "video/mp4", "image/jpeg", "image/png", "image/gif", "image/bitmap"];

    let availableFiles: any[] = [];
    if (action.assetId) availableFiles = ArrayHelper.getAll(allFiles, "assetId", action.assetId);
    else availableFiles = ArrayHelper.getAll(allFiles, "resourceId", action.resourceId);

    let bestIdx = 999;
    let bestFile: any = null;
    availableFiles.forEach(f => {
      const idx = preferredFileTypes.indexOf(f.fileType);
      if (idx > -1 && idx < bestIdx) {
        bestFile = f;
        bestIdx = idx;
      }
    });

    if (bestFile) return [bestFile];
    else return [];
  }
}
