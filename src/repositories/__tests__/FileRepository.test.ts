jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "file_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { FileRepository } from "../FileRepository";

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

describe("FileRepository.cleanUp", () => {
  it("deletes unreferenced files only for the given churchId", async () => {
    const wheres: unknown[][] = [];
    const sub: QueryChain = { select: () => sub, where: () => sub, unionAll: () => sub };
    const chain: QueryChain = { where: (...args: unknown[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve([]) };
    mockedGetDb.mockReturnValue({ deleteFrom: () => chain, selectFrom: () => sub });

    await new FileRepository().cleanUp("c1");

    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
    expect(wheres.some((w: unknown[]) => w[0] === "id" && w[1] === "not in")).toBe(true);
  });
});
