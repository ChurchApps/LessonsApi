import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Schedule } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/schedules")
export class ScheduleController extends LessonsBaseController {



  @httpGet("/classroom/:classroomId")
  public async getAll(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.schedule.loadByChurchIdClassroomId(au.churchId, classroomId)
    });
  }

  @httpGet("/public/classroom/:classroomId")
  public async getPublicClassroom(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.schedule.loadByClassroomId(classroomId)
    });
  }


  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.schedule.load(id)
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Schedule[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Schedule>[] = [];
        req.body.forEach(schedule => { schedule.churchId = au.churchId; promises.push(this.repositories.schedule.save(schedule)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else await this.repositories.schedule.delete(au.churchId, id);
    });
  }

}
