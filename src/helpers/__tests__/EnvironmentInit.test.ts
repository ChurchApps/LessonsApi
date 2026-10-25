const readParameter = jest.fn();
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  AwsHelper: { readParameter: (...a: any[]) => readParameter(...a) },
  EnvironmentBase: class EnvironmentBase {
    static connectionString: string;
    static jwtSecret: string;
    static encryptionKey: string;
    static contentRoot: string;
    // apihelper 0.7.1: populateBase reads each secret once and turns any SSM error (throttling included) into "".
    static async initBase(env: string, options: any) {
      EnvironmentBase.connectionString = await readParameter(`/${env}/${options.appName}/connectionString`);
      EnvironmentBase.encryptionKey = await readParameter(`/${env}/encryptionKey`);
      EnvironmentBase.jwtSecret = await readParameter(`/${env}/jwtSecret`);
      return {};
    }
  }
}));

import { EnvironmentBase } from "@churchapps/apihelper";
import { Environment } from "../Environment";

// Prod 2026-10-23 19:42Z and 2026-10-24 05:10Z: ~600 cold starts in a minute throttled SSM; 130 requests then
// died with "Cannot read properties of undefined (reading 'split')" in parseConnectionString("").
describe("Environment.init when SSM is throttled", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CONNECTION_STRING;
    delete process.env.JWT_SECRET;
    delete process.env.ENCRYPTION_KEY;
    Environment.retryDelayMs = 0;
  });
  afterAll(() => { process.env = saved; });

  it("retries a secret that came back empty until SSM answers", async () => {
    let connectionCalls = 0;
    readParameter.mockImplementation(async (name: string) => {
      if (name.endsWith("/connectionString")) return ++connectionCalls < 3 ? "" : "mysql://u:p@host:3306/lessons";
      return "value";
    });
    await Environment.init("prod");
    // getDb() and the auth provider read EnvironmentBase, not the subclass.
    expect(EnvironmentBase.connectionString).toBe("mysql://u:p@host:3306/lessons");
    expect(EnvironmentBase.jwtSecret).toBe("value");
    expect(connectionCalls).toBe(3);
  });

  it("gives up after a few tries and names the parameter", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    readParameter.mockImplementation(async (name: string) => (name.endsWith("/jwtSecret") ? "" : "value"));
    await Environment.init("prod");
    expect(EnvironmentBase.jwtSecret).toBe("");
    expect(readParameter.mock.calls.filter(c => c[0] === "/prod/jwtSecret").length).toBe(5);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toContain("/prod/jwtSecret");
    error.mockRestore();
  });

  it("does not re-read a secret supplied by the environment", async () => {
    process.env.JWT_SECRET = "from-env";
    readParameter.mockImplementation(async (name: string) => (name.endsWith("/jwtSecret") ? "" : "value"));
    await Environment.init("prod");
    expect(readParameter.mock.calls.filter(c => c[0] === "/prod/jwtSecret").length).toBe(1);
  });
});
