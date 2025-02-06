import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Action, Classroom, Download, ExternalVideo, Lesson, Schedule, Venue } from "../models"
import { Permissions } from '../helpers/Permissions'
import { PlaylistHelper } from "../helpers/PlaylistHelper";
import { Environment } from "../helpers";
import { ArrayHelper } from "@churchapps/apihelper";
import { ExternalProviderHelper } from "../helpers/ExternalProviderHelper";

@controller("/classrooms")
export class ClassroomController extends LessonsBaseController {

  private async loadPlaylistInternal(currentSchedule:Schedule, ipAddress: string, resolution: "720" | "1080")
  {
    const venue: Venue = await this.repositories.venue.loadPublic(currentSchedule.venueId);
    if (!venue) throw new Error(("Could not load venue: " + currentSchedule.venueId));
    const lesson: Lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
    const sections = await this.repositories.section.loadForPlaylist(venue.churchId, venue.id, currentSchedule.churchId);
    const actions = await this.repositories.action.loadPlaylistActions(venue.id, currentSchedule.churchId)
    const availableFiles = await PlaylistHelper.loadPlaylistFiles(actions);
    const availableVideos = await PlaylistHelper.loadPlaylistVideos(actions);
    await this.logDownload(venue.lessonId, venue.name, currentSchedule.churchId, ipAddress);

    const messages: any[] = [];

    sections.forEach(s => {
      const sectionActions: Action[] = ArrayHelper.getAll(actions, "sectionId", s.id);
      const itemFiles: any[] = [];
      sectionActions.forEach(a => {
        if (a.externalVideoId || a.actionType === "Add-on") {
          let video: ExternalVideo = ArrayHelper.getOne(availableVideos, "id", a.externalVideoId);
          if (!video && a.actionType === "Add-on") video = ArrayHelper.getOne(availableVideos, "contentId", a.addOnId);
          if (video) {
            let seconds = video.seconds;
            const loopVideo = (video.loopVideo) ? true : false;
            if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
            itemFiles.push({ name: video.name, url: resolution === "1080" ? video.play1080 : video.play720, seconds, loopVideo: video.loopVideo })
          }
        } else {
          const files: any[] = PlaylistHelper.getBestFiles(a, availableFiles);
          files.forEach(file => {
            const contentPath = (file.contentPath.indexOf("://") === -1) ? Environment.contentRoot + file.contentPath : file.contentPath;
            let seconds = parseInt(file?.seconds || 0, 0);
            const loopVideo = (file.loopVideo) ? true : false;
            if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
            itemFiles.push({ name: file.resourceName, url: contentPath, seconds, loopVideo })
          });
        }
      });
      messages.push({ name: s.name, files: itemFiles });


    });

    return { messages, lessonName: lesson.name, lessonTitle: lesson.title, lessonImage: lesson.image, lessonDescription: lesson.description, venueName: venue.name };
  }



  private async loadPlaylistExternal(currentSchedule:Schedule)
  {
    const data = await ExternalProviderHelper.loadExternalData(currentSchedule.externalProviderId, currentSchedule.programId, currentSchedule.studyId, currentSchedule.lessonId, currentSchedule.venueId);
    return ExternalProviderHelper.convertToMessages(data);

  }

  private getCurrentCentralTime() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * -6));
  }

  @httpGet("/playlist/:classroomId")
  public async getPlaylist(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      let resolution: "720" | "1080" = "720";
      if (req.query.resolution && req.query.resolution === "1080") resolution = "1080";
      const date = req.query.date ? new Date(req.query.date.toString()) : this.getCurrentCentralTime();
      const currentSchedule = await this.repositories.schedule.loadCurrent(classroomId, date);
      if (!currentSchedule) throw new Error(("Could not load schedule"));
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).toString().split(",")[0]
      if (currentSchedule.externalProviderId) return this.loadPlaylistExternal(currentSchedule);
      else return this.loadPlaylistInternal(currentSchedule, ipAddress, resolution);
    });
  }


  @httpGet("/")
  public async getAll(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.classroom.loadByChurchId(au.churchId)
    });
  }

  @httpGet("/person")
  public async getForPerson(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.groupIds || au.groupIds.length === 0) return [];
      return await this.repositories.classroom.loadForPerson(au.churchId, au.groupIds);
    });
  }

  @httpGet("/public/church/:churchId")
  public async getForChurch(@requestParam("churchId") churchId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.classroom.loadByChurchId(churchId)
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.classroom.load(id)
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
      else {
        await this.repositories.classroom.delete(au.churchId, id);
        return this.json({});
      }
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
