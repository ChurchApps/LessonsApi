import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Provider } from "../models";
import { Permissions } from "../helpers/Permissions";

@controller("/providers")
export class ProviderController extends LessonsBaseController {
  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.provider.loadPublic(id);
    });
  }

  @httpGet("/public")
  public async getPublicAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.provider.loadPublicAll();
    });
  }

  @httpGet("/stats")
  public async getStats(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.provider.loadStats();
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      return await this.repositories.provider.load(au.churchId, id);
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      return await this.repositories.provider.loadAll(au.churchId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Provider[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Provider>[] = [];
        req.body.forEach(provider => {
          provider.churchId = au.churchId;
          promises.push(this.repositories.provider.save(provider));
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
        await this.repositories.provider.delete(au.churchId, id);
        return this.json({});
      }
    });
  }
}
