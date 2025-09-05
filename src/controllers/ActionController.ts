import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Action } from "../models";
import { Permissions } from "../helpers/Permissions";

@controller("/actions")
export class ActionController extends LessonsBaseController {
  @httpGet("/public/lesson/:lessonId")
  public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.action.loadByLessonId(lessonId);
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.action.load(id);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Action[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Action>[] = [];
        req.body.forEach(action => {
          action.churchId = au.churchId;
          promises.push(this.repositories.action.save(action));
        });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        await this.repositories.action.delete(au.churchId, id);
        return this.json({});
      }
    });
  }
}
