// Note: Not currently live.  We may delete this if it doesn't get used.

import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { AddOnPlaylist } from "../models";
import { Permissions } from "../helpers/Permissions";

@controller("/addOnPlaylists")
export class AddOnPlaylistController extends LessonsBaseController {
  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async () => {
      return await this.repositories.addOnPlaylist.load(id);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, AddOnPlaylist[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<AddOnPlaylist>[] = [];
        req.body.forEach(addOnPlaylist => {
          addOnPlaylist.churchId = au.churchId;
          promises.push(this.repositories.addOnPlaylist.save(addOnPlaylist));
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
        await this.repositories.addOnPlaylist.delete(au.churchId, id);
        return this.json({});
      }
    });
  }
}
