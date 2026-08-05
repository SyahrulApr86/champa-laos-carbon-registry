import {
  calculateCalendarDuration,
  createPublicMeta,
  SYNTHETIC_DISCLOSURE,
} from "./public.data.contract";

describe("public W5 data contract", () => {
  it("creates deterministic synthetic metadata with requested pagination", () => {
    const meta = createPublicMeta(
      { q: "water", page: 2, page_size: 10 },
      { pagination: { page: 2, page_size: 10, total_items: 21 } }
    );

    expect(meta.dataset_kind).toBe("demo_synthetic");
    expect(meta.pagination).toEqual({
      page: 2,
      page_size: 10,
      total_items: 21,
      total_pages: 3,
    });
    expect(meta.disclosure).toBe(SYNTHETIC_DISCLOSURE);
  });

  it("calculates exact short durations instead of converting dates to years", () => {
    expect(calculateCalendarDuration("2025-01-01", "2025-01-31")).toEqual({
      days: 30,
      years: 0,
      label: "30 days",
    });
  });

  it("returns null for missing or invalid date ranges", () => {
    expect(calculateCalendarDuration("2025-02-01", "2025-01-31")).toBeNull();
    expect(calculateCalendarDuration("2025-01-01", null)).toBeNull();
  });
});
