jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "bundle_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { BundleRepository } from "../BundleRepository";

const mockedGetDb = getDb as jest.Mock;

const pendingChain = (wheres: any[]) => {
  const chain: any = {
    selectAll: () => chain,
    where: (...args: any[]) => { wheres.push(args); return chain; },
    limit: () => chain,
    execute: () => Promise.resolve([])
  };
  return chain;
};

describe("BundleRepository.loadPendingUpdate", () => {
  it("filters by churchId when provided", async () => {
    const wheres: any[] = [];
    mockedGetDb.mockReturnValue({ selectFrom: () => pendingChain(wheres) });

    await new BundleRepository().loadPendingUpdate(5, "c1");

    expect(wheres).toContainEqual(["pendingUpdate", "=", true]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });

  it("loads all churches when churchId is omitted", async () => {
    const wheres: any[] = [];
    mockedGetDb.mockReturnValue({ selectFrom: () => pendingChain(wheres) });

    await new BundleRepository().loadPendingUpdate(5);

    expect(wheres).toContainEqual(["pendingUpdate", "=", true]);
    expect(wheres.some((w: any[]) => w[0] === "churchId")).toBe(false);
  });
});
