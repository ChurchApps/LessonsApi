import { DB } from "../apiBase/db";
import { Section } from "../models";
import { UniqueIdHelper } from "../helpers";

export class SectionRepository {

    public save(section: Section) {
        if (UniqueIdHelper.isMissing(section.id)) return this.create(section); else return this.update(section);
    }

    public async create(section: Section) {
        section.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO sections (id, churchId, lessonId, sectionType, name, sort) VALUES (?, ?, ?, ?, ?, ?);";
        const params = [section.id, section.churchId, section.lessonId, section.sectionType, section.name, section.sort];
        await DB.query(sql, params);
        return section;
    }

    public async update(section: Section) {
        const sql = "UPDATE sections SET lessonId=?, sectionType=?, name=?, sort=? WHERE id=? AND churchId=?";
        const params = [section.lessonId, section.sectionType, section.name, section.sort, section.id, section.churchId];
        await DB.query(sql, params);
        return section;
    }

    public loadByLessonId(lessonId: string): Promise<Section[]> {
        return DB.query("SELECT * FROM sections WHERE lessonId=? ORDER BY sort", [lessonId]);
    }

    public loadById(id: string): Promise<Section> {
        return DB.queryOne("SELECT * FROM sections WHERE id=?", [id]);
    }

    public delete(churchId: string, id: string): Promise<Section> {
        return DB.query("DELETE FROM sections WHERE id=? AND churchId=?", [id, churchId]);
    }

}
