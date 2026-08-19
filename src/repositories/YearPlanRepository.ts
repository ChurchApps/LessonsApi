import { getDb } from "../db";
import { YearPlan } from "../models";
import { UniqueIdHelper } from "../helpers";

export class YearPlanRepository {
  public save(plan: YearPlan) {
    if (UniqueIdHelper.isMissing(plan.id)) return this.create(plan);
    else return this.update(plan);
  }

  public async create(plan: YearPlan) {
    plan.id = UniqueIdHelper.shortId();
    await getDb().insertInto("yearPlans").values({
      id: plan.id,
      churchId: plan.churchId,
      name: plan.name,
      slug: plan.slug,
      programId: plan.programId,
      venuePreference: plan.venuePreference,
      sort: plan.sort,
      live: plan.live
    }).execute();
    return plan;
  }

  public async update(plan: YearPlan) {
    await getDb().updateTable("yearPlans").set({
      name: plan.name,
      slug: plan.slug,
      programId: plan.programId,
      venuePreference: plan.venuePreference,
      sort: plan.sort,
      live: plan.live
    }).where("id", "=", plan.id).where("churchId", "=", plan.churchId).execute();
    return plan;
  }

  public async loadAll(churchId: string): Promise<YearPlan[]> {
    return await getDb().selectFrom("yearPlans").selectAll().where("churchId", "=", churchId).orderBy("sort").orderBy("name").execute() as YearPlan[];
  }

  public async load(churchId: string, id: string): Promise<YearPlan> {
    return await getDb().selectFrom("yearPlans").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as YearPlan;
  }

  public async loadPublic(id: string): Promise<YearPlan> {
    return await getDb().selectFrom("yearPlans").selectAll().where("id", "=", id).where("live", "=", true).executeTakeFirst() as YearPlan;
  }

  public async loadPublicAll(): Promise<YearPlan[]> {
    return await getDb().selectFrom("yearPlans").selectAll().where("live", "=", true).orderBy("sort").orderBy("name").execute() as YearPlan[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    await getDb().deleteFrom("yearPlanWeeks").where("yearPlanId", "=", id).where("churchId", "=", churchId).execute();
    return await getDb().deleteFrom("yearPlans").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
