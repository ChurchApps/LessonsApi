import { Repositories } from "../repositories";
import { ArrayHelper } from "../apiBase/helpers";
import { Venue, Action } from "../models";

export class PlaylistHelper {


  public static async loadPlaylistActions(classroomId: string, venueName: string): Promise<Action[]> {
    const repo = Repositories.getCurrent();

    const currentSchedule = await repo.schedule.loadCurrent(classroomId);
    if (!currentSchedule) throw new Error(("Could not load schedule"));

    const lesson = await repo.lesson.loadPublic(currentSchedule.lessonId);
    if (!lesson) throw new Error(("Could not load lesson"));

    const venues = await repo.venue.loadByLessonId(lesson.churchId, lesson.id);
    if (!venues || venues.length === 0) throw new Error(("Could not load venues"));

    const venue: Venue = ArrayHelper.getOne(venues, "name", venueName);
    if (!venue) throw new Error(("Venue '" + venueName + "' not found. " + venues.join(", ")));

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

  public static getBestFile(action: Action, allFiles: any[]) {
    const preferredFileTypes = ["video/webm", "video/mp4", "image/jpeg", "image/png", "image/gif", "image/bitmap"]

    let availableFiles: any[] = [];
    if (action.assetId) availableFiles = ArrayHelper.getAll(allFiles, "assetId", action.assetId)
    else availableFiles = ArrayHelper.getAll(ArrayHelper.getAll(allFiles, "resourceId", action.resourceId), "assetId", "");

    let result: any = null;
    let bestIdx = 999;
    availableFiles.forEach(f => {
      const idx = preferredFileTypes.indexOf(f.fileType);
      if (idx > -1 && idx < bestIdx) { result = f; bestIdx = idx; }
    });
    return result;
  }




}