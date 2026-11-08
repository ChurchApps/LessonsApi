const axiosGet = jest.fn();
const save = jest.fn(async (ev: any) => ev);
jest.mock("axios", () => ({ __esModule: true, default: { get: (...a: any[]) => axiosGet(...a) } }));
jest.mock("../Environment", () => ({ Environment: { vimeoToken: "token" } }));
jest.mock("../../repositories", () => ({ Repositories: { getCurrent: () => ({ externalVideo: { save } }) } }));

import { VimeoHelper } from "../VimeoHelper";

const vimeoResponse = (download: any[]) => ({ data: { duration: 60, download, files: [], pictures: { sizes: [] } } });
const soon = "2026-11-02T10:00:00+00:00";
const later = "2026-11-02T12:00:00+00:00";

describe("VimeoHelper.getVideoDetails", () => {
  const before = Date.now();

  it("uses the 720p expiry when 720p is the only link we keep", async () => {
    axiosGet.mockResolvedValue(vimeoResponse([{ rendition: "720p", link: "l720", expires: later }]));
    const details = await VimeoHelper.getVideoDetails("v1");
    expect(details.downloadsExpire).toEqual(new Date(later));
    expect(details.download720p).toBe("l720");
  });

  it("uses the 1080p expiry for a video with no 720p, so its links are not refreshed on every request", async () => {
    axiosGet.mockResolvedValue(vimeoResponse([{ rendition: "1080p", link: "l1080", expires: later }]));
    const details = await VimeoHelper.getVideoDetails("v1");
    expect(details.downloadsExpire).toEqual(new Date(later));
  });

  it("uses the earliest expiry of the links we keep and ignores renditions we do not store", async () => {
    axiosGet.mockResolvedValue(vimeoResponse([
      { rendition: "source", link: "s", expires: "2026-11-02T01:00:00+00:00" },
      { rendition: "720p", link: "l720", expires: later },
      { rendition: "1080p", link: "l1080", expires: soon }
    ]));
    const details = await VimeoHelper.getVideoDetails("v1");
    expect(details.downloadsExpire).toEqual(new Date(soon));
  });

  it("stays expired when Vimeo offers no link we keep, so the next request tries again", async () => {
    for (const download of [[], [{ rendition: "540p", link: "l", expires: later }]]) {
      axiosGet.mockResolvedValue(vimeoResponse(download));
      const details = await VimeoHelper.getVideoDetails("v1");
      expect(details.downloadsExpire.getTime()).toBeGreaterThanOrEqual(before);
      expect(details.downloadsExpire.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});

describe("VimeoHelper.updateVimeoLinks", () => {
  it("logs one refresh line with only the video id and minutes until the links expire", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const expires = new Date(Date.now() + 90 * 60000).toISOString();
    axiosGet.mockResolvedValue(vimeoResponse([{ rendition: "1080p", link: "https://secret.example/l", expires }]));

    await VimeoHelper.updateVimeoLinks({ id: "ev1", videoId: "v1" } as any);

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toMatch(/^VIMEO_REFRESH ev1 (89|90)m$/);
    log.mockRestore();
  });
});
