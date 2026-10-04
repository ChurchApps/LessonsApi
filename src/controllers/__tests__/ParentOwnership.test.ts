import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: {},
  EnvironmentBase: class {},
  AwsHelper: {},
  FileStorageHelper: { store: jest.fn(async () => {}), remove: jest.fn(async () => {}) }
}));
jest.mock("../../helpers", () => ({ __esModule: true, Environment: { contentRoot: "" } }));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));
jest.mock("../../helpers/LibraryHelper", () => ({ LibraryHelper: {} }));
jest.mock("../../helpers/VimeoHelper", () => ({ VimeoHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { ActionController } from "../ActionController";
import { RoleController } from "../RoleController";
import { SectionController } from "../SectionController";
import { VenueController } from "../VenueController";

const au = { churchId: "c1", checkAccess: () => true };

// c1 owns lesson l1, venue v1, section s1, role r1; everything ending in "Other" belongs to c2.
function makeRepos() {
  const save = jest.fn(async (x: any) => x);
  return {
    lesson: { load: jest.fn(async (churchId: string, id: string) => (churchId === "c1" && id === "l1" ? { id, churchId } : undefined)) },
    venue: { load: jest.fn(async (churchId: string, id: string) => (churchId === "c1" && id === "v1" ? { id, churchId } : undefined)), save },
    section: { load: jest.fn(async (id: string) => (id === "s1" ? { id, churchId: "c1" } : id === "sOther" ? { id, churchId: "c2" } : undefined)), save },
    role: { load: jest.fn(async (id: string) => (id === "r1" ? { id, churchId: "c1" } : id === "rOther" ? { id, churchId: "c2" } : undefined)), save },
    action: { save }
  };
}

function make<T>(Ctor: new () => T, repos: any): any {
  const controller: any = new Ctor();
  controller.actionWrapper = (_req: any, _res: any, action: any) => action(au);
  controller.repositories = repos;
  return controller;
}

const cases: [string, any, string, any, any][] = [
  ["action under another church's role", ActionController, "action", { roleId: "rOther", lessonId: "l1" }, { roleId: "r1", lessonId: "l1" }],
  ["action under another church's lesson", ActionController, "action", { roleId: "r1", lessonId: "lOther" }, { roleId: "r1", lessonId: "l1" }],
  ["role under another church's section", RoleController, "role", { sectionId: "sOther", lessonId: "l1" }, { sectionId: "s1", lessonId: "l1" }],
  ["role under another church's lesson", RoleController, "role", { sectionId: "s1", lessonId: "lOther" }, { sectionId: "s1", lessonId: "l1" }],
  ["section under another church's venue", SectionController, "section", { venueId: "vOther", lessonId: "l1" }, { venueId: "v1", lessonId: "l1" }],
  ["section under another church's lesson", SectionController, "section", { venueId: "v1", lessonId: "lOther" }, { venueId: "v1", lessonId: "l1" }],
  ["venue under another church's lesson", VenueController, "venue", { lessonId: "lOther" }, { lessonId: "l1" }]
];

describe("lesson children must hang off the caller's own parents", () => {
  it.each(cases)("refuses a save of an %s", async (_name, Ctor, repoName, foreign) => {
    const repos = makeRepos();
    const res = await make(Ctor, repos).save({ body: [{ ...foreign }] }, {});
    expect(res.status).toBe(404);
    expect((repos as any)[repoName].save).not.toHaveBeenCalled();
  });

  it.each(cases)("still saves when the %s is replaced by an owned parent", async (_name, Ctor, repoName, _foreign, owned) => {
    const repos = makeRepos();
    await make(Ctor, repos).save({ body: [{ ...owned }] }, {});
    expect((repos as any)[repoName].save).toHaveBeenCalledWith(expect.objectContaining({ ...owned, churchId: "c1" }));
  });
});
