import { DB } from "@churchapps/apihelper";
import { Lesson } from "../models";
import { UniqueIdHelper, MySqlHelper } from "../helpers";

export class LessonRepository {
  public save(lesson: Lesson) {
    if (UniqueIdHelper.isMissing(lesson.id)) return this.create(lesson);
    else return this.update(lesson);
  }

  public async create(lesson: Lesson) {
    lesson.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO lessons (id, churchId, studyId, name, slug, title, sort, image, live, description, videoEmbedUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [lesson.id, lesson.churchId, lesson.studyId, lesson.name, lesson.slug, lesson.title, lesson.sort, lesson.image, lesson.live, lesson.description, lesson.videoEmbedUrl];
    await DB.query(sql, params);
    return lesson;
  }

  public async update(lesson: Lesson) {
    const sql = "UPDATE lessons SET studyId=?, name=?, slug=?, title=?, sort=?, image=?, live=?, description=?, videoEmbedUrl=? WHERE id=? AND churchId=?";
    const params = [lesson.studyId, lesson.name, lesson.slug, lesson.title, lesson.sort, lesson.image, lesson.live, lesson.description, lesson.videoEmbedUrl, lesson.id, lesson.churchId];
    await DB.query(sql, params);
    return lesson;
  }

  public tempLessonsNeedingVideoFiles(): Promise<Lesson[]> {
    const sql = "select l.* from lessons l" + " left join externalVideos ev on ev.contentType='lesson' and ev.contentId=l.id" + " where l.churchId='L8fupS4MSOo' and l.videoEmbedUrl is not null and ev.id is null";
    return DB.query(sql, []) as Promise<Lesson[]>;
  }

  public loadByStudyId(churchId: string, studyId: string): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE churchId=? AND studyId=? ORDER BY sort", [churchId, studyId]) as Promise<Lesson[]>;
  }

  public loadPublicByStudyId(studyId: string): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE studyId=? AND live=1 ORDER BY sort", [studyId]) as Promise<Lesson[]>;
  }

  public loadPublicByStudyIds(ids: string[]): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE studyId IN (" + MySqlHelper.toQuotedAndCommaSeparatedString(ids) + ") AND live=1 ORDER BY sort", []) as Promise<Lesson[]>;
  }

  public loadPublicBySlug(studyId: string, slug: string): Promise<Lesson> {
    return DB.queryOne("SELECT * FROM lessons WHERE studyId=? AND slug=? and live=1", [studyId, slug]) as Promise<Lesson>;
  }

  public loadPublicByIds(ids: string[]): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE id IN (?) and live=1", [ids]) as Promise<Lesson[]>;
  }

  public loadPublic(id: string): Promise<Lesson> {
    return DB.queryOne("SELECT * FROM lessons WHERE id=? and live=1", [id]) as Promise<Lesson>;
  }

  public load(churchId: string, id: string): Promise<Lesson> {
    return DB.queryOne("SELECT * FROM lessons WHERE id=? AND churchId=?", [id, churchId]) as Promise<Lesson>;
  }

  public loadPublicAll(): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE live=1 ORDER BY sort", []) as Promise<Lesson[]>;
  }

  public loadAll(churchId: string): Promise<Lesson[]> {
    return DB.query("SELECT * FROM lessons WHERE churchId=? ORDER BY sort", [churchId]) as Promise<Lesson[]>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM lessons WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}
