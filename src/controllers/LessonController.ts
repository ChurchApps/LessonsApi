import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Action, Asset, Bundle, ExternalVideo, File, Lesson, Program, Resource, Role, Section, Study, Variant, Venue } from "../models"
import { Permissions } from '../helpers/Permissions'
import { Environment, FileStorageHelper } from "../helpers"
import { ArrayHelper } from "@churchapps/apihelper";
import { LessonFeedHelper } from "../helpers/LessonFeedHelper";
import { FeedVenue } from "src/models/feed";
import { VimeoHelper } from "../helpers/VimeoHelper";

@controller("/lessons")
export class LessonController extends LessonsBaseController {


  @httpGet("/public/tree")
  public async getPublicForProgram(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {

      const providerId = req.query.providerId as string;

      const programs = (providerId)
        ? await this.repositories.program.loadPublicByProviderId(providerId)
        : await this.repositories.program.loadPublicAll();
      const studies = await this.repositories.study.loadPublicAll();
      const lessons = await this.repositories.lesson.loadPublicAll();
      const venues = await this.repositories.venue.loadPublicAll();
      const result = { programs: [] }

      programs.forEach(program => {
        const p = { id:program.id, name: program.name, description:program.shortDescription || program.description || "", image:program.image, studies: [] }
        ArrayHelper.getAll(studies, "programId", program.id).forEach(study => {
          const s = { id: study.id, name: study.name, description: study.shortDescription || study.description || "", image: study.image, lessons: [] }
          ArrayHelper.getAll(lessons, "studyId", study.id).forEach(lesson => {
            const l = { id: lesson.id, name: lesson.name + ": " + lesson.title, description:lesson.description, image:lesson.image, venues:[] }
            ArrayHelper.getAll(venues, "lessonId", lesson.id).forEach(venue => {
              l.venues.push({ id: venue.id, name: venue.name, apiUrl: "https://api.lessons.church/venues/public/feed/" + venue.id })
            });
            s.lessons.push(l)
          })
          p.studies.push(s)
        });
        result.programs.push(p);
      });

      return result;
    });
  }

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

  @httpGet("/public/slugAlt/:programSlug/:studySlug/:slug")
  public async getPublicBySlugAlt(@requestParam("programSlug") programSlug: string, @requestParam("studySlug") studySlug: string, @requestParam("slug") slug: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const program = await this.repositories.program.loadPublicBySlug(programSlug);
      const study = await this.repositories.study.loadPublicBySlug(program.id, studySlug);
      const lesson = await this.repositories.lesson.loadPublicBySlug(study.id, slug);

      const data = await LessonFeedHelper.getExpandedLessonData(program, study, lesson);

      const promises:Promise<ExternalVideo>[] = [];
      data.externalVideos.forEach(ev => {
        if (ev.downloadsExpire < new Date()) promises.push(VimeoHelper.updateVimeoLinks(ev));
      });
      if (promises.length>0) await Promise.all(promises);

      const venues:FeedVenue[] = [];
      data.venues.forEach(v => {
        venues.push(LessonFeedHelper.convertToFeed(data.lesson, data.study, data.program, v, data.bundles, data.resources, data.externalVideos, data.addOns));
      });
      const result = { venues }
      return result;
    });
  }

  @httpGet("/public/slug/:programSlug/:studySlug/:slug")
  public async getPublicBySlug(@requestParam("programSlug") programSlug: string, @requestParam("studySlug") studySlug: string, @requestParam("slug") slug: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const program = await this.repositories.program.loadPublicBySlug(programSlug);
      const study = await this.repositories.study.loadPublicBySlug(program.id, studySlug);
      const lesson = await this.repositories.lesson.loadPublicBySlug(study.id, slug);

      return await LessonFeedHelper.getExpandedLessonData(program, study, lesson);
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
      const lesson = await this.repositories.lesson.loadPublic(id);
      const study = await this.repositories.study.loadPublic(lesson.studyId);
      const program = await this.repositories.program.loadPublic(study.programId);

      return await LessonFeedHelper.getExpandedLessonData(program, study, lesson);
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
    return FileStorageHelper.store(key, "image/png", Buffer.from(base64, 'base64')).then(async () => {
      const photoUpdated = new Date();
      lesson.image = Environment.contentRoot + key + "?dt=" + photoUpdated.getTime().toString();
    });
  }



}
