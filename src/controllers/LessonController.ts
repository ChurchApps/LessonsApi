import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Action, Asset, Bundle, ExternalVideo, File, Lesson, Program, Resource, Role, Section, Study, Variant, Venue } from "../models"
import { Permissions } from '../helpers/Permissions'
import { Environment, FileHelper } from "../helpers"
import { ArrayHelper } from "../apiBase";

@controller("/lessons")
export class LessonController extends LessonsBaseController {


  @httpGet("/public/study/:studyId")
  public async getPublicForStudy(@requestParam("studyId") studyId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.lesson.loadPublicByStudyId(studyId);
    });
  }

  @httpGet("/public/studies")
  public async getPublicForStudies(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      if (!req.query.ids) return []
      const ids = req.query.ids.toString().split(',')
      return this.repositories.lesson.loadPublicByStudyIds(ids);
    })
  }

  @httpGet("/study/:studyId")
  public async getForStudy(@requestParam("studyId") studyId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.lesson.loadByStudyId(au.churchId, studyId);
    });
  }


  @httpGet("/public/slug/:programSlug/:studySlug/:slug")
  public async getPublicBySlug(@requestParam("programSlug") programSlug: string, @requestParam("studySlug") studySlug: string, @requestParam("slug") slug: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const program = await this.repositories.program.loadPublicBySlug(programSlug);
      const study = await this.repositories.study.loadPublicBySlug(program.id, studySlug);
      const lesson = await this.repositories.lesson.loadPublicBySlug(study.id, slug);

      let venues: Venue[] = null;
      let bundles: Bundle[] = null;
      let resources: Resource[] = null;
      let externalVideos: ExternalVideo[] = null;
      const promises: Promise<any>[] = [];
      promises.push(this.getVenues(lesson.id).then(v => venues = v));
      promises.push(this.getBundles(lesson.id).then(b => bundles = b));
      promises.push(this.getResources(lesson.id).then(r => resources = r));
      promises.push(this.repositories.externalVideo.loadPublicForLesson(lesson.id).then(ev => externalVideos = ev));;
      await Promise.all(promises);

      const result = { lesson, study, program, venues, bundles, resources, externalVideos }
      return result;
    });
  }

  @httpGet("/public/ids")
  public async getPublicByIds(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const ids = req.query.ids.toString().split(",");
      return await this.repositories.lesson.loadPublicByIds(ids);
    });
  }

  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.lesson.loadPublic(id)
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.lesson.load(au.churchId, id);
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.lesson.loadAll(au.churchId);
    });
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Lesson[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Lesson>[] = [];
        req.body.forEach(lesson => {
          lesson.churchId = au.churchId;
          const l = lesson;
          const saveFunction = async () => {
            if (l.image && l.image.startsWith("data:image/")) {
              if (!l.id) await this.repositories.lesson.save(l);  // save first to generate an id
              await this.saveImage(l);
            }
            return await this.repositories.lesson.save(l);
          }
          promises.push(saveFunction());
        });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const resources = await this.repositories.resource.loadByContentTypeId(au.churchId, "lesson", id);
        if (resources.length > 0) return this.json({}, 401);
        else return await this.repositories.lesson.delete(au.churchId, id);
      }
    });
  }

  private async saveImage(lesson: Lesson) {
    const base64 = lesson.image.split(',')[1];
    const key = "/lessons/" + lesson.id + ".png";
    return FileHelper.store(key, "image/png", Buffer.from(base64, 'base64')).then(async () => {
      const photoUpdated = new Date();
      lesson.image = Environment.contentRoot + key + "?dt=" + photoUpdated.getTime().toString();
    });
  }

  private async getVenues(lessonId: string) {
    const venues = await this.repositories.venue.loadPublicByLessonId(lessonId);
    const sections = await this.repositories.section.loadByLessonId(lessonId);
    const roles = await this.repositories.role.loadByLessonId(lessonId);
    const actions = await this.repositories.action.loadByLessonId(lessonId);
    venues.forEach(v => this.appendSections(v, sections, roles, actions));
    return venues;
  }

  public async appendSections(venue: Venue, allSections: Section[], allRoles: Role[], allActions: Action[]) {
    venue.sections = ArrayHelper.getAll(allSections, "venueId", venue.id);
    venue.sections.forEach(s => {
      s.roles = ArrayHelper.getAll(allRoles, "sectionId", s.id);
      s.roles.forEach(r => {
        r.actions = ArrayHelper.getAll(allActions, "roleId", r.id);
      });
    });
  }

  private async getBundles(lessonId: string) {
    const bundles: Bundle[] = await this.repositories.bundle.loadPublicForLesson(lessonId);
    if (bundles.length === 0) return bundles;
    const fileIds = ArrayHelper.getIds(bundles, "fileId");
    for (let i = fileIds.length; i >= 0; i--) if (!fileIds[i]) fileIds.splice(i, 1);
    if (fileIds.length > 0) {
      const files = await this.repositories.file.loadByIds(bundles[0].churchId, fileIds);
      bundles.forEach(b => { b.file = ArrayHelper.getOne(files, "id", b.fileId) });
    }
    return bundles;
  }

  private async getResources(lessonId: string) {
    const resources: Resource[] = await this.repositories.resource.loadPublicForLesson(lessonId);
    if (resources.length === 0) return resources;

    const resourceIds = ArrayHelper.getIds(resources, "id");
    const variants = await this.repositories.variant.loadByResourceIds(resources[0].churchId, resourceIds);
    const assets = await this.repositories.asset.loadByResourceIds(resources[0].churchId, resourceIds);

    const fileIds = ArrayHelper.getIds(variants, "fileId").concat(ArrayHelper.getIds(assets, "fileId"));
    const files = await this.repositories.file.loadByIds(resources[0].churchId, fileIds);

    resources.forEach(r => this.appendVariantsAssets(r, variants, assets, files));
    return resources;
  }

  private async appendVariantsAssets(resource: Resource, allVariants: Variant[], allAssets: Asset[], allFiles: File[]) {
    resource.variants = ArrayHelper.getAll(allVariants, "resourceId", resource.id);
    resource.assets = ArrayHelper.getAll(allAssets, "resourceId", resource.id);

    resource.variants.forEach(v => v.file = ArrayHelper.getOne(allFiles, "id", v.fileId));
    resource.assets.forEach(a => a.file = ArrayHelper.getOne(allFiles, "id", a.fileId));

  }

}
