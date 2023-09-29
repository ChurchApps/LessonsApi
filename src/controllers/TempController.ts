import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { ArrayHelper } from "@churchapps/apihelper";
import { Action, ExternalVideo } from "../models";
import { PlaylistHelper } from "../helpers/PlaylistHelper";
import { Environment } from "../helpers";

@controller("/temp")
export class TempController extends LessonsBaseController {

  @httpGet("/lessons")
  public async getPublicForProgram(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {

      const programs = await this.repositories.program.loadPublicAll();
      const studies = await this.repositories.study.loadPublicAll();
      const lessons = await this.repositories.lesson.loadPublicAll();
      const venues = await this.repositories.venue.loadPublicAll();
      const result = { programs: [] }

      programs.forEach(program => {
        const p = { id:program.id, name: program.name, description:program.shortDescription || program.description || "", image:program.image, studies: [] }
        ArrayHelper.getAll(studies, "programId", program.id).forEach(study => {
          const s = { id: study.id, name: study.name, description: study.shortDescription || study.description || "", image: study.image, lessons: [] }
          ArrayHelper.getAll(lessons, "studyId", study.id).forEach(lesson => {
            const l = { id: lesson.id, name: lesson.title, description:lesson.description, image:lesson.image, venues:[] }
            ArrayHelper.getAll(venues, "lessonId", lesson.id).forEach(venue => {
              l.venues.push({ id: venue.id, name: venue.name, apiUrl: "https://api.lessons.church/temp/venue/" + venue.id })
            });
            s.lessons.push(l)
          })
          p.studies.push(s)
        });
        result.programs.push(p);
      });

      return result;
    });
  }

  @httpGet("/venue/:venueId")
  public async getPublicForVenue(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {

      const venue = await this.repositories.venue.loadPublic(venueId);
      const lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
      const study = await this.repositories.study.loadPublic(lesson.studyId);
      const program = await this.repositories.program.loadPublic(study.programId);
      const sections = await this.repositories.section.loadByVenueIdPublic(venue.id);
      const roles = await this.repositories.role.loadByLessonId(lesson.id);
      const actions = await this.repositories.action.loadByLessonId(lesson.id);
      const availableFiles = await PlaylistHelper.loadPlaylistFiles(actions);
      const availableVideos = await PlaylistHelper.loadPlaylistVideos(actions);

      const result = { name: venue.name, lessonName: lesson.title, lessonDescription: lesson.description, studyName: study.name, programName: program.name, sections: [] }
      sections.forEach(section => {
        const s = { name: section.name, actions: [] }
        ArrayHelper.getAll(roles, "sectionId", section.id).forEach(role => {
          ArrayHelper.getAll(actions, "roleId", role.id).forEach(action => {
            if (action.actionType!=="Download") {
              const a:any = { actionType: action.actionType, content: action.content }
              if (a.actionType === "Play") {
                a.files = [];
                this.getFiles(action, availableFiles, availableVideos, a);
              }
              s.actions.push(a);
            }
          });
        });
        result.sections.push(s);
      });


      return result;
    });
  }

  private async getFiles(action:Action, availableFiles:any, availableVideos:any, a:any)
  {
    if (action.externalVideoId) {
      const video: ExternalVideo = ArrayHelper.getOne(availableVideos, "id", action.externalVideoId);
      let seconds = video.seconds;
      const loopVideo = (video.loopVideo) ? true : false;
      if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
      const f:any = { name: video.name, url: video.play720 }
      if (seconds<3600) f.seconds = seconds;
      if (loopVideo) f.loop = true;
      if (video) a.files.push(f)
    } else {
      const files: any[] = PlaylistHelper.getBestFiles(action, availableFiles);
      files.forEach(file => {
        const contentPath = (file.contentPath.indexOf("://") === -1) ? Environment.contentRoot + file.contentPath : file.contentPath;
        let seconds = parseInt(file.seconds, 0);
        const loopVideo = (file.loopVideo) ? true : false;
        if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
        const f:any = { name: file.resourceName, url: contentPath }
        if (seconds<3600) f.seconds = seconds;
        if (loopVideo) f.loop = true;
        a.files.push(f)
      });
    }
  }

}
