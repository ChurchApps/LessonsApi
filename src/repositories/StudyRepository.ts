import { DB } from "../apiBase/db";
import { Study } from "../models";
import { UniqueIdHelper } from "../helpers";

export class StudyRepository {

  public save(study: Study) {
    if (UniqueIdHelper.isMissing(study.id)) return this.create(study); else return this.update(study);
  }

  public async create(study: Study) {
    study.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO studies (id, churchId, programId, name, image, shortDescription, description, videoEmbedUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [study.id, study.churchId, study.programId, study.name, study.image, study.shortDescription, study.description, study.videoEmbedUrl];
    await DB.query(sql, params);
    return study;
  }

  public async update(study: Study) {
    const sql = "UPDATE studies SET name=?, image=?, shortDescription=?, description=?, videoEmbedUrl=? WHERE id=? AND churchId=?";
    const params = [study.name, study.image, study.shortDescription, study.description, study.videoEmbedUrl, study.id, study.churchId];
    await DB.query(sql, params);
    return study;
  }

  public loadByProgramId(churchId: string, programId: string): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE churchId=? AND programId=?", [churchId, programId]);
  }

  public loadPublicByProgramId(programId: string): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE programId=?", [programId]);
  }

  public load(churchId: string, id: string): Promise<Study> {
    return DB.queryOne("SELECT * FROM studies WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadPublic(id: string): Promise<Study> {
    return DB.queryOne("SELECT * FROM studies WHERE id=?", [id]);
  }

  public loadAll(churchId: string): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE churchId=?", [churchId]);
  }

  public delete(churchId: string, id: string): Promise<Study> {
    return DB.query("DELETE FROM studies WHERE id=? AND churchId=?", [id, churchId]);
  }

}
