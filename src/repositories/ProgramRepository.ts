import { DB } from "../apiBase/db";
import { Program } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProgramRepository {

  public save(program: Program) {
    if (UniqueIdHelper.isMissing(program.id)) return this.create(program); else return this.update(program);
  }

  public async create(program: Program) {
    program.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO programs (id, churchId, providerId, name, image) VALUES (?, ?, ?, ?, ?);";
    const params = [program.id, program.churchId, program.providerId, program.name];
    await DB.query(sql, params);
    return program;
  }

  public async update(program: Program) {
    const sql = "UPDATE programs SET name=?, image=? WHERE id=? AND churchId=?";
    const params = [program.name, program.image, program.id, program.churchId];
    await DB.query(sql, params);
    return program;
  }

  public loadByProviderId(providerId: string): Promise<Program[]> {
    return DB.query("SELECT * FROM programs WHERE providerId=?", [providerId]);
  }

  public load(id: string): Promise<Program> {
    return DB.queryOne("SELECT * FROM programs WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Program> {
    return DB.query("DELETE FROM programs WHERE id=? AND churchId=?", [id, churchId]);
  }

}
