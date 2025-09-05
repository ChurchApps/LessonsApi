import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Resource } from "../models";
import { Permissions } from "../helpers/Permissions";
import { Environment, FilesHelper, ZipHelper } from "../helpers";
import { ArrayHelper, FileStorageHelper } from "@churchapps/apihelper";

@controller("/resources")
export class ResourceController extends LessonsBaseController {
  /*
  @httpGet("/public/lesson/:lessonId")
  public async getPublicForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const resources: Resource[] = await this.repositories.resource.loadPublicForLesson(lessonId);
      if (resources.length === 0) return resources;

      const resourceIds = ArrayHelper.getIds(resources, "id");
      const variants = await this.repositories.variant.loadByResourceIds(resources[0].churchId, resourceIds);
      const assets = await this.repositories.asset.loadByResourceIds(resources[0].churchId, resourceIds);

      const fileIds = ArrayHelper.getIds(variants, "fileId").concat(ArrayHelper.getIds(assets, "fileId"));
      const files = await this.repositories.file.loadByIds(resources[0].churchId, fileIds);

      resources.forEach(r => this.appendVariantsAssets(r, variants, assets, files));
      return resources;
    });
  }*/

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.resource.load(au.churchId, id);
    });
  }

  @httpGet("/content/:contentType/:contentId")
  public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.resource.loadByContentTypeId(au.churchId, contentType, contentId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Resource[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Resource>[] = [];
        for (const resource of req.body) {
          resource.churchId = au.churchId;
          if (resource.id) await this.checkMoveFiles(resource);
          promises.push(
            this.repositories.resource.save(resource).then(async r => {
              await ZipHelper.setBundlePending(r.churchId, r.bundleId);
              if (r.bundleId !== resource.bundleId) await ZipHelper.setBundlePending(resource.churchId, resource.bundleId); // update the old bundle too
              return r;
            })
          );
        }
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
        const promises: Promise<any>[] = [];
        promises.push(
          this.repositories.asset.loadByResourceId(au.churchId, id).then(assets =>
            assets.forEach(async a => {
              await FilesHelper.deleteFile(au.churchId, a.fileId, a.resourceId);
              await this.repositories.asset.delete(au.churchId, a.id);
            })
          )
        );
        promises.push(
          this.repositories.variant.loadByResourceId(au.churchId, id).then(variants =>
            variants.forEach(async v => {
              await FilesHelper.deleteFile(au.churchId, v.fileId, v.resourceId);
              await this.repositories.variant.delete(au.churchId, v.id);
            })
          )
        );

        await Promise.all(promises);
        await FilesHelper.deleteResourceFolder(au.churchId, id);
        const r = await this.repositories.resource.load(au.churchId, id);
        await this.repositories.resource.delete(au.churchId, id);
        await ZipHelper.setBundlePending(au.churchId, r.bundleId);

        return this.json({});
      }
    });
  }

  /*
  private async appendVariantsAssets(resource: Resource, allVariants: Variant[], allAssets: Asset[], allFiles: File[]) {
    resource.variants = ArrayHelper.getAll(allVariants, "resourceId", resource.id);
    resource.assets = ArrayHelper.getAll(allAssets, "resourceId", resource.id);

    resource.variants.forEach(v => v.file = ArrayHelper.getOne(allFiles, "id", v.fileId));
    resource.assets.forEach(a => a.file = ArrayHelper.getOne(allFiles, "id", a.fileId));

  }*/

  private async checkMoveFiles(resource: Resource) {
    const existingResource = await this.repositories.resource.load(resource.churchId, resource.id);
    if (existingResource.bundleId !== resource.bundleId) {
      const oldBundle = await this.repositories.bundle.load(resource.churchId, existingResource.bundleId);
      const newBundle = await this.repositories.bundle.load(resource.churchId, resource.bundleId);
      if (oldBundle.contentType !== newBundle.contentType || oldBundle.contentId !== newBundle.contentId) {
        await this.moveFiles(resource.churchId, resource.id, oldBundle.contentType, oldBundle.contentId, newBundle.contentType, newBundle.contentId);
      }
    }
  }

  private async moveFiles(churchId: string, resourceId: string, oldContentType: string, oldContentId: string, newContentType: string, newContentId: string) {
    const assets = await this.repositories.asset.loadByResourceId(churchId, resourceId);
    const variants = await this.repositories.variant.loadByResourceId(churchId, resourceId);
    let fileIds = ArrayHelper.getIds(assets, "fileId");
    fileIds = fileIds.concat(ArrayHelper.getIds(variants, "fileId"));
    if (fileIds.length > 0) {
      const files = await this.repositories.file.loadByIds(churchId, fileIds);
      for (const file of files) {
        const oldS3 = "files/" + oldContentType + "/" + oldContentId + "/" + resourceId + "/" + file.fileName;
        const newS3 = "files/" + newContentType + "/" + newContentId + "/" + resourceId + "/" + file.fileName;
        await FileStorageHelper.move(oldS3, newS3);
        file.dateModified = new Date();
        file.contentPath = Environment.contentRoot + "/" + newS3 + "?dt=" + file.dateModified.getTime().toString();
        await this.repositories.file.save(file);
      }
    }
  }
}
