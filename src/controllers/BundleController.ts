import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Bundle, Resource } from "../models";
import { Permissions } from "../helpers/Permissions";
import { FilesHelper } from "../helpers";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArrayHelper } from "@churchapps/apihelper";
import { ZipHelper } from "../helpers/ZipHelper";

@controller("/bundles")
export class BundleController extends LessonsBaseController {
  /*
    @httpGet("/public/lesson/:lessonId")
    public async getPublicForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
      return this.actionWrapperAnon(req, res, async () => {
        const bundles: Bundle[] = await this.repositories.bundle.loadPublicForLesson(lessonId);
        if (bundles.length === 0) return bundles;
        const fileIds = ArrayHelper.getIds(bundles, "fileId");
        for (let i = fileIds.length; i >= 0; i--) if (!fileIds[i]) fileIds.splice(i, 1);
        if (fileIds.length > 0) {
          const files = await this.repositories.file.loadByIds(bundles[0].churchId, fileIds);
          bundles.forEach(b => { b.file = ArrayHelper.getOne(files, "id", b.fileId) });
        }
        return bundles;
      });
    }
  */

  @httpGet("/zip")
  public async zipAll(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async _au => {
      await ZipHelper.zipPendingBundles();
      return [];
    });
  }

  @httpGet("/queue/health")
  public async getQueueHealth(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);

      const pendingBundles = await this.repositories.bundle.loadPendingUpdate(50); // Check more for health status
      const totalBundles = await this.repositories.bundle.loadAll(au.churchId);

      // Check for bundles that have been pending for too long (>1 hour)
      const stuckBundles = pendingBundles.filter(b => {
        // Assuming there's a dateModified or similar field to check
        const lastUpdate = new Date(b.dateModified || 0);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastUpdate < hourAgo;
      });

      const healthStatus = {
        status: stuckBundles.length > 0 ? "WARNING" : pendingBundles.length > 10 ? "HIGH_LOAD" : "HEALTHY",
        queueDepth: pendingBundles.length,
        totalBundles: totalBundles.length,
        stuckBundles: stuckBundles.length,
        stuckBundleIds: stuckBundles.map(b => b.id),
        timestamp: new Date().toISOString(),
        metrics: {
          queueUtilization: ((pendingBundles.length / Math.max(totalBundles.length, 1)) * 100).toFixed(1) + "%",
          recommendedAction: stuckBundles.length > 0 ? "Manual intervention required" : pendingBundles.length > 10 ? "Monitor closely" : "No action needed",
        },
      };

      console.log("Bundle queue health check:", healthStatus);
      return healthStatus;
    });
  }

  @httpPost("/queue/clear-stuck")
  public async clearStuckBundles(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);

      const pendingBundles = await this.repositories.bundle.loadPendingUpdate(100);
      const stuckBundles = pendingBundles.filter(b => {
        const lastUpdate = new Date(b.dateModified || 0);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastUpdate < hourAgo;
      });

      console.log(`Clearing ${stuckBundles.length} stuck bundles from queue`);

      for (const bundle of stuckBundles) {
        bundle.pendingUpdate = false;
        await this.repositories.bundle.save(bundle);
        console.log(`Cleared stuck bundle ${bundle.id} from queue`);
      }

      return {
        clearedCount: stuckBundles.length,
        clearedBundleIds: stuckBundles.map(b => b.id),
        timestamp: new Date().toISOString(),
      };
    });
  }

  @httpGet("/available")
  public async getAvailable(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.bundle.loadAvailable(au.churchId, req.query.programId.toString(), req.query.studyId.toString());
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.bundle.load(au.churchId, id);
    });
  }

  @httpGet("/content/:contentType/:contentId")
  public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.bundle.loadByContentTypeId(au.churchId, contentType, contentId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Bundle[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Bundle>[] = [];
        req.body.forEach(bundle => {
          bundle.churchId = au.churchId;
          bundle.pendingUpdate = true;
          promises.push(
            this.repositories.bundle.save(bundle).then(async b => {
              await ZipHelper.setBundlePending(bundle.churchId, b.id);
              return b;
            })
          );
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
        const resources: Resource[] = await this.repositories.resource.loadByBundleId(au.churchId, id);
        for (const r of resources) await this.deleteResource(r.churchId, r.id);
        await FilesHelper.deleteBundleFolder(au.churchId, id);
        await this.repositories.bundle.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

  private async deleteResource(churchId: string, resourceId: string) {
    const promises: Promise<any>[] = [];
    promises.push(
      this.repositories.asset.loadByResourceId(churchId, resourceId).then(assets =>
        assets.forEach(async a => {
          await FilesHelper.deleteFile(churchId, a.fileId, a.resourceId);
          await this.repositories.asset.delete(churchId, a.id);
        })
      )
    );
    promises.push(
      this.repositories.variant.loadByResourceId(churchId, resourceId).then(variants =>
        variants.forEach(async v => {
          await FilesHelper.deleteFile(churchId, v.fileId, v.resourceId);
          await this.repositories.variant.delete(churchId, v.id);
        })
      )
    );

    await Promise.all(promises);
    await FilesHelper.deleteResourceFolder(churchId, resourceId);
    await this.repositories.resource.delete(churchId, resourceId);
  }
}
