import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Asset } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FilesHelper } from "../helpers";

@controller("/assets")
export class AssetController extends LessonsBaseController {

  @httpGet("/resourceId/:resourceId")
  public async getForResource(@requestParam("resourceId") resourceId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.asset.loadByResourceId(au.churchId, resourceId);
    });
  }

  @httpGet("/resourceIds")
  public async getForResourceIds(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const ids = req.query.resourceIds.toString().split(',');
        return await this.repositories.asset.loadByResourceIds(au.churchId, ids);
      }
    });
  }

  @httpGet("/content/:contentType/:contentId")
  public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.asset.loadByContentTypeId(au.churchId, contentType, contentId);
    });
  }


  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.asset.load(au.churchId, id)
    });
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Asset[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Asset>[] = [];
        req.body.forEach(asset => { asset.churchId = au.churchId; promises.push(this.repositories.asset.save(asset)); });
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
        const asset = await this.repositories.asset.load(au.churchId, id);
        await FilesHelper.deleteFile(au.churchId, asset.fileId, asset.resourceId);
        await this.repositories.asset.delete(au.churchId, id);
      }
    });
  }

}
