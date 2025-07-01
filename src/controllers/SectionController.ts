import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Section, Venue, Action } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ArrayHelper } from "@churchapps/apihelper";

@controller("/sections")
export class SectionController extends LessonsBaseController {

  @httpGet("/venue/:venueId")
  public async getForVenue(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.section.loadByVenueId(au.churchId, venueId);
    });
  }

  @httpGet("/public/venue/:venueId")
  public async getPublicForVenue(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.section.loadByVenueIdPublic(venueId);
    });
  }

  @httpGet("/public/lesson/:lessonId")
  public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.section.loadByLessonId(lessonId);
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.section.load(id)
    });
  }

  @httpGet("/copy/:sourceSectionId/:destVenueId")
  public async copy(@requestParam("sourceSectionId") sourceSectionId: string, @requestParam("destVenueId") destVenueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const sourceSection: Section = await this.repositories.section.load(sourceSectionId);
      const destVenue: Venue = await this.repositories.venue.load(au.churchId, destVenueId);

      if (destVenue.churchId !== au.churchId) return this.denyAccess(["Access denied"]);
      else {

        let newSection = { ...sourceSection };
        newSection.venueId = destVenueId;
        newSection.id = null;
        newSection.lessonId = destVenue.lessonId;
        newSection = await this.repositories.section.save(newSection)

        let sourceRoles = await this.repositories.role.loadByLessonId(sourceSection.lessonId)
        const allSourceActions = await this.repositories.action.loadByLessonId(sourceSection.lessonId)
        sourceRoles = ArrayHelper.getAll(sourceRoles, "sectionId", sourceSection.id);
        for (const sourceRole of sourceRoles) {
          let newRole = { ...sourceRole }
          newRole.id = null;
          newRole.sectionId = newSection.id;
          newRole.lessonId = newSection.lessonId;
          newRole = await this.repositories.role.save(newRole);
          const sourceActions: Action[] = ArrayHelper.getAll(allSourceActions, "roleId", sourceRole.id);
          for (const sourceAction of sourceActions) {
            const newAction = { ...sourceAction };
            newAction.id = null;
            newAction.lessonId = newRole.lessonId;
            newAction.roleId = newRole.id;
            await this.repositories.action.save(newAction);
          }
        }
        return [];
      }
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Section[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Section>[] = [];
        req.body.forEach(section => { section.churchId = au.churchId; promises.push(this.repositories.section.save(section)); });
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
        await this.repositories.section.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

}
