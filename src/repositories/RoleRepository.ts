import { DB } from "@churchapps/apihelper"
import { Role } from "../models";
import { UniqueIdHelper } from "../helpers";

export class RoleRepository {

  public save(role: Role) {
    if (UniqueIdHelper.isMissing(role.id)) return this.create(role); else return this.update(role);
  }

  public async create(role: Role) {
    role.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO roles (id, churchId, lessonId, sectionId, name, sort) VALUES (?, ?, ?, ?, ?, ?);";
    const params = [role.id, role.churchId, role.lessonId, role.sectionId, role.name, role.sort];
    await DB.query(sql, params);
    return role;
  }

  public async update(role: Role) {
    const sql = "UPDATE roles SET lessonId=?, sectionId=?, name=?, sort=? WHERE id=? AND churchId=?";
    const params = [role.lessonId, role.sectionId, role.name, role.sort, role.id, role.churchId];
    await DB.query(sql, params);
    return role;
  }

  public loadByLessonId(lessonId: string): Promise<Role[]> {
    return DB.query("SELECT * FROM roles WHERE lessonId=? ORDER BY sort", [lessonId]);
  }

  public load(id: string): Promise<Role> {
    return DB.queryOne("SELECT * FROM roles WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Role> {
    return DB.query("DELETE FROM roles WHERE id=? AND churchId=?", [id, churchId]);
  }

}
