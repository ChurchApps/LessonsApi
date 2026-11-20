import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
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
import { Variant } from "../../models";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper, TestUser } from "./controllerTestUtils";

function makeController(au: TestUser, repos: RepoMocks) {
  const controller = new VariantController();
  setActionWrapper(controller, au);
  controller.repositories = asRepositories(repos);
  return controller;
}

describe("VariantController.createWebms", () => {
  it("rejects users without lessons-edit permission", async () => {
    const repos = { resource: { loadNeedingWebm: jest.fn() } };
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, repos);

    const res = await controller.createWebms(asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(repos.resource.loadNeedingWebm).not.toHaveBeenCalled();
  });
});

describe("VariantController.save", () => {
  it("stamps churchId and awaits transcoding for each variant", async () => {
    const repos = { variant: { save: jest.fn(async (v: Variant) => v) }, resource: { load: jest.fn(async (churchId: string, id: string) => ({ id, churchId })) } };
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, repos);

    const body = [{ churchId: "SPOOFED", resourceId: "r1" }];
    const result = await controller.save(asRequest({ body }), noResponse) as Variant[];

    expect(result[0].churchId).toBe("c1");
    expect(TranscodeHelper.createWebms).toHaveBeenCalledWith("r1");
  });
});
