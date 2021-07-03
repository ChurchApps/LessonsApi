import { DB } from "../apiBase/db";
import { Action } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ActionRepository {

  public save(action: Action) {
    if (UniqueIdHelper.isMissing(action.id)) return this.create(action); else return this.update(action);
  }

  public async create(action: Action) {
    action.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO actions (id, churchId, lessonId, roleId, actionType, content, sort, resourceId, assetId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [action.id, action.churchId, action.lessonId, action.roleId, action.actionType, action.content, action.sort, action.resourceId, action.assetId];
    await DB.query(sql, params);
    return action;
  }

  public async update(action: Action) {
    const sql = "UPDATE actions SET lessonId=?, roleId=?, actionType=?, content=?, sort=?, resourceId=?, assetId=? WHERE id=? AND churchId=?";
    const params = [action.lessonId, action.roleId, action.actionType, action.content, action.sort, action.resourceId, action.assetId, action.id, action.churchId];
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
