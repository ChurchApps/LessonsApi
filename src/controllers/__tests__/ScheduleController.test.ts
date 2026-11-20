import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));

import { ScheduleController } from "../ScheduleController";
import { Schedule } from "../../models";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper, TestUser } from "./controllerTestUtils";

function makeController(au: TestUser, repos: RepoMocks) {
  const controller = new ScheduleController();
  setActionWrapper(controller, au);
  controller.repositories = asRepositories(repos);
  return controller;
}

describe("ScheduleController.get", () => {
  it("404s when the schedule belongs to another church", async () => {
    const repos = { schedule: { load: jest.fn(async () => ({ id: "s1", churchId: "OTHER" })) } };
    const controller = makeController({ churchId: "c1" }, repos);

    const res = await controller.get("s1", asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(404);
  });

  it("returns the caller's own schedule", async () => {
    const schedule = { id: "s1", churchId: "c1", venueId: "v1" };
    const repos = { schedule: { load: jest.fn(async () => schedule) } };
    const controller = makeController({ churchId: "c1" }, repos);

    expect(await controller.get("s1", asRequest(), noResponse)).toEqual(schedule);
  });

  it("404s for a missing schedule", async () => {
    const repos = { schedule: { load: jest.fn(async () => undefined) } };
    const controller = makeController({ churchId: "c1" }, repos);

    const res = await controller.get("nope", asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(404);
  });
});

describe("ScheduleController.save", () => {
  it("stamps churchId from the auth context", async () => {
    const saved: Schedule[] = [];
    const repos = {
      schedule: { save: jest.fn(async (s: Schedule) => { saved.push(s); return s; }) },
      classroom: { load: jest.fn(async (id: string) => ({ id, churchId: "c1" })) }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    await controller.save(asRequest({ body: [{ churchId: "SPOOFED", classroomId: "cl1", venueId: "v1" }] }), noResponse);

    expect(saved[0].churchId).toBe("c1");
  });

  it("rejects without schedules-edit permission", async () => {
    const repos = { schedule: { save: jest.fn() } };
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await controller.save(asRequest({ body: [{}] }), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(repos.schedule.save).not.toHaveBeenCalled();
  });
});
