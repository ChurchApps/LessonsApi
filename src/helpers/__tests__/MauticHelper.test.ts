jest.mock("../../repositories", () => ({ Repositories: {} }));
jest.mock("../Environment", () => ({ Environment: {} }));

import { MauticHelper } from "../MauticHelper";

const working = {
  ark: "ark_last_download",
  "next-level": "next_level_last_download",
  "west-ridge": "west_ridge_last_download",
  "faith-kidz": "faith_kidz_last_download"
};

const overLength = ["high-voltage", "ark-preschool", "forministryresources", "following-jesus-together"];

describe("MauticHelper.fieldAlias", () => {
  it("leaves already-working aliases unchanged", () => {
    Object.entries(working).forEach(([slug, alias]) => expect(MauticHelper.fieldAlias(slug)).toBe(alias));
  });

  it("keeps long slugs within Mautic's 25-char alias limit", () => {
    overLength.forEach((slug) => expect(MauticHelper.fieldAlias(slug).length).toBeLessThanOrEqual(25));
  });

  it("produces a distinct alias per program", () => {
    const slugs = [...Object.keys(working), ...overLength];
    expect(new Set(slugs.map(MauticHelper.fieldAlias)).size).toBe(slugs.length);
  });
});
