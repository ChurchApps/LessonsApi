import { Action, ExternalVideo, Asset, File } from "../models";
import { Repositories } from "../repositories";

export class DurationHelper {
  // Calculates estimated duration in seconds for a lesson action
  // Play: externalVideo.seconds, Images: 10 sec, Say: 120 wpm, Do: 1 min
  public static calculateSeconds(action: Action, externalVideos: ExternalVideo[], assets: Asset[], files: File[]): number {
    if (action.actionType === "Play" && action.externalVideoId) {
      const video = externalVideos.find(v => v.id === action.externalVideoId);
      if (video?.seconds) return video.seconds;
    }
    if (action.assetId) {
      const asset = assets.find(a => a.id === action.assetId);
      if (asset?.fileId) {
        const file = files.find(f => f.id === asset.fileId);
        if (file?.fileType?.startsWith("image")) return 10;
        if (file?.seconds) return file.seconds;
      }
    }
    if (action.actionType === "Say" && action.content) {
      const wordCount = action.content.trim().split(/\s+/).length;
      return Math.ceil((wordCount / 120) * 60);
    }
    if (action.actionType === "Do") return 60;
    return 0;
  }

  // Calculates total duration for a section by summing all action durations
  public static calculateSectionSeconds(actions: Action[], externalVideos: ExternalVideo[], assets: Asset[], files: File[]): number {
    return actions.reduce((total, action) => total + this.calculateSeconds(action, externalVideos, assets, files), 0);
  }

  // Loads duration-related data (external videos, assets, files) for a set of actions
  public static async loadDurationData(actions: Action[], churchId: string, repositories: Repositories): Promise<{ externalVideos: ExternalVideo[]; assets: Asset[]; files: File[] }> {
    const externalVideoIds = actions.filter(a => a.externalVideoId).map(a => a.externalVideoId);
    const externalVideos = externalVideoIds.length > 0 ? await repositories.externalVideo.loadByIds(externalVideoIds) : [];

    const assetIds = actions.filter(a => a.assetId).map(a => a.assetId);
    let assets: Asset[] = [];
    const fileIds: string[] = [];
    if (assetIds.length > 0) {
      const assetPromises = assetIds.map(assetId => repositories.asset.load(churchId, assetId));
      assets = (await Promise.all(assetPromises)).filter(a => a) as Asset[];
      fileIds.push(...assets.filter(a => a.fileId).map(a => a.fileId));
    }
    const files = fileIds.length > 0 ? await repositories.file.loadPublicByIds(fileIds) : [];

    return { externalVideos, assets, files };
  }
}
