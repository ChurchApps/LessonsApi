import { ArrayHelper, DB } from "@churchapps/apihelper"
import { Classroom } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ClassroomRepository {

  public save(classroom: Classroom) {
    if (UniqueIdHelper.isMissing(classroom.id)) return this.create(classroom); else return this.update(classroom);
  }

  public async create(classroom: Classroom) {
    classroom.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO classrooms (id, churchId, name, recentGroupId, upcomingGroupId) VALUES (?, ?, ?, ?, ?);";
    const params = [classroom.id, classroom.churchId, classroom.name, classroom.recentGroupId, classroom.upcomingGroupId];
    await DB.query(sql, params);
    return classroom;
  }

  public async update(classroom: Classroom) {
    const sql = "UPDATE classrooms SET name=?, recentGroupId=?, upcomingGroupId=? WHERE id=? AND churchId=?";
    const params = [classroom.name, classroom.recentGroupId, classroom.upcomingGroupId, classroom.id, classroom.churchId];
    await DB.query(sql, params);
    return classroom;
  }

  public loadForPerson(churchId: string, groupIds: string[]): Promise<Classroom[]> {
    const sql = "SELECT * FROM classrooms WHERE churchId=? AND (recentGroupId IN (?) OR upcomingGroupId IN (?)) ORDER BY name";
    return DB.query(sql, [churchId, groupIds, groupIds]);
  }

  public loadByIds(churchId: string, ids: string[]): Promise<Classroom[]> {
    const sql = "SELECT * FROM classrooms WHERE churchId=? AND id IN (" + ArrayHelper.fillArray("?", ids.length) + ")";
    return DB.query(sql, [churchId].concat(ids));
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
