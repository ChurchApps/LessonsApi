import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));

import { ScheduleController } from "../ScheduleController";

function makeController(au: any, repos: any) {
  const controller = new ScheduleController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

describe("ScheduleController.get", () => {
  it("404s when the schedule belongs to another church", async () => {
    const repos = { schedule: { load: jest.fn(async () => ({ id: "s1", churchId: "OTHER" })) } };
    const controller = makeController({ churchId: "c1" }, repos);

    const res = await (controller as any).get("s1", {}, {});

    expect(res.status).toBe(404);
  });

  it("returns the caller's own schedule", async () => {
    const schedule = { id: "s1", churchId: "c1", venueId: "v1" };
    const repos = { schedule: { load: jest.fn(async () => schedule) } };
    const controller = makeController({ churchId: "c1" }, repos);

    expect(await (controller as any).get("s1", {}, {})).toEqual(schedule);
  });

  it("404s for a missing schedule", async () => {
    const repos = { schedule: { load: jest.fn(async () => undefined) } };
    const controller = makeController({ churchId: "c1" }, repos);

    const res = await (controller as any).get("nope", {}, {});

    expect(res.status).toBe(404);
  });
});

describe("ScheduleController.save", () => {
  it("stamps churchId from the auth context", async () => {
    const saved: any[] = [];
    const repos = { schedule: { save: jest.fn(async (s: any) => { saved.push(s); return s; }) } };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    await (controller as any).save({ body: [{ churchId: "SPOOFED", venueId: "v1" }] }, {});

    expect(saved[0].churchId).toBe("c1");
  });

  it("rejects without schedules-edit permission", async () => {
    const repos = { schedule: { save: jest.fn() } };
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await (controller as any).save({ body: [{}] }, {});

    expect(res.status).toBe(401);
    expect(repos.schedule.save).not.toHaveBeenCalled();
  });
});
