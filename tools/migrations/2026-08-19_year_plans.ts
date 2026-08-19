import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("yearPlans")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("name", sql`varchar(255)`)
    .addColumn("slug", sql`varchar(45)`)
    .addColumn("programId", sql`char(11)`)
    .addColumn("venuePreference", sql`varchar(255)`)
    .addColumn("sort", "integer")
    .addColumn("live", sql`bit(1)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  await db.schema.createIndex("idx_yearPlans_church_live").on("yearPlans").columns(["churchId", "live"]).execute();

  await db.schema
    .createTable("yearPlanWeeks")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("yearPlanId", sql`char(11)`)
    .addColumn("week", "integer")
    .addColumn("lessonId", sql`varchar(255)`)
    .addColumn("externalProviderId", sql`char(11)`)
    .addColumn("programId", sql`varchar(255)`)
    .addColumn("studyId", sql`varchar(255)`)
    .addColumn("venueId", sql`varchar(255)`)
    .addColumn("studyName", sql`varchar(255)`)
    .addColumn("lessonName", sql`varchar(255)`)
    .addColumn("venueName", sql`varchar(255)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  await db.schema.createIndex("idx_yearPlanWeeks_plan_week").unique().on("yearPlanWeeks").columns(["yearPlanId", "week"]).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("yearPlanWeeks").ifExists().execute();
  await db.schema.dropTable("yearPlans").ifExists().execute();
}
