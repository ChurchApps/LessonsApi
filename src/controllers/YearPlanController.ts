import { controller, httpPost, httpGet, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import type { Venue, YearPlan, YearPlanWeek } from "../models";
import { Permissions } from "../helpers/Permissions";

@controller("/yearPlans")
export class YearPlanController extends LessonsBaseController {
  @httpGet("/public")
  public async getPublicAll(_req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(_req, res, async () => {
      const plans = await this.repositories.yearPlan.loadPublicAll();
      return await this.hydratePlans(plans, true);
    });
  }

  @httpGet("/public/:id")
  public async getPublic(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const plan = await this.repositories.yearPlan.loadPublic(id);
      if (!plan) return this.json({}, 404);
      const hydrated = await this.hydratePlans([plan], true);
      return hydrated[0];
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      const plan = await this.repositories.yearPlan.load(au.churchId, id);
      if (!plan) return this.json({}, 404);
      const hydrated = await this.hydratePlans([plan], false);
      return hydrated[0];
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      const plans = await this.repositories.yearPlan.loadAll(au.churchId);
      return await this.hydratePlans(plans, false);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, YearPlan[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      const result: YearPlan[] = [];
      for (const incoming of req.body) {
        // ownership check — replaceForPlan would otherwise insert weeks under another church's plan id
        if (incoming.id && !(await this.repositories.yearPlan.load(au.churchId, incoming.id))) return this.json({}, 404);
        incoming.churchId = au.churchId;
        const weeks = incoming.weeks;
        delete incoming.weeks;
        const saved = await this.repositories.yearPlan.save(incoming);
        if (weeks) {
          saved.weeks = await this.repositories.yearPlanWeek.replaceForPlan(au.churchId, saved.id!, weeks);
        }
        result.push(saved);
      }
      return result;
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      await this.repositories.yearPlan.delete(au.churchId, id);
      return this.json({});
    });
  }

  private async hydratePlans(plans: YearPlan[], publicOnly: boolean): Promise<YearPlan[]> {
    if (plans.length === 0) return plans;
    const weeks = await this.repositories.yearPlanWeek.loadByPlanIds(plans.map(p => p.id!));
    const lessonIds = Array.from(new Set(weeks.map(w => w.lessonId).filter(Boolean))) as string[];
    const lessons = lessonIds.length
      ? (publicOnly ? await this.repositories.lesson.loadPublicByIds(lessonIds) : await this.repositories.lesson.loadByIds(lessonIds))
      : [];
    const studyIds = Array.from(new Set(lessons.map(l => l.studyId).filter(Boolean))) as string[];
    const studies = studyIds.length
      ? (publicOnly ? await this.repositories.study.loadPublicByIds(studyIds) : await this.repositories.study.loadByIds(studyIds))
      : [];
    const venues = lessonIds.length ? await this.repositories.venue.loadPublicByLessonIds(lessonIds) : [];

    const lessonMap = new Map(lessons.map(l => [l.id, l]));
    const studyMap = new Map(studies.map(s => [s.id, s]));
    const venuesByLesson = new Map<string, Venue[]>();
    for (const v of venues) {
      const list = venuesByLesson.get(v.lessonId!) || [];
      list.push(v);
      venuesByLesson.set(v.lessonId!, list);
    }

    const weeksByPlan = new Map<string, YearPlanWeek[]>();
    for (const week of weeks) {
      const lesson = lessonMap.get(week.lessonId);
      const study = lesson ? studyMap.get(lesson.studyId) : undefined;
      const plan = plans.find(p => p.id === week.yearPlanId);
      const lessonVenues = venuesByLesson.get(week.lessonId!) || [];
      const storedVenue = week.venueId ? lessonVenues.find(v => v.id === week.venueId) : undefined;
      const venue = storedVenue || this.pickVenue(lessonVenues, plan?.venuePreference);
      const hydrated: YearPlanWeek = {
        ...week,
        programId: week.programId || study?.programId,
        studyId: week.studyId || lesson?.studyId,
        studyName: week.studyName || study?.name,
        lessonName: week.lessonName || lesson?.name,
        venueId: week.venueId || venue?.id,
        venueName: week.venueName || venue?.name?.trim()
      };
      const list = weeksByPlan.get(week.yearPlanId!) || [];
      list.push(hydrated);
      weeksByPlan.set(week.yearPlanId!, list);
    }

    return plans.map(p => ({ ...p, weeks: weeksByPlan.get(p.id!) || [] }));
  }

  private pickVenue(venues: Venue[], preference?: string): Venue | undefined {
    if (venues.length === 0) return undefined;
    const prefs = (preference || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    for (const pref of prefs) {
      const exact = venues.find(v => (v.name || "").trim().toLowerCase() === pref);
      if (exact) return exact;
    }
    for (const pref of prefs) {
      const partial = venues.find(v => (v.name || "").trim().toLowerCase().includes(pref));
      if (partial) return partial;
    }
    return venues[0];
  }
}
