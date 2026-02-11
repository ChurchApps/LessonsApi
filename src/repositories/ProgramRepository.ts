import { DB } from "@churchapps/apihelper";
import { Program } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ProgramRepository {
  public save(program: Program) {
    if (UniqueIdHelper.isMissing(program.id)) return this.create(program);
    else return this.update(program);
  }

  public async create(program: Program) {
    program.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO programs (id, churchId, providerId, name, slug, image, shortDescription, description, videoEmbedUrl, live, aboutSection, age, sort) VALUES (?, ?, (SELECT id FROM providers WHERE churchId = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [
      program.id, program.churchId, program.churchId, program.name, program.slug, program.image, program.shortDescription, program.description, program.videoEmbedUrl, program.live, program.aboutSection, program.age, program.sort
    ];
    await DB.query(sql, params);
    return program;
  }

  public async update(program: Program) {
    const sql = "UPDATE programs SET name=?, slug=?, image=?, shortDescription=?, description=?, videoEmbedUrl=?, live=?, aboutSection=?, age=?, sort=? WHERE id=? AND churchId=?";
    const params = [
      program.name, program.slug, program.image, program.shortDescription, program.description, program.videoEmbedUrl, program.live, program.aboutSection, program.age, program.sort, program.id, program.churchId
    ];
    await DB.query(sql, params);
    return program;
  }

  public loadByProviderId(churchId: string, providerId: string): Promise<Program[]> {
    return DB.query("SELECT * FROM programs WHERE churchId=? AND providerId=?", [churchId, providerId]) as Promise<Program[]>;
  }

  public loadPublicByProviderId(providerId: string): Promise<Program[]> {
    return DB.query("SELECT * FROM programs WHERE providerId=?", [providerId]) as Promise<Program[]>;
  }

  public load(churchId: string, id: string): Promise<Program> {
    return DB.queryOne("SELECT * FROM programs WHERE id=? and churchId=?", [id, churchId]) as Promise<Program>;
  }

  public loadPublicBySlug(slug: string): Promise<Program> {
    return DB.queryOne("SELECT * FROM programs WHERE slug=? and live=1", [slug]) as Promise<Program>;
  }

  public loadPublic(id: string): Promise<Program> {
    return DB.queryOne("SELECT * FROM programs WHERE id=? and live=1", [id]) as Promise<Program>;
  }

  public loadPublicAll(): Promise<Program[]> {
    return DB.query("SELECT p.* FROM programs p inner join providers pr on pr.id=p.providerId WHERE p.live=1 and pr.live=1 ORDER BY p.sort", []) as Promise<Program[]>;
  }

  public loadAll(churchId: string): Promise<Program[]> {
    return DB.query("SELECT * FROM programs WHERE churchId=?", [churchId]) as Promise<Program[]>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM programs WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}
