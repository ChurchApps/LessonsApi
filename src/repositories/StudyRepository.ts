import { DB } from "../apiBase/db";
import { Study } from "../models";
import { UniqueIdHelper } from "../helpers";

export class StudyRepository {

    public save(study: Study) {
        if (UniqueIdHelper.isMissing(study.id)) return this.create(study); else return this.update(study);
    }

    public async create(study: Study) {
        study.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO studies (id, churchId, programId, name) VALUES (?, ?, ?, ?);";
        const params = [study.id, study.churchId, study.programId, study.name];
        await DB.query(sql, params);
        return study;
    }

    public async update(study: Study) {
        const sql = "UPDATE studies SET name=? WHERE id=? AND churchId=?";
        const params = [study.name, study.id, study.churchId];
        await DB.query(sql, params);
        return study;
    }

    public loadByProgramId(programId: string): Promise<Study[]> {
        return DB.query("SELECT * FROM studies WHERE programId=?", [programId]);
    }

    public load(id: string): Promise<Study> {
        return DB.queryOne("SELECT * FROM studies WHERE id=?", [id]);
    }

    public delete(churchId: string, id: string): Promise<Study> {
        return DB.query("DELETE FROM studies WHERE id=? AND churchId=?", [id, churchId]);
    }

}
