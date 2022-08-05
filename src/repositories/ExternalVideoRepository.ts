import { DB } from "../apiBase/db";
import { ExternalVideo } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ExternalVideoRepository {

  public save(externalVideo: ExternalVideo) {
    if (UniqueIdHelper.isMissing(externalVideo.id)) return this.create(externalVideo); else return this.update(externalVideo);
  }

  public async create(externalVideo: ExternalVideo) {
    externalVideo.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO externalVideos (id, churchId, contentType, contentId, name, videoProvider, videoId) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [externalVideo.id, externalVideo.churchId, externalVideo.contentType, externalVideo.contentId, externalVideo.name, externalVideo.videoProvider, externalVideo.videoId];
    await DB.query(sql, params);
    return externalVideo;
  }

  public async update(externalVideo: ExternalVideo) {
    const sql = "UPDATE externalVideos SET contentType=?, contentId=?, name=?, videoProvider=?, videoId=? WHERE id=? AND churchId=?";
    const params = [externalVideo.contentType, externalVideo.contentId, externalVideo.name, externalVideo.videoProvider, externalVideo.videoId, externalVideo.id, externalVideo.churchId];
    await DB.query(sql, params);
    return externalVideo;
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE churchId=? AND contentType=? AND contentId=? order by name", [churchId, contentType, contentId]);
  }

  public loadPendingUpdate(limit: number): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE pendingUpdate=1 limit " + limit.toString(), []);
  }

  public loadPublicForLesson(lessonId: string): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE id in (SELECT externalVideoId from actions WHERE lessonId=?)", [lessonId]);
  }

  public load(churchId: string, id: string): Promise<ExternalVideo> {
    return DB.queryOne("SELECT * FROM externalVideos WHERE id=? and churchId=?", [id, churchId]);
  }

  public delete(churchId: string, id: string): Promise<ExternalVideo> {
    return DB.query("DELETE FROM externalVideos WHERE id=? AND churchId=?", [id, churchId]);
  }

}
