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

import { FileStorageHelper } from "@churchapps/apihelper";
import { FileController } from "../FileController";

function makeController(au: any) {
  const controller = new FileController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  return controller;
}

describe("FileController.getCleanup", () => {
  beforeEach(() => {
    (FileStorageHelper.list as jest.Mock).mockReset().mockResolvedValue([]);
    (FileStorageHelper.remove as jest.Mock).mockReset();
  });

  it("rejects users without lessons-edit permission", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => false });
    (controller as any).repositories = { file: { cleanUp: jest.fn(), loadForChurch: jest.fn() } };

    const res = await (controller as any).getCleanup({}, {});

    expect(res.status).toBe(401);
    expect((controller as any).repositories.file.cleanUp).not.toHaveBeenCalled();
    expect((controller as any).repositories.file.loadForChurch).not.toHaveBeenCalled();
  });

  it("awaits cleanUp and removes orphans for permitted users", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const cleanUp = jest.fn(async () => {});
    const loadForChurch = jest.fn(async () => []);
    (controller as any).repositories = { file: { cleanUp, loadForChurch } };

    const res = await (controller as any).getCleanup({}, {});

    expect(cleanUp).toHaveBeenCalledWith("c1");
    expect(res.paths).toEqual([]);
  });

  it("does not clean another church's files or storage objects", async () => {
    (FileStorageHelper.list as jest.Mock).mockImplementation(async (prefix: string) => {
      if (prefix === "files/") return ["files/other/secret.pdf", "files/lesson/abc/keep.pdf", "files/lesson/abc/orphan.pdf"];
      if (prefix === "files/lesson/abc/") return ["files/lesson/abc/keep.pdf", "files/lesson/abc/orphan.pdf"];
      return [];
    });

    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const cleanUp = jest.fn(async () => {});
    const loadAll = jest.fn(async () => { throw new Error("must not load all churches"); });
    const ownFiles = [{ id: "f1", churchId: "c1", contentPath: "https://cdn/content/files/lesson/abc/keep.pdf" }];
    const loadForChurch = jest.fn(async (churchId: string) => {
      expect(churchId).toBe("c1");
      return ownFiles;
    });
    (controller as any).repositories = { file: { cleanUp, loadForChurch, loadAll } };

    const res = await (controller as any).getCleanup({}, {});

    expect(cleanUp).toHaveBeenCalledWith("c1");
    expect(cleanUp).toHaveBeenCalledTimes(1);
    expect(loadAll).not.toHaveBeenCalled();
    expect(FileStorageHelper.list).not.toHaveBeenCalledWith("files/");
    expect(FileStorageHelper.remove).not.toHaveBeenCalledWith("files/other/secret.pdf");
    expect(FileStorageHelper.remove).toHaveBeenCalledWith("files/lesson/abc/orphan.pdf");
    expect(res.paths).toEqual(["files/lesson/abc/orphan.pdf"]);
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
