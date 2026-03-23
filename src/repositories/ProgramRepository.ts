import { sql } from "kysely";
import { getDb } from "../db";
import { Program } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProgramRepository {
  public save(program: Program) {
    if (UniqueIdHelper.isMissing(program.id)) return this.create(program);
    else return this.update(program);
  }

  public async create(program: Program) {
    program.id = UniqueIdHelper.shortId();
    await getDb().insertInto("programs").values({
      id: program.id,
      churchId: program.churchId,
      providerId: sql`(SELECT id FROM providers WHERE churchId = ${program.churchId})`,
      name: program.name,
      slug: program.slug,
      image: program.image,
      shortDescription: program.shortDescription,
      description: program.description,
      videoEmbedUrl: program.videoEmbedUrl,
      live: program.live,
      aboutSection: program.aboutSection,
      age: program.age,
      sort: program.sort
    }).execute();
    return program;
  }

  public async update(program: Program) {
    await getDb().updateTable("programs").set({
      name: program.name,
      slug: program.slug,
      image: program.image,
      shortDescription: program.shortDescription,
      description: program.description,
      videoEmbedUrl: program.videoEmbedUrl,
      live: program.live,
      aboutSection: program.aboutSection,
      age: program.age,
      sort: program.sort
    }).where("id", "=", program.id).where("churchId", "=", program.churchId).execute();
    return program;
  }

  public async loadByProviderId(churchId: string, providerId: string): Promise<Program[]> {
    return await getDb().selectFrom("programs").selectAll().where("churchId", "=", churchId).where("providerId", "=", providerId).execute() as Program[];
  }

  public async loadPublicByProviderId(providerId: string): Promise<Program[]> {
    return await getDb().selectFrom("programs").selectAll().where("providerId", "=", providerId).execute() as Program[];
  }

  public async load(churchId: string, id: string): Promise<Program> {
    return await getDb().selectFrom("programs").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Program;
  }

  public async loadPublicBySlug(slug: string): Promise<Program> {
    return await getDb().selectFrom("programs").selectAll().where("slug", "=", slug).where("live", "=", true).executeTakeFirst() as Program;
  }

  public async loadPublic(id: string): Promise<Program> {
    return await getDb().selectFrom("programs").selectAll().where("id", "=", id).where("live", "=", true).executeTakeFirst() as Program;
  }

  public async loadPublicAll(): Promise<Program[]> {
    return await getDb().selectFrom("programs as p")
      .innerJoin("providers as pr", "pr.id", "p.providerId")
      .selectAll("p")
      .where("p.live", "=", true)
      .where("pr.live", "=", true)
      .orderBy("p.sort")
      .execute() as Program[];
  }

  public async loadAll(churchId: string): Promise<Program[]> {
    return await getDb().selectFrom("programs").selectAll().where("churchId", "=", churchId).execute() as Program[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("programs").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}
