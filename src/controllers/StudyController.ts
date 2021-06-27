import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Study } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FileHelper } from "../helpers"

@controller("/studies")
export class StudyController extends LessonsBaseController {

  @httpGet("/public/program/:programId")
  public async getPublicForProgram(@requestParam("programId") programId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.study.loadPublicByProgramId(programId);
    });
  }

  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.study.loadPublic(id)
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.study.load(au.churchId, id)
    });
  }



  @httpGet("/program/:programId")
  public async getForProgram(@requestParam("programId") programId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.study.loadByProgramId(au.churchId, programId);
    });
  }

  @httpGet("/")
  public async getForAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.study.loadAll(au.churchId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Study[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Study>[] = [];
        req.body.forEach(study => {
          study.churchId = au.churchId;
          const s = study;
          const saveFunction = async () => {
            if (s.image && s.image.startsWith("data:image/png;base64,")) await this.saveImage(s);
            return await this.repositories.study.save(study);
          }
          promises.push(saveFunction());
        });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  private async saveImage(study: Study) {
    const base64 = study.image.split(',')[1];
    const key = "/studies/" + study.id + ".png";
    return FileHelper.store(key, "image/png", Buffer.from(base64, 'base64')).then(async () => {
      const photoUpdated = new Date();
      study.image = process.env.CONTENT_ROOT + key + "?dt=" + photoUpdated.getTime().toString();
    });
  }


  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else await this.repositories.study.delete(au.churchId, id);
    });
  }

}
