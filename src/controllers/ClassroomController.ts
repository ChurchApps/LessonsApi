import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Classroom } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/classrooms")
export class ClassroomController extends LessonsBaseController {

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

}
