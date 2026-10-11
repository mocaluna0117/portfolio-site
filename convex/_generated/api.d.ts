/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as http from "../http.js";
import type * as importWork from "../importWork.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_files from "../lib/files.js";
import type * as lib_png from "../lib/png.js";
import type * as lib_transformDoc from "../lib/transformDoc.js";
import type * as lib_validators from "../lib/validators.js";
import type * as revalidate from "../revalidate.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as site from "../site.js";
import type * as works from "../works.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  contact: typeof contact;
  http: typeof http;
  importWork: typeof importWork;
  "lib/auth": typeof lib_auth;
  "lib/files": typeof lib_files;
  "lib/png": typeof lib_png;
  "lib/transformDoc": typeof lib_transformDoc;
  "lib/validators": typeof lib_validators;
  revalidate: typeof revalidate;
  seed: typeof seed;
  seedData: typeof seedData;
  site: typeof site;
  works: typeof works;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
