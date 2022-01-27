import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Classroom, Venue } from "../models"
import { Permissions } from '../helpers/Permissions'
import { PlaylistHelper } from "../helpers/PlaylistHelper";
import { Environment } from "../helpers";
import { ArrayHelper } from "../apiBase";

@controller("/classrooms")
export class ClassroomController extends LessonsBaseController {

  @httpGet("/playlist/:classroomId")
  public async getPlaylist(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const currentSchedule = await this.repositories.schedule.loadCurrent(classroomId);
      if (!currentSchedule) throw new Error(("Could not load schedule"));
      const venue: Venue = await this.repositories.venue.loadPublic(currentSchedule.venueId);
      if (!venue) throw new Error(("Could not load venue: " + currentSchedule.venueId));
      const sections = await this.repositories.section.loadByVenueId(venue.churchId, venue.id);
      const actions = await this.repositories.action.loadPlaylistActions(venue.id, currentSchedule.churchId)
      const availableFiles = await PlaylistHelper.loadPlaylistFiles(actions);

      const result: any[] = [];

      sections.forEach(s => {
        const sectionActions = ArrayHelper.getAll(actions, "sectionId", s.id);
        const itemFiles: any[] = [];
        sectionActions.forEach(a => {
          const files: any[] = PlaylistHelper.getBestFiles(a, availableFiles);
          files.forEach(file => {
            const contentPath = (file.contentPath.indexOf("://") === -1) ? Environment.contentRoot + file.contentPath : file.contentPath;
            let seconds = parseInt(file.seconds, 0);
            if (!seconds || seconds === 0) seconds = 3600;
            itemFiles.push({ name: file.resourceName, url: contentPath, seconds })
          });
        });
        result.push({ name: s.name, files: itemFiles });


      });




      return result;
    });
  }


  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.classroom.load(id)
    });
  }

  @httpGet("/")
  public async getAll(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.classroom.loadByChurchId(au.churchId)
    });
  }

  @httpGet("/public/church/:churchId")
  public async getForChurch(@requestParam("churchId") churchId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.classroom.loadByChurchId(churchId)
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Classroom[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Classroom>[] = [];
        req.body.forEach(classroom => { classroom.churchId = au.churchId; promises.push(this.repositories.classroom.save(classroom)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else await this.repositories.classroom.delete(au.churchId, id);
    });
  }


}
