import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Program } from "../models"
import { Permissions } from '../helpers/Permissions'
import { Environment, FileStorageHelper } from "../helpers"

@controller("/programs")
export class ProgramController extends LessonsBaseController {



  @httpGet("/public/slug/:slug")
  public async getPublicBySlug(@requestParam("slug") slug: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.program.loadPublicBySlug(slug)
    });
  }

  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.program.loadPublic(id)
    });
  }


  @httpGet("/public")
  public async getPublicAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.program.loadPublicAll();
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.program.load(au.churchId, id)
    });
  }

  @httpGet("/provider/:providerId")
  public async getForProvider(@requestParam("providerId") providerId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.program.loadByProviderId(au.churchId, providerId);
    });
  }


  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.program.loadAll(au.churchId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Program[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Program>[] = [];
        // req.body.forEach(program => { program.churchId = au.churchId; promises.push(this.repositories.program.save(program)); });
        req.body.forEach(program => {
          program.churchId = au.churchId;
          const p = program;
          const saveFunction = async () => {
            if (p.image && p.image.startsWith("data:image/")) await this.saveImage(p);
            return await this.repositories.program.save(p);
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
        const resources = await this.repositories.resource.loadByContentTypeId(au.churchId, "program", id);
        const studies = await this.repositories.study.loadByProgramId(au.churchId, id);
        if (resources.length > 0 || studies.length > 0) return this.json({}, 401);
        else return await this.repositories.program.delete(au.churchId, id);
      }
    });
  }

  private async saveImage(program: Program) {
    const base64 = program.image.split(',')[1];
    const key = "/programs/" + program.id + ".png";
    return FileStorageHelper.store(key, "image/png", Buffer.from(base64, 'base64')).then(async () => {
      const photoUpdated = new Date();
      program.image = Environment.contentRoot + key + "?dt=" + photoUpdated.getTime().toString();
    });
  }

}
