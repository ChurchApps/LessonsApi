import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  AwsHelper: { S3PresignedUrl: jest.fn() },
  FileStorageHelper: { list: jest.fn(async () => []), remove: jest.fn(), store: jest.fn() }
}));
jest.mock("../../helpers", () => ({ __esModule: true, Environment: { fileStore: "disk", contentRoot: "" } }));

import { FileController } from "../FileController";

function makeController(au: any) {
  const controller = new FileController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  return controller;
}

describe("FileController.getCleanup", () => {
  it("rejects users without lessons-edit permission", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => false });
    (controller as any).repositories = { file: { cleanUp: jest.fn() } };

    const res = await (controller as any).getCleanup({}, {});

    expect(res.status).toBe(401);
    expect((controller as any).repositories.file.cleanUp).not.toHaveBeenCalled();
  });

  it("awaits cleanUp and removes orphans for permitted users", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const cleanUp = jest.fn(async () => {});
    (controller as any).repositories = { file: { cleanUp, loadAll: jest.fn(async () => []) } };

    const res = await (controller as any).getCleanup({}, {});

    expect(cleanUp).toHaveBeenCalled();
    expect(res.paths).toEqual([]);
  });
});

describe("FileController.getAll", () => {
  it("only returns the caller's church files", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const loadForChurch = jest.fn(async () => [{ id: "f1" }]);
    (controller as any).repositories = { file: { loadForChurch } };

    const result = await (controller as any).getAll({}, {});

    expect(loadForChurch).toHaveBeenCalledWith("c1");
    expect(result).toEqual([{ id: "f1" }]);
  });
});
