import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  AwsHelper: { S3PresignedUrl: jest.fn(async () => ({ url: "presigned" })) },
  FileStorageHelper: { list: jest.fn(async () => []), remove: jest.fn(), store: jest.fn() }
}));
jest.mock("../../helpers", () => ({ __esModule: true, Environment: { fileStore: "disk", contentRoot: "" } }));

import { AwsHelper, FileStorageHelper } from "@churchapps/apihelper";
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
    const lessonLoad = jest.fn(async (churchId: string, id: string) => (churchId === "c1" && id === "abc" ? { id: "abc", churchId: "c1" } : undefined));
    (controller as any).repositories = { file: { cleanUp, loadForChurch, loadAll }, lesson: { load: lessonLoad } };

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

describe("FileController content ownership", () => {
  const otherChurchAddOn = { id: "victimAddOn", churchId: "c2" };
  const ownAddOn = { id: "ownAddOn", churchId: "c1" };
  const repos = (extra: any = {}) => ({
    addOn: { load: jest.fn(async (id: string) => [otherChurchAddOn, ownAddOn].find((a) => a.id === id)) },
    lesson: { load: jest.fn(async () => undefined) },
    study: { load: jest.fn(async () => undefined) },
    program: { load: jest.fn(async () => undefined) },
    ...extra
  });

  beforeEach(() => {
    (FileStorageHelper.list as jest.Mock).mockReset().mockResolvedValue([]);
    (FileStorageHelper.remove as jest.Mock).mockReset();
    (FileStorageHelper.store as jest.Mock).mockReset();
    (AwsHelper.S3PresignedUrl as jest.Mock).mockClear();
  });

  it("cleanup never lists or removes storage under content owned by another church", async () => {
    (FileStorageHelper.list as jest.Mock).mockImplementation(async (prefix: string) => {
      if (prefix === "files/addOn/victimAddOn/") return ["files/addOn/victimAddOn/x.png", "files/addOn/victimAddOn/res1/video.mp4"];
      return [];
    });
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const ownFiles = [{ id: "f1", churchId: "c1", contentPath: "https://cdn/content/files/addOn/victimAddOn/x.png" }];
    (controller as any).repositories = repos({ file: { cleanUp: jest.fn(), loadForChurch: jest.fn(async () => ownFiles) } });

    const res = await (controller as any).getCleanup({}, {});

    expect(FileStorageHelper.list).not.toHaveBeenCalledWith("files/addOn/victimAddOn/");
    expect(FileStorageHelper.remove).not.toHaveBeenCalled();
    expect(res.paths).toEqual([]);
  });

  it("cleanup still removes orphans under a resource folder the church uploaded to", async () => {
    (FileStorageHelper.list as jest.Mock).mockImplementation(async (prefix: string) => {
      if (prefix === "files/lesson/l1/r1/") return ["files/lesson/l1/r1/keep.mp4", "files/lesson/l1/r1/orphan.mp4"];
      return [];
    });
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const ownFiles = [{ id: "f1", churchId: "c1", contentPath: "https://cdn/content/files/lesson/l1/r1/keep.mp4" }];
    (controller as any).repositories = repos({ file: { cleanUp: jest.fn(), loadForChurch: jest.fn(async () => ownFiles) } });

    const res = await (controller as any).getCleanup({}, {});

    expect(res.paths).toEqual(["files/lesson/l1/r1/orphan.mp4"]);
  });

  it("refuses to save a file into another church's add-on folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const save = jest.fn(async (f: any) => f);
    (controller as any).repositories = repos({ file: { save } });

    const res = await (controller as any).save({ body: [{ contentType: "addOn", contentId: "victimAddOn", fileName: "x.png", fileType: "image/png", fileContents: "data:image/png;base64,AAAA" }] }, {});

    expect(res.status).toBe(401);
    expect(FileStorageHelper.store).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("saves a file into the church's own add-on folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const save = jest.fn(async (f: any) => f);
    (controller as any).repositories = repos({ file: { save } });

    const res = await (controller as any).save({ body: [{ contentType: "addOn", contentId: "ownAddOn", fileName: "x.png", fileType: "image/png", fileContents: "data:image/png;base64,AAAA" }] }, {});

    expect(FileStorageHelper.store).toHaveBeenCalledWith("/files/addOn/ownAddOn/x.png", "image/png", expect.any(Buffer));
    expect(res[0].churchId).toBe("c1");
  });

  it("refuses an upload url for another church's add-on folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    (controller as any).repositories = repos();

    const res = await (controller as any).getUploadUrManual("addOn", "victimAddOn", { body: { fileName: "x.png" } }, {});

    expect(res.status).toBe(401);
    expect(AwsHelper.S3PresignedUrl).not.toHaveBeenCalled();
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
