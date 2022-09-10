import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Venue, Section, Action, Role } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ArrayHelper } from "../apiBase";

@controller("/venues")
export class VenueController extends LessonsBaseController {

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.venue.load(au.churchId, id);
    });
  }

  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venue = await this.repositories.venue.loadPublic(id);
      const sections = await this.repositories.section.loadByLessonId(venue.lessonId);
      const roles = await this.repositories.role.loadByLessonId(venue.lessonId);
      const actions = await this.repositories.action.loadByLessonId(venue.lessonId);
      this.appendSections(venue, sections, roles, actions);
      return venue;
    });
  }

  /*Unused?*/
  @httpGet("/public/lesson/:lessonId")
  public async getPublicForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venues = await this.repositories.venue.loadPublicByLessonId(lessonId);
      const sections = await this.repositories.section.loadByLessonId(lessonId);
      const roles = await this.repositories.role.loadByLessonId(lessonId);
      const actions = await this.repositories.action.loadByLessonId(lessonId);
      venues.forEach(v => this.appendSections(v, sections, roles, actions));
      return venues;

    });
  }

  @httpGet("/lesson/:lessonId")
  public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.venue.loadByLessonId(au.churchId, lessonId);
    });
  }


  @httpGet("/names/classroom/:classroomId")
  public async getNameByClassroom(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.venue.loadNamesForClassroom(au.churchId, classroomId)
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.venue.loadAll(au.churchId);
    });
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Venue[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Venue>[] = [];
        req.body.forEach(venue => { venue.churchId = au.churchId; promises.push(this.repositories.venue.save(venue)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else await this.repositories.venue.delete(au.churchId, id);
    });
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


}
