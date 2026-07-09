import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
    denyAccess(errors: string[]) { return { errors, status: 401 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value) }
}));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));

import { SectionController } from "../SectionController";

function makeController(au: any, repos: any) {
  const controller = new SectionController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

describe("SectionController.copy", () => {
  const baseRepos = () => ({
    section: { load: jest.fn(), save: jest.fn(async (s: any) => ({ ...s, id: "new" })) },
    venue: { load: jest.fn() },
    role: { loadByLessonId: jest.fn(async () => []) },
    action: { loadByLessonId: jest.fn(async () => []) }
  });

  it("rejects users without lessons-edit permission", async () => {
    const repos = baseRepos();
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await (controller as any).copy("s1", "v1", {}, {});

    expect(res.status).toBe(401);
    expect(repos.section.save).not.toHaveBeenCalled();
  });

  it("denies copying another church's section", async () => {
    const repos = baseRepos();
    repos.section.load.mockResolvedValue({ id: "s1", churchId: "OTHER", lessonId: "l1" });
    repos.venue.load.mockResolvedValue({ id: "v1", churchId: "c1", lessonId: "l2" });
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await (controller as any).copy("s1", "v1", {}, {});

    expect(res.status).toBe(401);
    expect(repos.section.save).not.toHaveBeenCalled();
  });

  it("copies a same-church section into the destination venue", async () => {
    const repos = baseRepos();
    repos.section.load.mockResolvedValue({ id: "s1", churchId: "c1", lessonId: "l1" });
    repos.venue.load.mockResolvedValue({ id: "v1", churchId: "c1", lessonId: "l2" });
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await (controller as any).copy("s1", "v1", {}, {});

    expect(res).toEqual([]);
    expect(repos.section.save).toHaveBeenCalledWith(expect.objectContaining({ venueId: "v1", lessonId: "l2", id: null }));
  });
});
