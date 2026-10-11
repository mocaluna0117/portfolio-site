import "@testing-library/jest-dom/vitest";
// next/image and the server-only guard are not under test here.
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

// next/image needs the app's config to build its URLs; the tests only care
// which file an image points at, so it renders as a plain <img>.
vi.mock("next/image", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ src, alt, width, height, className }: Record<string, unknown>) =>
      createElement("img", { src, alt, width, height, className }),
  };
});
