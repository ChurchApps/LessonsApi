import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Classroom, Venue, Action } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ArrayHelper } from "../apiBase";

@controller("/classrooms")
export class ClassroomController extends LessonsBaseController {

  @httpGet("/playlist/:classroomId")
  public async getPlaylist(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const actions = await this.loadPlaylistActions(classroomId, req.query.venueName.toString())
      const files = await this.loadPlaylistFiles(actions);

      const result: any[] = [];
      actions.forEach(a => {
        const file = (a.assetId) ? ArrayHelper.getOne(files, "assetId", a.assetId) : ArrayHelper.getOne(files, "resourceId", a.resourceId);
        if (file) {
          result.push({ name: file.resourceName, url: process.env.CONTENT_ROOT + file.contentPath })
        }
      })
      return result;
    });
  }


  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.classroom.load(id)
    });
  }

  @httpGet("/")
  public async getAll(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.classroom.loadByChurchId(au.churchId)
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Classroom[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Classroom>[] = [];
        req.body.forEach(classroom => { classroom.churchId = au.churchId; promises.push(this.repositories.classroom.save(classroom)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else await this.repositories.classroom.delete(au.churchId, id);
    });
  }

  private async loadPlaylistActions(classroomId: string, venueName: string): Promise<Action[]> {
    const currentSchedule = await this.repositories.schedule.loadCurrent(classroomId);
    const venues = await this.repositories.venue.loadByLessonId(currentSchedule.churchId, currentSchedule.lessonId);
    const venue: Venue = ArrayHelper.getOne(venues, "name", venueName);
    const actions = await this.repositories.action.loadPlaylistActions(venue.id)
    return actions;
  }

  private async loadPlaylistFiles(actions: Action[]) {
    const assetIds: string[] = [];
    const resourceIds: string[] = [];
    actions.forEach(a => {
      if (a.assetId) assetIds.push(a.assetId);
      else resourceIds.push(a.resourceId);
    });

    const assetFiles = (assetIds.length === 0) ? [] : await this.repositories.asset.loadPlaylist(assetIds);
    const variantFiles = (resourceIds.length === 0) ? [] : await this.repositories.variant.loadPlaylist(resourceIds);

    return assetFiles.concat(variantFiles);

  }

}
