import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
    denyAccess(errors: string[]) { return { errors, status: 401 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: Record<string, unknown>[], key: string, value: unknown) => items.filter(i => i[key] === value) }
}));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));

import { SectionController } from "../SectionController";
import { Section } from "../../models";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper, TestUser } from "./controllerTestUtils";

function makeController(au: TestUser, repos: RepoMocks) {
  const controller = new SectionController();
  setActionWrapper(controller, au);
  controller.repositories = asRepositories(repos);
  return controller;
}

describe("SectionController.copy", () => {
  const baseRepos = () => ({
    section: { load: jest.fn(), save: jest.fn(async (s: Section) => ({ ...s, id: "new" })) },
    venue: { load: jest.fn() },
    role: { loadByLessonId: jest.fn(async () => []) },
    action: { loadByLessonId: jest.fn(async () => []) }
  });

  it("rejects users without lessons-edit permission", async () => {
    const repos = baseRepos();
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await controller.copy("s1", "v1", asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(repos.section.save).not.toHaveBeenCalled();
  });

  it("denies copying another church's section", async () => {
    const repos = baseRepos();
    repos.section.load.mockResolvedValue({ id: "s1", churchId: "OTHER", lessonId: "l1" });
    repos.venue.load.mockResolvedValue({ id: "v1", churchId: "c1", lessonId: "l2" });
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.copy("s1", "v1", asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(repos.section.save).not.toHaveBeenCalled();
  });

  it("copies a same-church section into the destination venue", async () => {
    const repos = baseRepos();
    repos.section.load.mockResolvedValue({ id: "s1", churchId: "c1", lessonId: "l1" });
    repos.venue.load.mockResolvedValue({ id: "v1", churchId: "c1", lessonId: "l2" });
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.copy("s1", "v1", asRequest(), noResponse);

    expect(res).toEqual([]);
    expect(repos.section.save).toHaveBeenCalledWith(expect.objectContaining({ venueId: "v1", lessonId: "l2", id: null }));
  });
});
