import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Lesson } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FileHelper } from "../helpers"

@controller("/lessons")
export class LessonController extends LessonsBaseController {


  @httpGet("/public/study/:studyId")
  public async getPublicForStudy(@requestParam("studyId") studyId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.lesson.loadPublicByStudyId(studyId);
    });
  }

  @httpGet("/study/:studyId")
  public async getForStudy(@requestParam("studyId") studyId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.lesson.loadByStudyId(au.churchId, studyId);
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
            if (l.image && l.image.startsWith("data:image/png;base64,")) await this.saveImage(l);
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
      lesson.image = process.env.CONTENT_ROOT + key + "?dt=" + photoUpdated.getTime().toString();
    });
  }

}
