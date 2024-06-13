import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { AddOn } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FileStorageHelper } from "@churchapps/apihelper";
import { Environment } from "../helpers";

@controller("/addOns")
export class AddOnController extends LessonsBaseController {

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async () => {
      return await this.repositories.addOn.load(id)
    });
  }

  @httpGet("/public")
  public async loadPublic(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.addOn.loadPublic();
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.addOn.loadAll(au.churchId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, AddOn[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<AddOn>[] = [];
        // req.body.forEach(program => { program.churchId = au.churchId; promises.push(this.repositories.program.save(program)); });
        req.body.forEach(addOn => {
            addOn.churchId = au.churchId;
          const a = addOn;
          const saveFunction = async () => {
            if (a.image && a.image.startsWith("data:image/")) {
                if (!a.id) await this.repositories.lesson.save(a);  // save first to generate an id
                await this.saveImage(a);
            }
            return await this.repositories.addOn.save(a);
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
      else await this.repositories.addOn.delete(au.churchId, id);
    });
  }

  private async saveImage(addOn: AddOn) {
    const base64 = addOn.image.split(',')[1];
    const key = "/addOns/" + addOn.id + ".png";
    return FileStorageHelper.store(key, "image/png", Buffer.from(base64, 'base64')).then(async () => {
      const photoUpdated = new Date();
      addOn.image = Environment.contentRoot + key + "?dt=" + photoUpdated.getTime().toString();
    });
  }

}
