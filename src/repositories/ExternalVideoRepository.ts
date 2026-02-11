import { DB } from "@churchapps/apihelper";
import { ExternalVideo } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ExternalVideoRepository {
  public save(externalVideo: ExternalVideo) {
    if (UniqueIdHelper.isMissing(externalVideo.id)) return this.create(externalVideo);
    else return this.update(externalVideo);
  }

  public async create(externalVideo: ExternalVideo) {
    externalVideo.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO externalVideos (id, churchId, contentType, contentId, name, videoProvider, videoId, seconds, loopVideo, download720, download1080, download4k, play720, play1080, play4k, thumbnail, downloadsExpire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [
      externalVideo.id, externalVideo.churchId, externalVideo.contentType, externalVideo.contentId, externalVideo.name, externalVideo.videoProvider, externalVideo.videoId, externalVideo.seconds, externalVideo.loopVideo, externalVideo.download720, externalVideo.download1080, externalVideo.download4k, externalVideo.play720, externalVideo.play1080, externalVideo.play4k, externalVideo.thumbnail, externalVideo.downloadsExpire
    ];
    await DB.query(sql, params);
    return externalVideo;
  }

  public async update(externalVideo: ExternalVideo) {
    const sql = "UPDATE externalVideos SET contentType=?, contentId=?, name=?, videoProvider=?, videoId=?, seconds=?, loopVideo=?, download720=?, download1080=?, download4k=?, play720=?, play1080=?, play4k=?, thumbnail=?, downloadsExpire=? WHERE id=? AND churchId=?";
    const params = [
      externalVideo.contentType, externalVideo.contentId, externalVideo.name, externalVideo.videoProvider, externalVideo.videoId, externalVideo.seconds, externalVideo.loopVideo, externalVideo.download720, externalVideo.download1080, externalVideo.play4k, externalVideo.play720, externalVideo.play1080, externalVideo.download4k, externalVideo.thumbnail, externalVideo.downloadsExpire, externalVideo.id, externalVideo.churchId
    ];
    await DB.query(sql, params);
    return externalVideo;
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE churchId=? AND contentType=? AND contentId=? order by name", [churchId, contentType, contentId]) as Promise<ExternalVideo[]>;
  }

  public loadByContentTypeIds(contentType: string, contentIds: string[]): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE contentType=? AND contentId IN (?) order by name", [contentType, contentIds]) as Promise<ExternalVideo[]>;
  }

  public loadPendingUpdate(limit: number): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE pendingUpdate=1 limit " + limit.toString(), []) as Promise<ExternalVideo[]>;
  }

  public loadPublicForLesson(lessonId: string): Promise<ExternalVideo[]> {
    const sql = "SELECT * FROM externalVideos WHERE id in (SELECT externalVideoId from actions WHERE lessonId=?)" + " UNION" + " SELECT * FROM externalVideos WHERE contentId in (SELECT addOnId from actions WHERE lessonId=?)";

    return DB.query(sql, [lessonId, lessonId]) as Promise<ExternalVideo[]>;
  }

  public loadByIds(ids: string[]): Promise<ExternalVideo[]> {
    return DB.query("SELECT * FROM externalVideos WHERE id in (?)", [ids]) as Promise<ExternalVideo[]>;
  }

  public load(churchId: string, id: string): Promise<ExternalVideo> {
    return DB.queryOne("SELECT * FROM externalVideos WHERE id=? and churchId=?", [id, churchId]) as Promise<ExternalVideo>;
  }

  public loadPublic(id: string): Promise<ExternalVideo> {
    return DB.queryOne("SELECT * FROM externalVideos WHERE id=?", [id]) as Promise<ExternalVideo>;
  }

  public tempLoadNeedingUpdate(): Promise<ExternalVideo[]> {
    return DB.query("select * from externalVideos where downloadsExpire is null", []) as Promise<ExternalVideo[]>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM externalVideos WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}
