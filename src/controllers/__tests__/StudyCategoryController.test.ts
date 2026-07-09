import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));

import { StudyCategoryController } from "../StudyCategoryController";

function makeController(au: any, repos: any) {
  const controller = new StudyCategoryController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

describe("StudyCategoryController.save", () => {
  it("404s when the program belongs to another church", async () => {
    const repos = {
      program: { load: jest.fn(async () => undefined) },
      studyCategory: { save: jest.fn(), loadByCategoryName: jest.fn(async () => []) }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const res = await (controller as any).save({ body: [{ programId: "pOther", categoryName: "Kids" }] }, {});

    expect(repos.program.load).toHaveBeenCalledWith("c1", "pOther");
    expect(res.status).toBe(404);
    expect(repos.studyCategory.save).not.toHaveBeenCalled();
  });

  it("saves and resorts categories for an owned program", async () => {
    const saved: any[] = [];
    const repos = {
      program: { load: jest.fn(async () => ({ id: "p1", churchId: "c1" })) },
      studyCategory: {
        save: jest.fn(async (sc: any) => { saved.push({ ...sc }); return sc; }),
        loadByCategoryName: jest.fn(async () => [{ id: "a", sort: 5 }, { id: "b", sort: 9 }])
      }
    };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    await (controller as any).save({ body: [{ programId: "p1", categoryName: "Kids" }] }, {});

    const resorted = saved.slice(1);
    expect(resorted.map(sc => sc.sort)).toEqual([0, 1]);
  });
});
