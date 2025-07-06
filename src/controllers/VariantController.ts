import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Variant } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FilesHelper, ZipHelper } from "../helpers"
import { TranscodeHelper } from "../helpers/TranscodeHelper";

@controller("/variants")
export class VariantController extends LessonsBaseController {


  @httpGet("/createWebms")
  public async createWebms(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const items = await this.repositories.resource.loadNeedingWebm();
      for (const item of items) {
        try {
          await TranscodeHelper.createWebms(item.id)
        } catch (ex) {
          console.log(ex);
        }
      }
    });
  }


  /*
  @httpGet("/createWebms")
  public async createWebms(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const items = await this.repositories.resource.loadNeedingWebm();
      if (items.length > 0) {
        const item = items[0];
        await TranscodeHelper.tmpProcessItem(item.churchId, item.id, item.name, item.contentPath);
      }
      for (const item of items) {
        await TranscodeHelper.tmpProcessItem(item.churchId, item.id, item.name, item.contentPath);
      }
    });
  }
  */

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.variant.load(au.churchId, id)
    });
  }

  @httpGet("/resourceId/:resourceId")
  public async getForResource(@requestParam("resourceId") resourceId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.variant.loadByResourceId(au.churchId, resourceId);
    });
  }

  @httpGet("/content/:contentType/:contentId")
  public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.variant.loadByContentTypeId(au.churchId, contentType, contentId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Variant[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Variant>[] = [];
        req.body.forEach(variant => {
          variant.churchId = au.churchId; promises.push(
            this.repositories.variant.save(variant).then(async (v: Variant) => {
              await ZipHelper.setBundlePendingResource(v.churchId, v.resourceId);
              return v;
            })
          );
        });
        const result = await Promise.all(promises);
        req.body.forEach(async variant => {
          await TranscodeHelper.createWebms(variant.resourceId);
        });

        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const variant = await this.repositories.variant.load(au.churchId, id);
        if (variant.fileId) await FilesHelper.deleteFile(au.churchId, variant.fileId, variant.resourceId);
        await this.repositories.variant.delete(au.churchId, id);
        await ZipHelper.setBundlePendingResource(variant.churchId, variant.resourceId);
        return this.json({});
      }
    });
  }


}
