import { DB } from "../apiBase/db";
import { Action } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ActionRepository {

  public save(action: Action) {
    return action.id ? this.update(action) : this.create(action);
  }

  private async create(action: Action) {
    action.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO actions (id, churchId, lessonId, roleId, actionType, content, sort) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [action.id, action.churchId, action.lessonId, action.roleId, action.actionType, action.content, action.sort];
    await DB.query(sql, params);
    return action;
  }

  private async update(action: Action) {
    const sql = "UPDATE actions SET lessonId=?, roleId=?, actionType=?, content=?, sort=? WHERE id=? AND churchId=?";
    const params = [action.lessonId, action.roleId, action.actionType, action.content, action.sort, action.id, action.churchId];
    await DB.query(sql, params);
    return action;
  }

  public loadByLessonId(lessonId: string): Promise<Action[]> {
    return DB.query("SELECT * FROM actions WHERE lessonId=? ORDER BY sort", [lessonId]);
  }

  public load(id: string): Promise<Action> {
    return DB.queryOne("SELECT * FROM actions WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Action> {
    return DB.query("DELETE FROM actions WHERE id=? AND churchId=?", [id, churchId]);
  }

}
