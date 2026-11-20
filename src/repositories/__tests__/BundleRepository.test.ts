jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "bundle_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { BundleRepository } from "../BundleRepository";

const mockedGetDb = getDb as jest.Mock;

// The slice of Kysely's query builder these mocks stand in for.
interface QueryChain {
  where?: (...args: unknown[]) => QueryChain;
  selectAll?: () => QueryChain;
  select?: () => QueryChain;
  orderBy?: () => QueryChain;
  limit?: () => QueryChain;
  unionAll?: () => QueryChain;
  execute?: () => Promise<unknown>;
}

const pendingChain = (wheres: unknown[][]) => {
  const chain: QueryChain = {
    selectAll: () => chain,
    where: (...args: unknown[]) => { wheres.push(args); return chain; },
    limit: () => chain,
    execute: () => Promise.resolve([])
  };
  return chain;
};

describe("BundleRepository.loadPendingUpdate", () => {
  it("filters by churchId when provided", async () => {
    const wheres: unknown[][] = [];
    mockedGetDb.mockReturnValue({ selectFrom: () => pendingChain(wheres) });

    await new BundleRepository().loadPendingUpdate(5, "c1");

    expect(wheres).toContainEqual(["pendingUpdate", "=", true]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });

  it("loads all churches when churchId is omitted", async () => {
    const wheres: unknown[][] = [];
    mockedGetDb.mockReturnValue({ selectFrom: () => pendingChain(wheres) });

    await new BundleRepository().loadPendingUpdate(5);

    expect(wheres).toContainEqual(["pendingUpdate", "=", true]);
    expect(wheres.some((w: unknown[]) => w[0] === "churchId")).toBe(false);
  });
});
