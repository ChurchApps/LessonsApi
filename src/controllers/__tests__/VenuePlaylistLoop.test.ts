import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: {
    getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value),
    getOne: (items: any[], key: string, value: any) => items.find(i => i[key] === value)
  }
}));
jest.mock("../../helpers", () => ({ __esModule: true, Environment: { contentRoot: "" }, DurationHelper: {} }));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));
jest.mock("../../helpers/LibraryHelper", () => ({ LibraryHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: {} }));
jest.mock("../../helpers/PlaylistHelper", () => ({
  PlaylistHelper: {
    loadPlaylistFiles: jest.fn(async () => []),
    loadPlaylistVideos: jest.fn(async () => [
      { id: "loop", name: "Title", videoProvider: "Vimeo", videoId: "1", play720: "https://x/title.mp4", seconds: 50, loopVideo: true },
      { id: "once", name: "Story", videoProvider: "Vimeo", videoId: "2", play720: "https://x/story.mp4", seconds: 300, loopVideo: false }
    ])
  }
}));

import { VenueController } from "../VenueController";

// #1430: browse mode advanced off a looping title clip after one pass because this feed sent its real length.
const playlistFiles = async (query: any) => {
  const controller: any = new VenueController();
  controller.actionWrapperAnon = (_req: any, _res: any, action: any) => action();
  controller.logDownload = jest.fn();
  controller.repositories = {
    venue: { loadPublic: async () => ({ id: "v1", churchId: "c1", lessonId: "l1", name: "Venue" }) },
    lesson: { loadPublic: async () => ({ id: "l1" }) },
    section: { loadForPlaylist: async () => [{ id: "s1", name: "Section" }] },
    action: { loadPlaylistActions: async () => [{ sectionId: "s1", externalVideoId: "loop" }, { sectionId: "s1", externalVideoId: "once" }] }
  };
  const req = { query, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
  return (await controller.getPlaylist("v1", req, {})).messages[0].files;
};

describe.each([["download", {}], ["web", { mode: "web" }]])("venue playlist external videos, %s mode", (_name, query) => {
  it("holds a looping video for an hour, like the classroom feed", async () => {
    const [loop] = await playlistFiles(query);
    expect(loop.seconds).toBe(3600);
    expect(loop.loopVideo).toBe(true);
  });

  it("keeps the real length of a video that does not loop", async () => {
    const [, once] = await playlistFiles(query);
    expect(once.seconds).toBe(300);
  });
});
