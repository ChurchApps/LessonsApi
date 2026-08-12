import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { AuthenticatedUser } from "@churchapps/apihelper";
import { Environment } from "./Environment";
import { Repositories } from "../repositories";

export class MauticHelper {
  private static lambdaClient: LambdaClient;

  // On Lambda, async-invoke the mauticSync function so the download response returns immediately
  // (a detached promise would freeze with the container). Elsewhere (dev/self-host) the process
  // stays alive, so plain fire-and-forget is safe.
  public static async queueLessonDownload(churchId: string, lessonId?: string, au?: AuthenticatedUser) {
    const fnName = process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (!fnName) {
      this.logLessonDownload(churchId, lessonId, au).catch(() => {});
      return;
    }
    try {
      if (!this.lambdaClient) this.lambdaClient = new LambdaClient({});
      const payload = { churchId, lessonId, au: au ? { email: au.email, firstName: au.firstName, lastName: au.lastName } : undefined };
      await this.lambdaClient.send(new InvokeCommand({
        FunctionName: fnName.replace(/-api$/, "-mauticSync"),
        InvocationType: "Event",
        Payload: JSON.stringify(payload)
      }));
    } catch {
      // Never block a download because the enqueue failed
    }
  }

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
      if (!slugs || !au?.email) return;
      const contact = await this.upsertContact(au, slugs);
      if (!contact?.id) return;
      await this.request(`/api/companies/${companyId}/contact/${contact.id}/add`, "POST");
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
    return { tag: program.slug, field: this.fieldAlias(program.slug) };
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

  private static async request(path: string, method = "GET", body?: any): Promise<any> {
    const headers: any = { Authorization: "Basic " + Buffer.from(`${Environment.mauticUser}:${Environment.mauticPassword}`).toString("base64") };
    if (body) headers["Content-Type"] = "application/json";
    // Off the request path now, but still bound each call so a hung Mautic can't pin the sync Lambda
    const resp = await fetch(Environment.mauticUrl + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(4000) });
    return resp.json().catch(() => null);
  }
}
