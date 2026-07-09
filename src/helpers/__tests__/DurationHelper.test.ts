jest.mock("../../repositories", () => ({ Repositories: {} }));

import { DurationHelper } from "../DurationHelper";
import { Action, ExternalVideo, Asset, File } from "../../models";

const action = (overrides: Partial<Action>): Action => ({ ...overrides });

describe("DurationHelper.calculateSeconds", () => {
  it("uses the external video length for Play actions", () => {
    const videos: ExternalVideo[] = [{ id: "v1", seconds: 95 } as ExternalVideo];
    expect(DurationHelper.calculateSeconds(action({ actionType: "Play", externalVideoId: "v1" }), videos, [], [])).toBe(95);
  });

  it("returns 10 seconds for image assets", () => {
    const assets = [{ id: "a1", fileId: "f1" } as Asset];
    const files = [{ id: "f1", fileType: "image/png" } as File];
    expect(DurationHelper.calculateSeconds(action({ actionType: "Play", assetId: "a1" }), [], assets, files)).toBe(10);
  });

  it("uses file seconds for non-image assets", () => {
    const assets = [{ id: "a1", fileId: "f1" } as Asset];
    const files = [{ id: "f1", fileType: "video/mp4", seconds: 42 } as File];
    expect(DurationHelper.calculateSeconds(action({ assetId: "a1" }), [], assets, files)).toBe(42);
  });

  it("estimates Say actions at 120 words per minute", () => {
    const content = Array(240).fill("word").join(" ");
    expect(DurationHelper.calculateSeconds(action({ actionType: "Say", content }), [], [], [])).toBe(120);
  });

  it("returns 60 for Do actions and 0 when nothing matches", () => {
    expect(DurationHelper.calculateSeconds(action({ actionType: "Do" }), [], [], [])).toBe(60);
    expect(DurationHelper.calculateSeconds(action({ actionType: "Play" }), [], [], [])).toBe(0);
  });
});

describe("DurationHelper.calculateSectionSeconds", () => {
  it("sums the durations of all actions", () => {
    const actions = [action({ actionType: "Do" }), action({ actionType: "Do" })];
    expect(DurationHelper.calculateSectionSeconds(actions, [], [], [])).toBe(120);
  });
});
