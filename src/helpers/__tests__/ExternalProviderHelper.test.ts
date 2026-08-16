jest.mock("../../repositories", () => ({ Repositories: { getCurrent: jest.fn() } }));
jest.mock("../ProviderUrlHelper", () => ({
  fetchProviderJson: jest.fn(),
  providerHostname: (url: string) => new URL(url).hostname
}));

import { ExternalProviderHelper } from "../ExternalProviderHelper";
import { Repositories } from "../../repositories";
import { fetchProviderJson } from "../ProviderUrlHelper";

const fetchJson = fetchProviderJson as jest.Mock;

const tree = {
  programs: [{
    id: "p1",
    studies: [{
      id: "s1",
      lessons: [{
        id: "l1",
        venues: [{ id: "v1", name: "Kids", apiUrl: "https://api.lessons.church/venues/public/feed/v1" }]
      }]
    }]
  }]
};

describe("ExternalProviderHelper.loadExternalData", () => {
  beforeEach(() => {
    fetchJson.mockReset();
    (Repositories.getCurrent as jest.Mock).mockReturnValue({
      externalProvider: { loadPublic: jest.fn(async () => ({ id: "ep1", apiUrl: "https://api.lessons.church/lessons/public/tree" })) }
    });
  });

  it("loads the tree then the venue feed on the provider host", async () => {
    fetchJson.mockResolvedValueOnce(tree).mockResolvedValueOnce({ lessonName: "Creation" });
    const result = await ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1");
    expect(result.lessonName).toBe("Creation");
    expect(fetchJson).toHaveBeenNthCalledWith(1, "https://api.lessons.church/lessons/public/tree");
    expect(fetchJson).toHaveBeenNthCalledWith(2, "https://api.lessons.church/venues/public/feed/v1", ["api.lessons.church"]);
  });

  it("does not fetch a venue URL when the tree request is rejected", async () => {
    fetchJson.mockRejectedValueOnce(new Error("Provider URL host is not allowed"));
    await expect(ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1")).rejects.toThrow("not allowed");
    expect(fetchJson).toHaveBeenCalledTimes(1);
  });
});
