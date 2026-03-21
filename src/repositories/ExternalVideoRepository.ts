import { getDb } from "../db";
import { ExternalVideo } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ExternalVideoRepository {
  public save(externalVideo: ExternalVideo) {
    if (UniqueIdHelper.isMissing(externalVideo.id)) return this.create(externalVideo);
    else return this.update(externalVideo);
  }

  public async create(externalVideo: ExternalVideo) {
    externalVideo.id = UniqueIdHelper.shortId();
    await getDb().insertInto("externalVideos").values({
      id: externalVideo.id,
      churchId: externalVideo.churchId,
      contentType: externalVideo.contentType,
      contentId: externalVideo.contentId,
      name: externalVideo.name,
      videoProvider: externalVideo.videoProvider,
      videoId: externalVideo.videoId,
      seconds: externalVideo.seconds,
      loopVideo: externalVideo.loopVideo,
      download720: externalVideo.download720,
      download1080: externalVideo.download1080,
      download4k: externalVideo.download4k,
      play720: externalVideo.play720,
      play1080: externalVideo.play1080,
      play4k: externalVideo.play4k,
      thumbnail: externalVideo.thumbnail,
      downloadsExpire: externalVideo.downloadsExpire
    }).execute();
    return externalVideo;
  }

  public async update(externalVideo: ExternalVideo) {
    await getDb().updateTable("externalVideos").set({
      contentType: externalVideo.contentType,
      contentId: externalVideo.contentId,
      name: externalVideo.name,
      videoProvider: externalVideo.videoProvider,
      videoId: externalVideo.videoId,
      seconds: externalVideo.seconds,
      loopVideo: externalVideo.loopVideo,
      download720: externalVideo.download720,
      download1080: externalVideo.download1080,
      download4k: externalVideo.download4k,
      play720: externalVideo.play720,
      play1080: externalVideo.play1080,
      play4k: externalVideo.play4k,
      thumbnail: externalVideo.thumbnail,
      downloadsExpire: externalVideo.downloadsExpire
    }).where("id", "=", externalVideo.id).where("churchId", "=", externalVideo.churchId).execute();
    return externalVideo;
  }

  public async loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<ExternalVideo[]> {
    return await getDb().selectFrom("externalVideos").selectAll()
      .where("churchId", "=", churchId).where("contentType", "=", contentType).where("contentId", "=", contentId)
      .orderBy("name").execute() as ExternalVideo[];
  }

  public async loadByContentTypeIds(contentType: string, contentIds: string[]): Promise<ExternalVideo[]> {
    return await getDb().selectFrom("externalVideos").selectAll()
      .where("contentType", "=", contentType).where("contentId", "in", contentIds)
      .orderBy("name").execute() as ExternalVideo[];
  }

  public async loadPendingUpdate(limit: number): Promise<ExternalVideo[]> {
    return await getDb().selectFrom("externalVideos").selectAll().where("pendingUpdate", "=", true).limit(limit).execute() as ExternalVideo[];
  }

  public async loadPublicForLesson(lessonId: string): Promise<ExternalVideo[]> {
    const query1 = getDb().selectFrom("externalVideos").selectAll()
      .where("id", "in", getDb().selectFrom("actions").select("externalVideoId").where("lessonId", "=", lessonId));
    const query2 = getDb().selectFrom("externalVideos").selectAll()
      .where("contentId", "in", getDb().selectFrom("actions").select("addOnId").where("lessonId", "=", lessonId));
    return await query1.union(query2).execute() as ExternalVideo[];
  }

  public async loadByIds(ids: string[]): Promise<ExternalVideo[]> {
    return await getDb().selectFrom("externalVideos").selectAll().where("id", "in", ids).execute() as ExternalVideo[];
  }

  public async load(churchId: string, id: string): Promise<ExternalVideo> {
    return await getDb().selectFrom("externalVideos").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as ExternalVideo;
  }

  public async loadPublic(id: string): Promise<ExternalVideo> {
    return await getDb().selectFrom("externalVideos").selectAll().where("id", "=", id).executeTakeFirst() as ExternalVideo;
  }

  public async tempLoadNeedingUpdate(): Promise<ExternalVideo[]> {
    return await getDb().selectFrom("externalVideos").selectAll().where("downloadsExpire", "is", null).execute() as ExternalVideo[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("externalVideos").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
