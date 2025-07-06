// Note: Not currently live.  We may delete this if it doesn't get used.

import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { AddOnPlaylistItem } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/addOnPlaylistItems")
export class AddOnPlaylistItemController extends LessonsBaseController {

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async () => {
      return await this.repositories.addOnPlaylistItem.load(id)
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, AddOnPlaylistItem[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<AddOnPlaylistItem>[] = [];
        req.body.forEach(addOnPlaylistItem => { addOnPlaylistItem.churchId = au.churchId; promises.push(this.repositories.addOnPlaylistItem.save(addOnPlaylistItem)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        await this.repositories.addOnPlaylistItem.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

}
