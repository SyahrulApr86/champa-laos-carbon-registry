/**
 * Metadata for test harnesses only. These values are intentionally not
 * inserted by a seeder and cannot be used outside NODE_ENV=test. The .test
 * addresses do not route email, and no password or API key is committed.
 */
export const LOCAL_DEMO_AUTH_FIXTURES = Object.freeze({
  datasetKind: "demo_synthetic",
  scenario: "Champa registry demonstration",
  accounts: [
    {
      email: "demo.proponent@example.test",
      role: "Admin",
      lifecycle: "disposable_local_test_only",
      companyState: "PENDING",
      credentialSource: "test_harness_runtime_only",
    },
    {
      email: "demo.review@example.test",
      role: "ViewOnly",
      lifecycle: "disposable_local_test_only",
      companyState: "ACTIVE",
      credentialSource: "test_harness_runtime_only",
    },
  ],
});
