import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Venue, Section, Action, Role, ExternalVideo, Lesson, Download } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ArrayHelper } from "@churchapps/apihelper";
import { Environment } from "../helpers";
import { PlaylistHelper } from "../helpers/PlaylistHelper";
import { LessonFeedHelper } from "../helpers/LessonFeedHelper";
import { LibraryHelper } from "../helpers/LibraryHelper";

@controller("/venues")
export class VenueController extends LessonsBaseController {

  @httpGet("/timeline")
  public async getPosts(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const venueIds = req.query.venueIds ? req.query.venueIds.toString().split(",") : [];
      return await this.repositories.venue.loadTimeline(venueIds);
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

  @httpGet("/playlistNew/:venueId")
  public async getPlaylistNew(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venue: Venue = await this.repositories.venue.loadPublic(venueId);
      const lesson: Lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
      const sections = await this.repositories.section.loadForPlaylist(venue.churchId, venue.id, venue.churchId);
      const actions = await this.repositories.action.loadPlaylistActions(venue.id, venue.churchId)
      const availableFiles = await PlaylistHelper.loadPlaylistFiles(actions);
      const availableVideos = await PlaylistHelper.loadPlaylistVideos(actions);
      let resolution: "720" | "1080" = "720";
      if (req.query.resolution && req.query.resolution === "1080") resolution = "1080";

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).toString().split(",")[0]
      await this.logDownload(venue.lessonId, venue.name, venue.churchId, ipAddress);
      return await LibraryHelper.getPlaylist(venue, sections, actions, availableFiles, availableVideos, req.query.mode === "web", resolution);
    });
  }


  @httpGet("/playlist/:venueId")
  public async getPlaylist(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venue: Venue = await this.repositories.venue.loadPublic(venueId);
      const lesson: Lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
      const sections = await this.repositories.section.loadForPlaylist(venue.churchId, venue.id, venue.churchId);
      const actions = await this.repositories.action.loadPlaylistActions(venue.id, venue.churchId)
      const availableFiles = await PlaylistHelper.loadPlaylistFiles(actions);
      const availableVideos = await PlaylistHelper.loadPlaylistVideos(actions);
      let resolution: "720" | "1080" = "720";
      if (req.query.resolution && req.query.resolution === "1080") resolution = "1080";

      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).toString().split(",")[0]
      await this.logDownload(venue.lessonId, venue.name, venue.churchId, ipAddress);

      const messages: any[] = [];

      sections.forEach(s => {
        const sectionActions: Action[] = ArrayHelper.getAll(actions, "sectionId", s.id);
        const itemFiles: any[] = [];
        sectionActions.forEach(a => {
          if (a.externalVideoId || a.actionType === "Add-on") {
            let video: ExternalVideo = ArrayHelper.getOne(availableVideos, "id", a.externalVideoId);
            if (!video && a.actionType === "Add-on") video = ArrayHelper.getOne(availableVideos, "contentId", a.addOnId);
            if (video) {
              if (req.query.mode === "web") itemFiles.push({ name: video.name, url: video.videoProvider.toLowerCase() + ":" + video.videoId, seconds: video.seconds, loopVideo: video.loopVideo })
              else itemFiles.push({ name: video.name, url: resolution === "1080" ? video.play1080 : video.play720, seconds: video.seconds, loopVideo: video.loopVideo })
            }
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
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.venue.load(au.churchId, id);
    });
  }

  @httpGet("/public/feed/:id")
  public async getPublicFeed(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venue = await this.repositories.venue.loadPublic(id);
      const lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
      const study = await this.repositories.study.loadPublic(lesson.studyId);
      const program = await this.repositories.program.loadPublic(study.programId);

      const data = await LessonFeedHelper.getExpandedLessonData(program, study, lesson);

      const expandedVenue = ArrayHelper.getOne(data.venues, "id", venue.id);

      const result = await LessonFeedHelper.convertToFeed(data.lesson, data.study, data.program, expandedVenue, data.bundles, data.resources, data.externalVideos, data.addOns);
      return result;
    });
  }

  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venue = await this.repositories.venue.loadPublic(id);
      const sections = await this.repositories.section.loadByLessonId(venue.lessonId);
      const roles = await this.repositories.role.loadByLessonId(venue.lessonId);
      const actions = await this.repositories.action.loadByLessonId(venue.lessonId);
      this.appendSections(venue, sections, roles, actions);
      return venue;
    });
  }

  /*Unused?*/
  @httpGet("/public/lesson/:lessonId")
  public async getPublicForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const venues = await this.repositories.venue.loadPublicByLessonId(lessonId);
      const sections = await this.repositories.section.loadByLessonId(lessonId);
      const roles = await this.repositories.role.loadByLessonId(lessonId);
      const actions = await this.repositories.action.loadByLessonId(lessonId);
      venues.forEach(v => this.appendSections(v, sections, roles, actions));
      return venues;

    });
  }

  @httpGet("/lesson/:lessonId")
  public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.venue.loadByLessonId(au.churchId, lessonId);
    });
  }


  @httpGet("/names/classroom/:classroomId")
  public async getNameByClassroom(@requestParam("classroomId") classroomId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.venue.loadNamesForClassroom(au.churchId, classroomId)
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.venue.loadAll(au.churchId);
    });
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Venue[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Venue>[] = [];
        req.body.forEach(venue => { venue.churchId = au.churchId; promises.push(this.repositories.venue.save(venue)); });
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
        await this.repositories.venue.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

  public async appendSections(venue: Venue, allSections: Section[], allRoles: Role[], allActions: Action[]) {
    venue.sections = ArrayHelper.getAll(allSections, "venueId", venue.id);

    venue.sections.forEach(s => {
      s.roles = ArrayHelper.getAll(allRoles, "sectionId", s.id);
      s.roles.forEach(r => {
        r.actions = ArrayHelper.getAll(allActions, "roleId", r.id);
      });
    });
  }


}
