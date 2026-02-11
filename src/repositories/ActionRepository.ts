import { DB } from "@churchapps/apihelper";
import { Action } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ActionRepository {
  public save(action: Action) {
    if (UniqueIdHelper.isMissing(action.id)) return this.create(action);
    else return this.update(action);
  }

  public async create(action: Action) {
    action.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO actions (id, churchId, lessonId, roleId, actionType, content, sort, resourceId, assetId, externalVideoId, addOnId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [
      action.id, action.churchId, action.lessonId, action.roleId, action.actionType, action.content, action.sort, action.resourceId, action.assetId, action.externalVideoId, action.addOnId
    ];
    await DB.query(sql, params);
    return action;
  }

  public async update(action: Action) {
    const sql = "UPDATE actions SET lessonId=?, roleId=?, actionType=?, content=?, sort=?, resourceId=?, assetId=?, externalVideoId=?, addOnId=? WHERE id=? AND churchId=?";
    const params = [
      action.lessonId, action.roleId, action.actionType, action.content, action.sort, action.resourceId, action.assetId, action.externalVideoId, action.addOnId, action.id, action.churchId
    ];
    await DB.query(sql, params);
    return action;
  }

  public loadPlaylistActions(venueId: string, churchId: string): Promise<Action[]> {
    const sql = "select a.*, s.id as sectionId " + " from sections s" + " inner join roles r on r.sectionId=s.id" + " inner join actions a on a.roleId=r.id and a.actionType in ('Play', 'Add-on')" + " left join customizations c on c.churchId=? AND c.venueId=s.venueId AND c.action='remove' AND c.contentId IN (s.id, r.id, a.id)" + " left join customizations ac on ac.churchId=? AND ac.venueId=s.venueId AND ac.action='sort' AND ac.contentId=a.id" + " left join customizations rc on rc.churchId=? AND rc.venueId=s.venueId AND rc.action='sort' AND rc.contentId=r.id" + " left join customizations sc on sc.churchId=? AND sc.venueId=s.venueId AND sc.action='sort' AND sc.contentId=s.id" + " where s.venueId=? and c.id is null" + " order by IFNULL(cast(sc.actionContent as unsigned), s.sort), IFNULL(cast(rc.actionContent as unsigned), r.sort), IFNULL(cast(ac.actionContent as unsigned), a.sort)";
    return DB.query(sql, [churchId, churchId, churchId, churchId, venueId]) as Promise<Action[]>;
  }

  public loadByLessonId(lessonId: string): Promise<Action[]> {
    return DB.query("SELECT * FROM actions WHERE lessonId=? ORDER BY sort", [lessonId]) as Promise<Action[]>;
  }

  public loadPublicAll(): Promise<Action[]> {
    return DB.query("SELECT * FROM actions ORDER BY sort", []) as Promise<Action[]>;
  }

  public load(id: string): Promise<Action> {
    return DB.queryOne("SELECT * FROM actions WHERE id=?", [id]) as Promise<Action>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM actions WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}
