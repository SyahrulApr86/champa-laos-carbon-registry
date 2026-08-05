export const DEMO_SEED_CONFIRMATION = "I_UNDERSTAND_THIS_WRITES_SYNTHETIC_DEMO_DATA";

export function assertSafeDemoSeedEnvironment(environment: NodeJS.ProcessEnv): void {
  if (environment.CHAMPA_DEMO_DATABASE !== "true") {
    throw new Error("Demo seed refused: set CHAMPA_DEMO_DATABASE=true for an explicitly marked disposable demo database.");
  }
  if (environment.CHAMPA_DEMO_SEED_CONFIRMATION !== DEMO_SEED_CONFIRMATION) {
    throw new Error("Demo seed refused: explicit CHAMPA_DEMO_SEED_CONFIRMATION is required.");
  }
  if (environment.NODE_ENV === "production") {
    throw new Error("Demo seed refused: NODE_ENV=production is never allowed.");
  }
}
