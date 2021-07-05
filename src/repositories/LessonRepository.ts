import { DB } from "../apiBase/db";
import { Lesson } from "../models";
import { UniqueIdHelper } from "../helpers";

export class LessonRepository {

  public save(lesson: Lesson) {
    if (UniqueIdHelper.isMissing(lesson.id)) return this.create(lesson); else return this.update(lesson);
  }

  public async create(lesson: Lesson) {
    lesson.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO lessons (id, churchId, studyId, name, title, sort, image, live, description, videoEmbedUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [lesson.id, lesson.churchId, lesson.studyId, lesson.name, lesson.title, lesson.sort, lesson.image, lesson.live, lesson.description, lesson.videoEmbedUrl];
    await DB.query(sql, params);
    return lesson;
  }

  public async update(lesson: Lesson) {
    const sql = "UPDATE lessons SET studyId=?, name=?, title=?, sort=?, image=?, live=?, description=?, videoEmbedUrl=? WHERE id=? AND churchId=?";
    const params = [lesson.studyId, lesson.name, lesson.title, lesson.sort, lesson.image, lesson.live, lesson.description, lesson.videoEmbedUrl, lesson.id, lesson.churchId];
    await DB.query(sql, params);
    return lesson;
  }

  public loadByStudyId(churchId: string, studyId: string): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE churchId=? AND studyId=? ORDER BY sort", [churchId, studyId]);
  }

  public loadPublicByStudyId(studyId: string): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE studyId=? AND live=1 ORDER BY sort", [studyId]);
  }

  public loadPublic(id: string): Promise<Lesson> {
    return DB.queryOne("SELECT * FROM lessons WHERE id=?", [id]);
  }

  public load(churchId: string, id: string): Promise<Lesson> {
    return DB.queryOne("SELECT * FROM lessons WHERE id=? AND churchId=?", [id, churchId]);
  }


  public loadAll(churchId: string): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE churchId=? ORDER BY sort", [churchId]);
  }

  public delete(churchId: string, id: string): Promise<Lesson> {
    return DB.query("DELETE FROM lessons WHERE id=? AND churchId=?", [id, churchId]);
  }

}
