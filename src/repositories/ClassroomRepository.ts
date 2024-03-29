import { DB } from "@churchapps/apihelper"
import { Classroom } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ClassroomRepository {

  public save(classroom: Classroom) {
    if (UniqueIdHelper.isMissing(classroom.id)) return this.create(classroom); else return this.update(classroom);
  }

  public async create(classroom: Classroom) {
    classroom.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO classrooms (id, churchId, name) VALUES (?, ?, ?);";
    const params = [classroom.id, classroom.churchId, classroom.name];
    await DB.query(sql, params);
    return classroom;
  }

  public async update(classroom: Classroom) {
    const sql = "UPDATE classrooms SET name=? WHERE id=? AND churchId=?";
    const params = [classroom.name, classroom.id, classroom.churchId];
    await DB.query(sql, params);
    return classroom;
  }

  public loadByChurchId(churchId: string): Promise<Classroom[]> {
    return DB.query("SELECT * FROM classrooms WHERE churchId=? ORDER BY name", [churchId]);
  }

  public load(id: string): Promise<Classroom> {
    return DB.queryOne("SELECT * FROM classrooms WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Classroom> {
    return DB.query("DELETE FROM classrooms WHERE id=? AND churchId=?", [id, churchId]);
  }

}
