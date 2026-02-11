import { controller, httpPost, httpGet, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Action } from "../models";
import { Permissions } from "../helpers/Permissions";
import { ArrayHelper } from "@churchapps/apihelper";
import { LessonFeedHelper } from "../helpers/LessonFeedHelper";

@controller("/actions")
export class ActionController extends LessonsBaseController {
  @httpGet("/public/lesson/:lessonId")
  public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.action.loadByLessonId(lessonId);
    });
  }

  @httpGet("/public/feed/:id")
  public async getPublicFeed(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      // Load the action
      const action = await this.repositories.action.load(id);
      if (!action) return null;

      // Load the role to get section info
      const role = await this.repositories.role.load(action.roleId);
      if (!role) return null;

      // Load section to get venue info
      const section = await this.repositories.section.load(role.sectionId);
      if (!section) return null;

      // Load venue to get lesson info
      const venue = await this.repositories.venue.loadPublic(section.venueId);
      const lesson = await this.repositories.lesson.loadPublic(venue.lessonId);
      const study = await this.repositories.study.loadPublic(lesson.studyId);
      const program = await this.repositories.program.loadPublic(study.programId);

      // Load full venue data to get resources, bundles, etc.
      const data = await LessonFeedHelper.getExpandedLessonData(program, study, lesson);
      const expandedVenue = ArrayHelper.getOne(data.venues, "id", venue.id);

      // Convert to feed format
      const fullFeed = await LessonFeedHelper.convertToFeed(data.lesson, data.study, data.program, expandedVenue, data.bundles, data.resources, data.externalVideos, data.addOns);

      // Find the section and action
      const feedSection = fullFeed.sections?.find(s => s.id === section.id);
      const feedAction = feedSection?.actions?.find(a => a.id === id);

      return {
        action: feedAction,
        sectionId: section.id,
        sectionName: feedSection?.name,
        lessonId: lesson.id,
        lessonName: fullFeed.lessonName,
        lessonDescription: fullFeed.lessonDescription,
        lessonImage: fullFeed.lessonImage,
        venueName: fullFeed.name,
        studyName: fullFeed.studyName,
        programName: fullFeed.programName,
        roleName: role.name
      };
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.action.load(id);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Action[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Action>[] = [];
        req.body.forEach(action => {
          action.churchId = au.churchId;
          promises.push(this.repositories.action.save(action));
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
        await this.repositories.action.delete(au.churchId, id);
        return this.json({});
      }
    });
  }
}
