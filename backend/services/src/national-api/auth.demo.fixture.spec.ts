import { LOCAL_DEMO_AUTH_FIXTURES } from "./auth.demo.fixture";

describe("local demo auth fixtures", () => {
  it("contains disposable metadata only, never a credential or delivery address", () => {
    expect(LOCAL_DEMO_AUTH_FIXTURES.datasetKind).toBe("demo_synthetic");
    expect(LOCAL_DEMO_AUTH_FIXTURES.accounts).toHaveLength(2);

    for (const account of LOCAL_DEMO_AUTH_FIXTURES.accounts) {
      expect(account.email).toMatch(/@example\.test$/);
      expect(account.lifecycle).toBe("disposable_local_test_only");
      expect(account.credentialSource).toBe("test_harness_runtime_only");
      expect(account).not.toHaveProperty("password");
      expect(account).not.toHaveProperty("apiKey");
    }
  });
});
