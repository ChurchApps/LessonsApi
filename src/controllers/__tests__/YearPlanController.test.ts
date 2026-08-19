import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));

import { YearPlanController } from "../YearPlanController";

function makeController(au: any, repos: any) {
  const controller = new YearPlanController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

describe("YearPlanController.save", () => {
  it("stamps churchId and replaces weeks", async () => {
    const savedPlans: any[] = [];
    const repos = {
      yearPlan: { save: jest.fn(async (p: any) => { savedPlans.push({ ...p }); return { ...p, id: p.id || "yp1" }; }) },
      yearPlanWeek: { replaceForPlan: jest.fn(async (_churchId: string, planId: string, weeks: any[]) => weeks.map((w, i) => ({ ...w, id: "w" + i, yearPlanId: planId }))) }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await (controller as any).save({ body: [{ churchId: "SPOOFED", name: "Ark Year", weeks: [{ week: 1, lessonId: "l1" }] }] }, {});

    expect(savedPlans[0].churchId).toBe("c1");
    expect(repos.yearPlanWeek.replaceForPlan).toHaveBeenCalledWith("c1", "yp1", [{ week: 1, lessonId: "l1" }]);
    expect(res[0].weeks).toHaveLength(1);
  });

  it("404s when saving a plan id owned by another church", async () => {
    const repos = {
      yearPlan: { load: jest.fn(async () => undefined), save: jest.fn() },
      yearPlanWeek: { replaceForPlan: jest.fn() }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await (controller as any).save({ body: [{ id: "other", weeks: [{ week: 1 }] }] }, {});

    expect(res.status).toBe(404);
    expect(repos.yearPlan.save).not.toHaveBeenCalled();
    expect(repos.yearPlanWeek.replaceForPlan).not.toHaveBeenCalled();
  });

  it("rejects without lessons-edit permission", async () => {
    const repos = { yearPlan: { save: jest.fn() } };
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await (controller as any).save({ body: [{}] }, {});

    expect(res.status).toBe(401);
    expect(repos.yearPlan.save).not.toHaveBeenCalled();
  });
});

describe("YearPlanController.get", () => {
  it("404s when the plan belongs to another church", async () => {
    const repos = { yearPlan: { load: jest.fn(async () => undefined) } };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await (controller as any).get("yp1", {}, {});

    expect(res.status).toBe(404);
  });
});
