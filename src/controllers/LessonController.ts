import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Lesson } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/lessons")
export class LessonController extends LessonsBaseController {

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.lesson.load(id)
    });
  }

  @httpGet("/study/:studyId")
  public async getAll(@requestParam("studyId") studyId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.lesson.loadByStudyId(studyId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Lesson[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      // if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      // else {
      const promises: Promise<Lesson>[] = [];
      req.body.forEach(lesson => { lesson.churchId = au.churchId; promises.push(this.repositories.lesson.save(lesson)); });
      const result = await Promise.all(promises);
      return result;
      // }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else await this.repositories.lesson.delete(au.churchId, id);
    });
  }

}
