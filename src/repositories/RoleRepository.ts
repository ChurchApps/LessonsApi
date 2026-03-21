import { getDb } from "../db";
import { Role } from "../models";
import { UniqueIdHelper } from "../helpers";

export class RoleRepository {
  public save(role: Role) {
    if (UniqueIdHelper.isMissing(role.id)) return this.create(role);
    else return this.update(role);
  }

  public async create(role: Role) {
    role.id = UniqueIdHelper.shortId();
    await getDb().insertInto("roles").values({ id: role.id, churchId: role.churchId, lessonId: role.lessonId, sectionId: role.sectionId, name: role.name, sort: role.sort }).execute();
    return role;
  }

  public async update(role: Role) {
    await getDb().updateTable("roles").set({ lessonId: role.lessonId, sectionId: role.sectionId, name: role.name, sort: role.sort }).where("id", "=", role.id).where("churchId", "=", role.churchId).execute();
    return role;
  }

  public async loadByLessonId(lessonId: string): Promise<Role[]> {
    return await getDb().selectFrom("roles").selectAll().where("lessonId", "=", lessonId).orderBy("sort").execute() as Role[];
  }

  public async loadPublicAll(): Promise<Role[]> {
    return await getDb().selectFrom("roles").selectAll().orderBy("sort").execute() as Role[];
  }

  public async load(id: string): Promise<Role> {
    return await getDb().selectFrom("roles").selectAll().where("id", "=", id).executeTakeFirst() as Role;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("roles").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
