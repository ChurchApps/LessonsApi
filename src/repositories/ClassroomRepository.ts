import { getDb } from "../db";
import { Classroom } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ClassroomRepository {
  public save(classroom: Classroom) {
    if (UniqueIdHelper.isMissing(classroom.id)) return this.create(classroom);
    else return this.update(classroom);
  }

  public async create(classroom: Classroom) {
    classroom.id = UniqueIdHelper.shortId();
    await getDb().insertInto("classrooms").values({
      id: classroom.id,
      churchId: classroom.churchId,
      name: classroom.name,
      recentGroupId: classroom.recentGroupId,
      upcomingGroupId: classroom.upcomingGroupId
    }).execute();
    return classroom;
  }

  public async update(classroom: Classroom) {
    await getDb().updateTable("classrooms").set({ name: classroom.name, recentGroupId: classroom.recentGroupId, upcomingGroupId: classroom.upcomingGroupId }).where("id", "=", classroom.id).where("churchId", "=", classroom.churchId).execute();
    return classroom;
  }

  public async loadForPerson(churchId: string, groupIds: string[]): Promise<Classroom[]> {
    return await getDb().selectFrom("classrooms").selectAll()
      .where("churchId", "=", churchId)
      .where((eb) => eb.or([
        eb("recentGroupId", "in", groupIds),
        eb("upcomingGroupId", "in", groupIds)
      ]))
      .orderBy("name")
      .execute() as Classroom[];
  }

  public async loadByIds(churchId: string, ids: string[]): Promise<Classroom[]> {
    return await getDb().selectFrom("classrooms").selectAll().where("churchId", "=", churchId).where("id", "in", ids).execute() as Classroom[];
  }

  public async loadByChurchId(churchId: string): Promise<Classroom[]> {
    return await getDb().selectFrom("classrooms").selectAll().where("churchId", "=", churchId).orderBy("name").execute() as Classroom[];
  }

  public async load(id: string): Promise<Classroom> {
    return await getDb().selectFrom("classrooms").selectAll().where("id", "=", id).executeTakeFirst() as Classroom;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("classrooms").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
