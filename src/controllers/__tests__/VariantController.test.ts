import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("../../helpers", () => ({
  __esModule: true,
  FilesHelper: { deleteFile: jest.fn() },
  ZipHelper: { setBundlePendingResource: jest.fn(async () => {}) }
}));
jest.mock("../../helpers/TranscodeHelper", () => ({ TranscodeHelper: { createWebms: jest.fn(async () => {}) } }));

import { VariantController } from "../VariantController";
import { TranscodeHelper } from "../../helpers/TranscodeHelper";

function makeController(au: any, repos: any) {
  const controller = new VariantController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

describe("VariantController.createWebms", () => {
  it("rejects users without lessons-edit permission", async () => {
    const repos = { resource: { loadNeedingWebm: jest.fn() } };
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await (controller as any).createWebms({}, {});

    expect(res.status).toBe(401);
    expect(repos.resource.loadNeedingWebm).not.toHaveBeenCalled();
  });
});

describe("VariantController.save", () => {
  it("stamps churchId and awaits transcoding for each variant", async () => {
    const repos = { variant: { save: jest.fn(async (v: any) => v) } };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const body = [{ churchId: "SPOOFED", resourceId: "r1" }];
    const result = await (controller as any).save({ body }, {});

    expect(result[0].churchId).toBe("c1");
    expect(TranscodeHelper.createWebms).toHaveBeenCalledWith("r1");
  });
});
