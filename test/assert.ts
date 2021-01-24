import {
  assert,
  assertStrictEquals,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
import epsilon from "../lib/vsmall.ts";

export { assertStrictEquals };

export function assertAlmostEquals(a: number, b: number, msg = ""): void {
  assert(Math.abs(a - b) <= epsilon + 1e-10 * Math.abs(b), msg);
}

export function assertArrayAlmostEquals(
  a: number[],
  b: number[],
  msg = "",
): void {
  assertStrictEquals(a.length, b.length, msg);
  for (const [i, ai] of a.entries()) {
    assertAlmostEquals(ai, b[i], msg);
  }
}

export function assertArrayStrictEquals(
  a: unknown[],
  b: unknown[],
  msg = "",
): void {
  assertStrictEquals(a.length, b.length, msg);
  for (const [i, ai] of a.entries()) {
    assertStrictEquals(ai, b[i], msg);
  }
}
