import { DB } from "@churchapps/apihelper"
import { Study } from "../models";
import { UniqueIdHelper, MySqlHelper } from "../helpers";

export class StudyRepository {

  public save(study: Study) {
    if (UniqueIdHelper.isMissing(study.id)) return this.create(study); else return this.update(study);
  }

  public async create(study: Study) {
    study.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO studies (id, churchId, programId, name, slug, image, shortDescription, description, videoEmbedUrl, sort, live) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [study.id, study.churchId, study.programId, study.name, study.slug, study.image, study.shortDescription, study.description, study.videoEmbedUrl, study.sort, study.live];
    await DB.query(sql, params);
    return study;
  }

  public async update(study: Study) {
    const sql = "UPDATE studies SET name=?, slug=?, image=?, shortDescription=?, description=?, videoEmbedUrl=?, sort=?, live=? WHERE id=? AND churchId=?";
    const params = [study.name, study.slug, study.image, study.shortDescription, study.description, study.videoEmbedUrl, study.sort, study.live, study.id, study.churchId];
    await DB.query(sql, params);
    return study;
  }

  public loadByProgramId(churchId: string, programId: string): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE churchId=? AND programId=? ORDER BY sort", [churchId, programId]);
  }

  public loadPublicByProgramId(programId: string): Promise<Study[]> {
    const sql = "SELECT *"
    + " , (SELECT COUNT(*) FROM lessons WHERE studyId=s.id) AS lessonCount"
    + " FROM studies s"
    + " WHERE programId=? AND live=1 ORDER BY sort"
    return DB.query(sql, [programId]);
  }

  public loadPublicByProgramIds(programIds: string[]): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE programId IN (" + MySqlHelper.toQuotedAndCommaSeparatedString(programIds) + ") AND live=1 ORDER BY sort", [])
  }

  public load(churchId: string, id: string): Promise<Study> {
    return DB.queryOne("SELECT * FROM studies WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadPublicBySlug(programId: string, slug: string): Promise<Study> {
    return DB.queryOne("SELECT * FROM studies WHERE programId=? AND slug=? AND live=1 ORDER BY sort", [programId, slug]);
  }

  public loadPublicByIds(ids: string[]): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE id IN (?) and live=1", [ids]);
  }

  public loadPublicAll(): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE live=1", []);
  }

  public loadPublic(id: string): Promise<Study> {
    return DB.queryOne("SELECT * FROM studies WHERE id=? AND live=1 ORDER BY sort", [id]);
  }

  public loadAll(churchId: string): Promise<Study[]> {
    return DB.query("SELECT * FROM studies WHERE churchId=? ORDER BY sort", [churchId]);
  }

  public delete(churchId: string, id: string): Promise<Study> {
    return DB.query("DELETE FROM studies WHERE id=? AND churchId=?", [id, churchId]);
  }

}
