import { sql } from "kysely";
import { getDb } from "../db";
import { Action } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ActionRepository {
  public save(action: Action) {
    if (UniqueIdHelper.isMissing(action.id)) return this.create(action);
    else return this.update(action);
  }

  public async create(action: Action) {
    action.id = UniqueIdHelper.shortId();
    await getDb().insertInto("actions").values({
      id: action.id,
      churchId: action.churchId,
      lessonId: action.lessonId,
      roleId: action.roleId,
      actionType: action.actionType,
      content: action.content,
      sort: action.sort,
      resourceId: action.resourceId,
      assetId: action.assetId,
      externalVideoId: action.externalVideoId,
      addOnId: action.addOnId
    }).execute();
    return action;
  }

  public async update(action: Action) {
    await getDb().updateTable("actions").set({
      lessonId: action.lessonId,
      roleId: action.roleId,
      actionType: action.actionType,
      content: action.content,
      sort: action.sort,
      resourceId: action.resourceId,
      assetId: action.assetId,
      externalVideoId: action.externalVideoId,
      addOnId: action.addOnId
    }).where("id", "=", action.id).where("churchId", "=", action.churchId).execute();
    return action;
  }

  public async loadPlaylistActions(venueId: string, churchId: string): Promise<Action[]> {
    const result = await sql<any>`
      SELECT a.*, s.id as sectionId
      FROM sections s
      INNER JOIN roles r ON r.sectionId=s.id
      INNER JOIN actions a ON a.roleId=r.id AND a.actionType IN ('Play', 'Add-on')
      LEFT JOIN customizations c ON c.churchId=${churchId} AND c.venueId=s.venueId AND c.action='remove' AND c.contentId IN (s.id, r.id, a.id)
      LEFT JOIN customizations ac ON ac.churchId=${churchId} AND ac.venueId=s.venueId AND ac.action='sort' AND ac.contentId=a.id
      LEFT JOIN customizations rc ON rc.churchId=${churchId} AND rc.venueId=s.venueId AND rc.action='sort' AND rc.contentId=r.id
      LEFT JOIN customizations sc ON sc.churchId=${churchId} AND sc.venueId=s.venueId AND sc.action='sort' AND sc.contentId=s.id
      WHERE s.venueId=${venueId} AND c.id IS NULL
      ORDER BY IFNULL(CAST(sc.actionContent AS UNSIGNED), s.sort), IFNULL(CAST(rc.actionContent AS UNSIGNED), r.sort), IFNULL(CAST(ac.actionContent AS UNSIGNED), a.sort)
    `.execute(getDb());
    return result.rows as Action[];
  }

  public async loadByLessonId(lessonId: string): Promise<Action[]> {
    return await getDb().selectFrom("actions").selectAll().where("lessonId", "=", lessonId).orderBy("sort").execute() as Action[];
  }

  public async loadPublicAll(): Promise<Action[]> {
    return await getDb().selectFrom("actions").selectAll().orderBy("sort").execute() as Action[];
  }

  public async load(id: string): Promise<Action> {
    return await getDb().selectFrom("actions").selectAll().where("id", "=", id).executeTakeFirst() as Action;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("actions").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
