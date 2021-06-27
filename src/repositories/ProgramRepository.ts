import { DB } from "../apiBase/db";
import { Program } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProgramRepository {

  public save(program: Program) {
    if (UniqueIdHelper.isMissing(program.id)) return this.create(program); else return this.update(program);
  }

  public async create(program: Program) {
    program.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO programs (id, churchId, providerId, name, image, shortDescription, description, videoEmbedUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [program.id, program.churchId, program.providerId, program.name, program.shortDescription, program.description, program.videoEmbedUrl];
    await DB.query(sql, params);
    return program;
  }

  public async update(program: Program) {
    const sql = "UPDATE programs SET name=?, image=?, shortDescription=?, description=?, videoEmbedUrl=? WHERE id=? AND churchId=?";
    const params = [program.name, program.image, program.shortDescription, program.description, program.videoEmbedUrl, program.id, program.churchId];
    await DB.query(sql, params);
    return program;
  }

  public loadByProviderId(churchId: string, providerId: string): Promise<Program[]> {
    return DB.query("SELECT * FROM programs WHERE churchId=? AND providerId=?", [churchId, providerId]);
  }

  public load(churchId: string, id: string): Promise<Program> {
    return DB.queryOne("SELECT * FROM programs WHERE id=? and churchId=?", [id, churchId]);
  }


  public loadPublic(id: string): Promise<Program> {
    return DB.queryOne("SELECT * FROM programs WHERE id=?", [id]);
  }

  public loadPublicAll(): Promise<Program> {
    return DB.query("SELECT * FROM programs", []);
  }

  public loadAll(): Promise<Program> {
    return DB.query("SELECT * FROM programs", []);
  }

  public delete(churchId: string, id: string): Promise<Program> {
    return DB.query("DELETE FROM programs WHERE id=? AND churchId=?", [id, churchId]);
  }

}
