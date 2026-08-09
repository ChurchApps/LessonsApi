import { AuthenticatedUser } from "@churchapps/apihelper";
import { Environment } from "./Environment";
import { Repositories } from "../repositories";

export class MauticHelper {
  // Logs a lesson download to Mautic. With an authenticated user, data lands on the person's contact;
  // anonymous device downloads (FreePlay/classroom players) land on the church's company record instead.
  public static async logLessonDownload(churchId: string, lessonId?: string, au?: AuthenticatedUser) {
    if (!Environment.mauticUrl || !Environment.mauticUser || !Environment.mauticPassword || !churchId) return;
    try {
      const repositories = Repositories.getCurrent();
      const countRow = await repositories.download.getDownloadCount(churchId);
      if (!countRow || !countRow.downloadCount) return;
      // The company church-id field alias written by the membership Api's MauticHelper.register() is "companychurchid"
      const data = await this.request(`/api/companies?search=companychurchid:${churchId}&limit=1`);
      const companies = Object.values(data?.companies || {}) as any[];
      if (!companies.length) return;
      const companyId = companies[0].id;
      const slugs = lessonId ? await this.loadSlugs(lessonId) : null;
      const companyFields: any = {
        lessons_last_download: new Date(countRow.lastDownload).toISOString(),
        lessons_download_count: countRow.downloadCount
      };
      // Per-program stamps only stick if marketing has created the field in Mautic; unknown aliases are silently ignored
      if (slugs) companyFields[slugs.field] = new Date().toISOString();
      await this.request(`/api/companies/${companyId}/edit`, "PATCH", companyFields);
      if (!slugs) return;
      if (au?.email) {
        const contact = await this.upsertContact(au, slugs);
        if (!contact?.id) return;
        await this.request(`/api/companies/${companyId}/contact/${contact.id}/add`, "POST");
        await this.upsertLessonDownloadItem("contact", contact.id, slugs.path);
      } else {
        await this.upsertLessonDownloadItem("company", companyId, slugs.path);
      }
    } catch {
      // Never block a download because Mautic is unavailable
    }
  }

  // Mautic's lead_fields.alias is varchar(25) and over-length writes are silently dropped
  // ponytail: plain truncation — two programs sharing the first 11 chars would collide;
  // add a mauticLastDownloadField column on programs if that ever happens.
  public static fieldAlias(slug: string) {
    const suffix = "_last_download";
    return slug.replace(/-/g, "_").slice(0, 25 - suffix.length) + suffix;
  }

  private static async loadSlugs(lessonId: string) {
    // Curriculum belongs to the provider's church, so use the church-agnostic public loaders
    const repositories = Repositories.getCurrent();
    const lesson = await repositories.lesson.loadPublic(lessonId);
    const study = lesson?.studyId ? await repositories.study.loadPublic(lesson.studyId) : null;
    const program = study?.programId ? await repositories.program.loadPublic(study.programId) : null;
    if (!program?.slug) return null;
    return {
      tag: program.slug,
      field: this.fieldAlias(program.slug),
      path: `/${program.slug}/${study.slug}/${lesson.slug}`
    };
  }

  private static async upsertContact(au: AuthenticatedUser, slugs: { tag: string; field: string }) {
    // POST /contacts/new dedupes on email, so this is an upsert; tags are additive
    const body = {
      email: au.email,
      firstname: au.firstName,
      lastname: au.lastName,
      tags: [slugs.tag],
      [slugs.field]: new Date().toISOString()
    };
    const json = await this.request("/api/contacts/new", "POST", body);
    return json?.contact;
  }

  // Per-lesson last-download log via the Mautic Custom Objects plugin ("lesson_download" object, "last_download" date field).
  // The plugin isn't installed yet — these calls 404 harmlessly until it is; verify routes against the live instance then.
  private static async upsertLessonDownloadItem(entityType: "contact" | "company", entityId: string, path: string) {
    const base = "/api/custom/objects/lesson_download/items";
    const today = new Date().toISOString().split("T")[0];
    const search = await this.request(`${base}?search=${encodeURIComponent(path)}&filterEntityType=${entityType}&filterEntityId=${entityId}`);
    const items = Object.values(search?.data || {}) as any[];
    const existing = items.find(i => i.name === path);
    if (existing) {
      await this.request(`${base}/${existing.id}/edit`, "PATCH", { fields: { last_download: today } });
    } else {
      const json = await this.request(`${base}/new`, "POST", { name: path, fields: { last_download: today } });
      const itemId = json?.data?.id || json?.item?.id || json?.id;
      if (itemId) await this.request(`${base}/${itemId}/link/${entityType}/${entityId}`, "POST");
    }
  }

  private static async request(path: string, method = "GET", body?: any): Promise<any> {
    const headers: any = { Authorization: "Basic " + Buffer.from(`${Environment.mauticUser}:${Environment.mauticPassword}`).toString("base64") };
    if (body) headers["Content-Type"] = "application/json";
    const resp = await fetch(Environment.mauticUrl + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return resp.json().catch(() => null);
  }
}
