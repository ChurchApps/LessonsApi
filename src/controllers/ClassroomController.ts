import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Action, Classroom, Download, ExternalVideo, Lesson, Venue } from "../models"
import { Permissions } from '../helpers/Permissions'
import { PlaylistHelper } from "../helpers/PlaylistHelper";
import { Environment } from "../helpers";
import { ArrayHelper } from "@churchapps/apihelper";

@controller("/classrooms")
export class ClassroomController extends LessonsBaseController {

  @httpGet("/playlist/:classroomId")
  public async getPlaylist(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const currentSchedule = await this.repositories.schedule.loadCurrent(classroomId);
      if (!currentSchedule) throw new Error(("Could not load schedule"));
      const venue: Venue = await this.repositories.venue.loadPublic(currentSchedule.venueId);
      if (!venue) throw new Error(("Could not load venue: " + currentSchedule.venueId));
      const lesson: Lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
      const sections = await this.repositories.section.loadForPlaylist(venue.churchId, venue.id, currentSchedule.churchId);
      const actions = await this.repositories.action.loadPlaylistActions(venue.id, currentSchedule.churchId)
      const availableFiles = await PlaylistHelper.loadPlaylistFiles(actions);
      const availableVideos = await PlaylistHelper.loadPlaylistVideos(actions);

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).toString().split(",")[0]
      await this.logDownload(venue.lessonId, venue.name, currentSchedule.churchId, ipAddress);

      const messages: any[] = [];

      sections.forEach(s => {
        const sectionActions: Action[] = ArrayHelper.getAll(actions, "sectionId", s.id);
        const itemFiles: any[] = [];
        sectionActions.forEach(a => {
          if (a.externalVideoId) {
            const video: ExternalVideo = ArrayHelper.getOne(availableVideos, "id", a.externalVideoId);
            let seconds = video.seconds;
            const loopVideo = (video.loopVideo) ? true : false;
            if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
            if (video) itemFiles.push({ name: video.name, url: video.play720, seconds, loopVideo: video.loopVideo })
          } else {
            const files: any[] = PlaylistHelper.getBestFiles(a, availableFiles);
            files.forEach(file => {
              const contentPath = (file.contentPath.indexOf("://") === -1) ? Environment.contentRoot + file.contentPath : file.contentPath;
              let seconds = parseInt(file.seconds, 0);
              const loopVideo = (file.loopVideo) ? true : false;
              if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
              itemFiles.push({ name: file.resourceName, url: contentPath, seconds, loopVideo })
            });
          }
        });
        messages.push({ name: s.name, files: itemFiles });


      });

      return { messages, lessonName: lesson.name, lessonTitle: lesson.title, lessonImage: lesson.image, lessonDescription: lesson.description, venueName: venue.name };
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

  public async logDownload(lessonId: string, venueName: string, churchId: string, ipAddress: string) {
    const download: Download = {
      lessonId,
      churchId,
      ipAddress,
      downloadDate: new Date(),
      fileName: "Playlist: " + venueName
    }
    const existing = await this.repositories.download.loadExisting(download)
    if (!existing) await this.repositories.download.save(download);
  }


}
