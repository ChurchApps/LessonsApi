import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Resource } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FilesHelper } from "../helpers";

@controller("/resources")
export class ResourceController extends LessonsBaseController {

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.resource.load(au.churchId, id)
    });
  }

  @httpGet("/content/:contentType/:contentId")
  public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.resource.loadByContentTypeId(au.churchId, contentType, contentId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Resource[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Resource>[] = [];
        req.body.forEach(resource => { resource.churchId = au.churchId; promises.push(this.repositories.resource.save(resource)); });
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
        const promises: Promise<any>[] = [];
        promises.push(this.repositories.asset.loadByResourceId(au.churchId, id).then(assets =>
          assets.forEach(async a => {
            await FilesHelper.deleteFile(au.churchId, a.fileId, a.resourceId);
            await this.repositories.asset.delete(au.churchId, a.id);
          })
        ));
        promises.push(this.repositories.variant.loadByResourceId(au.churchId, id).then(variants =>
          variants.forEach(async v => {
            console.log(JSON.stringify(v));
            await FilesHelper.deleteFile(au.churchId, v.fileId, v.resourceId);
            await this.repositories.variant.delete(au.churchId, v.id);
          })
        ));

        await Promise.all(promises);
        await FilesHelper.deleteResourceFolder(au.churchId, id);
        await this.repositories.resource.delete(au.churchId, id);
      }
    });
  }

}
