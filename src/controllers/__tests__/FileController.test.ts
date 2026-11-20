import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
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
import { File } from "../../models";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper, TestUser } from "./controllerTestUtils";

// getCleanup answers 401 through json() or with the removed storage paths.
type CleanupResult = Partial<JsonResult> & { paths?: string[] };

function makeController(au: TestUser) {
  const controller = new FileController();
  setActionWrapper(controller, au);
  return controller;
}

describe("FileController.getCleanup", () => {
  beforeEach(() => {
    (FileStorageHelper.list as jest.Mock).mockReset().mockResolvedValue([]);
    (FileStorageHelper.remove as jest.Mock).mockReset();
  });

  it("rejects users without lessons-edit permission", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => false });
    const fileRepo = { cleanUp: jest.fn(), loadForChurch: jest.fn() };
    controller.repositories = asRepositories({ file: fileRepo });

    const res = await controller.getCleanup(asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(fileRepo.cleanUp).not.toHaveBeenCalled();
    expect(fileRepo.loadForChurch).not.toHaveBeenCalled();
  });

  it("awaits cleanUp and removes orphans for permitted users", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const cleanUp = jest.fn(async () => {});
    const loadForChurch = jest.fn(async () => []);
    controller.repositories = asRepositories({ file: { cleanUp, loadForChurch } });

    const res = await controller.getCleanup(asRequest(), noResponse) as CleanupResult;

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
    controller.repositories = asRepositories({ file: { cleanUp, loadForChurch, loadAll }, lesson: { load: lessonLoad } });

    const res = await controller.getCleanup(asRequest(), noResponse) as CleanupResult;

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
  const repos = (extra: RepoMocks = {}) => asRepositories({
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
    controller.repositories = repos({ file: { cleanUp: jest.fn(), loadForChurch: jest.fn(async () => ownFiles) } });

    const res = await controller.getCleanup(asRequest(), noResponse) as CleanupResult;

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
    controller.repositories = repos({ file: { cleanUp: jest.fn(), loadForChurch: jest.fn(async () => ownFiles) } });

    const res = await controller.getCleanup(asRequest(), noResponse) as CleanupResult;

    expect(res.paths).toEqual(["files/lesson/l1/r1/orphan.mp4"]);
  });

  it("refuses to save a file into another church's add-on folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const save = jest.fn(async (f: File) => f);
    controller.repositories = repos({ file: { save } });

    const res = await controller.save(asRequest({ body: [{ contentType: "addOn", contentId: "victimAddOn", fileName: "x.png", fileType: "image/png", fileContents: "data:image/png;base64,AAAA" }] }), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(FileStorageHelper.store).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("saves a file into the church's own add-on folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const save = jest.fn(async (f: File) => f);
    controller.repositories = repos({ file: { save } });

    const res = await controller.save(asRequest({ body: [{ contentType: "addOn", contentId: "ownAddOn", fileName: "x.png", fileType: "image/png", fileContents: "data:image/png;base64,AAAA" }] }), noResponse) as File[];

    expect(FileStorageHelper.store).toHaveBeenCalledWith("/files/addOn/ownAddOn/x.png", "image/png", expect.any(Buffer));
    expect(res[0].churchId).toBe("c1");
  });

  it("replacing a file only removes the old object from the folder being saved to", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const existing = { id: "f1", churchId: "c1", contentPath: "https://cdn/content/files/addOn/victimAddOn/logo.png?dt=1" };
    controller.repositories = repos({ file: { save: jest.fn(async (f: File) => f), load: jest.fn(async () => existing) } });

    await controller.save(asRequest({ body: [{ id: "f1", contentType: "addOn", contentId: "ownAddOn", fileName: "new.png", fileType: "image/png", fileContents: "data:image/png;base64,AAAA" }] }), noResponse);

    expect(FileStorageHelper.remove).not.toHaveBeenCalled();
    expect(FileStorageHelper.store).toHaveBeenCalledWith("/files/addOn/ownAddOn/new.png", "image/png", expect.any(Buffer));
  });

  it("replacing a file removes the church's old object in the same folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const existing = { id: "f1", churchId: "c1", contentPath: "https://cdn/content/files/addOn/ownAddOn/old.png?dt=1" };
    controller.repositories = repos({ file: { save: jest.fn(async (f: File) => f), load: jest.fn(async () => existing) } });

    await controller.save(asRequest({ body: [{ id: "f1", contentType: "addOn", contentId: "ownAddOn", fileName: "new.png", fileType: "image/png", fileContents: "data:image/png;base64,AAAA" }] }), noResponse);

    expect(FileStorageHelper.remove).toHaveBeenCalledWith("/files/addOn/ownAddOn/old.png");
  });

  it("refuses an upload url for another church's add-on folder", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    controller.repositories = repos();

    const res = await controller.getUploadUrManual("addOn", "victimAddOn", asRequest({ body: { fileName: "x.png" } }), noResponse) as JsonResult;

    expect(res.status).toBe(401);
    expect(AwsHelper.S3PresignedUrl).not.toHaveBeenCalled();
  });
});

describe("FileController.getAll", () => {
  it("only returns the caller's church files", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true });
    const loadForChurch = jest.fn(async () => [{ id: "f1" }]);
    controller.repositories = asRepositories({ file: { loadForChurch } });

    const result = await controller.getAll(asRequest(), noResponse);

    expect(loadForChurch).toHaveBeenCalledWith("c1");
    expect(result).toEqual([{ id: "f1" }]);
  });
});
