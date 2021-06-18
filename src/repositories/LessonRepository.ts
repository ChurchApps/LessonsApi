import { DB } from "../apiBase/db";
import { Lesson } from "../models";
import { UniqueIdHelper } from "../helpers";

export class LessonRepository {

    public save(lesson: Lesson) {
        if (UniqueIdHelper.isMissing(lesson.id)) return this.create(lesson); else return this.update(lesson);
    }

    public async create(lesson: Lesson) {
        lesson.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO lessons (id, churchId, studyId, name, title, sort) VALUES (?, ?, ?, ?, ?, ?);";
        const params = [lesson.id, lesson.churchId, lesson.studyId, lesson.name, lesson.title, lesson.sort];
        await DB.query(sql, params);
        return lesson;
    }

    public async update(lesson: Lesson) {
        const sql = "UPDATE lessons SET studyId=?, name=?, title=?, sort=? WHERE id=? AND churchId=?";
        const params = [lesson.studyId, lesson.name, lesson.title, lesson.sort, lesson.id, lesson.churchId];
        await DB.query(sql, params);
        return lesson;
    }

    public loadByStudyId(studyId: string): Promise<Lesson[]> {
        return DB.query("SELECT * FROM lessons WHERE AND studyId=? ORDER BY sort", [studyId]);
    }

    public loadById(id: string): Promise<Lesson> {
        return DB.queryOne("SELECT * FROM lessons WHERE id=?", [id]);
    }

    public delete(churchId: string, id: string): Promise<Lesson> {
        return DB.query("DELETE FROM lessons WHERE id=? AND churchId=?", [id, churchId]);
    }

}
