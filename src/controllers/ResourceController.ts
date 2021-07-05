import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Resource, Asset, Variant, File } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FilesHelper } from "../helpers";
import { ArrayHelper } from "../apiBase";

@controller("/resources")
export class ResourceController extends LessonsBaseController {

  @httpGet("/public/lesson/:lessonId")
  public async getPublicForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const resources: Resource[] = await this.repositories.resource.loadPublicForLesson(lessonId);
      if (resources.length === 0) return resources;

      const resourceIds = ArrayHelper.getIds(resources, "id");
      const variants = await this.repositories.variant.loadByResourceIds(resources[0].churchId, resourceIds);
      const assets = await this.repositories.asset.loadByResourceIds(resources[0].churchId, resourceIds);

      const fileIds = ArrayHelper.getIds(variants, "fileId").concat(ArrayHelper.getIds(assets, "fileId"));
      const files = await this.repositories.file.loadByIds(resources[0].churchId, fileIds);

      console.log(files.length);

      resources.forEach(r => this.appendVariantsAssets(r, variants, assets, files));
      return resources;
    });
  }

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

  private async appendVariantsAssets(resource: Resource, allVariants: Variant[], allAssets: Asset[], allFiles: File[]) {
    resource.variants = ArrayHelper.getAll(allVariants, "resourceId", resource.id);
    resource.assets = ArrayHelper.getAll(allAssets, "resourceId", resource.id);

    resource.variants.forEach(v => v.file = ArrayHelper.getOne(allFiles, "id", v.fileId));
    resource.assets.forEach(a => a.file = ArrayHelper.getOne(allFiles, "id", a.fileId));

  }

}
