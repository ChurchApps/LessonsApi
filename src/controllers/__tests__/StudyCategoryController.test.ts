import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));

import { StudyCategoryController } from "../StudyCategoryController";
import { StudyCategory } from "../../models";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper, TestUser } from "./controllerTestUtils";

function makeController(au: TestUser, repos: RepoMocks) {
  const controller = new StudyCategoryController();
  setActionWrapper(controller, au);
  controller.repositories = asRepositories(repos);
  return controller;
}

describe("StudyCategoryController.save", () => {
  it("404s when the program belongs to another church", async () => {
    const repos = {
      program: { load: jest.fn(async () => undefined) },
      studyCategory: { save: jest.fn(), loadByCategoryName: jest.fn(async () => []) }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.save(asRequest({ body: [{ programId: "pOther", categoryName: "Kids" }] }), noResponse) as JsonResult;

    expect(repos.program.load).toHaveBeenCalledWith("c1", "pOther");
    expect(res.status).toBe(404);
    expect(repos.studyCategory.save).not.toHaveBeenCalled();
  });

  it("saves and resorts categories for an owned program", async () => {
    const saved: StudyCategory[] = [];
    const repos = {
      program: { load: jest.fn(async () => ({ id: "p1", churchId: "c1" })) },
      studyCategory: {
        save: jest.fn(async (sc: StudyCategory) => { saved.push({ ...sc }); return sc; }),
        loadByCategoryName: jest.fn(async () => [{ id: "a", sort: 5 }, { id: "b", sort: 9 }])
      }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    await controller.save(asRequest({ body: [{ programId: "p1", categoryName: "Kids" }] }), noResponse);

    const resorted = saved.slice(1);
    expect(resorted.map(sc => sc.sort)).toEqual([0, 1]);
  });
});

describe("StudyCategoryController ownership", () => {
  const ownedProgram = jest.fn(async (churchId: string, id: string) => (churchId === "c1" && id === "p1" ? { id: "p1", churchId: "c1" } : undefined));

  it("refuses to update a category that sits in another church's program", async () => {
    const repos = {
      program: { load: ownedProgram },
      study: { load: jest.fn(async () => ({ id: "s1", churchId: "c1" })) },
      studyCategory: {
        load: jest.fn(async () => ({ id: "scOther", programId: "pOther", categoryName: "Adults" })),
        save: jest.fn(),
        loadByCategoryName: jest.fn(async () => [])
      }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.save(asRequest({ body: [{ id: "scOther", programId: "p1", categoryName: "Kids" }] }), noResponse) as JsonResult;

    expect(res.status).toBe(404);
    expect(repos.studyCategory.save).not.toHaveBeenCalled();
  });

  it("refuses to file another church's study under a category", async () => {
    const repos = {
      program: { load: ownedProgram },
      study: { load: jest.fn(async () => undefined) },
      studyCategory: { load: jest.fn(), save: jest.fn(), loadByCategoryName: jest.fn(async () => []) }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.save(asRequest({ body: [{ programId: "p1", studyId: "sOther", categoryName: "Kids" }] }), noResponse) as JsonResult;

    expect(repos.study.load).toHaveBeenCalledWith("c1", "sOther");
    expect(res.status).toBe(404);
    expect(repos.studyCategory.save).not.toHaveBeenCalled();
  });

  it("updates a category in the caller's own program", async () => {
    const repos = {
      program: { load: ownedProgram },
      study: { load: jest.fn(async () => ({ id: "s1", churchId: "c1" })) },
      studyCategory: {
        load: jest.fn(async () => ({ id: "sc1", programId: "p1", categoryName: "Kids" })),
        save: jest.fn(async (sc: StudyCategory) => sc),
        loadByCategoryName: jest.fn(async () => [])
      }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.save(asRequest({ body: [{ id: "sc1", programId: "p1", studyId: "s1", categoryName: "Kids" }] }), noResponse) as JsonResult;

    expect(res.status).toBeUndefined();
    expect(repos.studyCategory.save).toHaveBeenCalledTimes(1);
  });

  it("refuses to delete a category in another church's program", async () => {
    const repos = {
      program: { load: ownedProgram },
      studyCategory: { load: jest.fn(async () => ({ id: "scOther", programId: "pOther" })), delete: jest.fn() }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await controller.delete("scOther", asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(404);
    expect(repos.studyCategory.delete).not.toHaveBeenCalled();
  });

  it("deletes a category in the caller's own program", async () => {
    const repos = {
      program: { load: ownedProgram },
      studyCategory: { load: jest.fn(async () => ({ id: "sc1", programId: "p1" })), delete: jest.fn(async () => ({})) }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    await controller.delete("sc1", asRequest(), noResponse);

    expect(repos.studyCategory.delete).toHaveBeenCalledWith("c1", "sc1");
  });
});
