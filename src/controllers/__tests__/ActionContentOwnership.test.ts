import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({ __esModule: true, ArrayHelper: {} }));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { ActionController } from "../ActionController";
import { Action } from "../../models";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper } from "./controllerTestUtils";

const au = { churchId: "c1", checkAccess: () => true };

// c1 owns role r1, lesson l1, resource res1, asset as1 and external video ev1; ids ending in "Other" belong to c2.
function makeRepos() {
  const owned = (id: string) => jest.fn(async (churchId: string, x: string) => (churchId === "c1" && x === id ? { id: x, churchId } : null));
  return {
    role: { load: jest.fn(async (id: string) => (id === "r1" ? { id, churchId: "c1" } : null)) },
    lesson: { load: owned("l1") },
    resource: { load: owned("res1") },
    asset: { load: owned("as1") },
    externalVideo: { load: owned("ev1") },
    action: { save: jest.fn(async (x: Action) => x) }
  };
}

function make(repos: RepoMocks) {
  const controller = new ActionController();
  setActionWrapper(controller, au);
  controller.repositories = asRepositories(repos);
  return controller;
}

const base = { roleId: "r1", lessonId: "l1", actionType: "Play" };
const cases: [string, Action, Action][] = [
  ["another church's resource", { resourceId: "resOther" }, { resourceId: "res1" }],
  ["another church's asset", { resourceId: "res1", assetId: "asOther" }, { resourceId: "res1", assetId: "as1" }],
  ["another church's external video", { externalVideoId: "evOther" }, { externalVideoId: "ev1" }]
];

describe("actions may only point at the caller's own content", () => {
  it.each(cases)("refuses an action that plays %s", async (_name, foreign) => {
    const repos = makeRepos();
    const res = await make(repos).save(asRequest({ body: [{ ...base, ...foreign }] }), noResponse) as JsonResult;
    expect(res.status).toBe(404);
    expect(repos.action.save).not.toHaveBeenCalled();
  });

  it.each(cases)("still saves when %s is replaced by an owned one", async (_name, _foreign, owned) => {
    const repos = makeRepos();
    await make(repos).save(asRequest({ body: [{ ...base, ...owned }] }), noResponse);
    expect(repos.action.save).toHaveBeenCalledWith(expect.objectContaining({ ...owned, churchId: "c1" }));
  });

  it("leaves add-on ids alone, since add-ons are a shared catalog", async () => {
    const repos = makeRepos();
    await make(repos).save(asRequest({ body: [{ ...base, actionType: "Add-on", addOnId: "addOnFromAnotherChurch" }] }), noResponse);
    expect(repos.action.save).toHaveBeenCalled();
  });
});
