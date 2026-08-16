import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
const queueLessonDownload = jest.fn(async () => {});
jest.mock("../../helpers", () => ({
  __esModule: true,
  Environment: { hubspotKey: "" },
  MauticHelper: { queueLessonDownload: (...args: any[]) => queueLessonDownload(...args) }
}));
jest.mock("../../helpers/HubspotHelper", () => ({
  HubspotHelper: { lookupCompanByChurchId: jest.fn(), setProperties: jest.fn() }
}));

import { DownloadController } from "../DownloadController";

function makeController(au: any, repos: any) {
  const controller = new DownloadController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

function req(body: any[]) {
  return { body, headers: {}, socket: { remoteAddress: "1.2.3.4" } };
}

describe("DownloadController.save", () => {
  beforeEach(() => queueLessonDownload.mockClear());

  it("ignores a body churchId for another tenant", async () => {
    const saved: any[] = [];
    const repos = { download: { save: jest.fn(async (d: any) => { saved.push({ ...d }); return d; }), getDownloadCount: jest.fn() } };
    const au = { churchId: "c1", id: "u1" };
    const controller = makeController(au, repos);

    await (controller as any).save(req([{ churchId: "OTHER", userId: "SPOOFED", lessonId: "l1" }]), {});

    expect(saved[0].churchId).toBe("c1");
    expect(saved[0].userId).toBe("u1");
    expect(queueLessonDownload).toHaveBeenCalledWith("c1", "l1", au);
    expect(queueLessonDownload).not.toHaveBeenCalledWith("OTHER", expect.anything(), expect.anything());
  });
});
