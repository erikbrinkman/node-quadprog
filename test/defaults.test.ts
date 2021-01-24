import solve from "../mod.ts";
import { assertAlmostEquals } from "./assert.ts";

Deno.test("test that default meq is 0", () => {
  // min (x0 - 0)^2 + (x1 - 2)^2 st. x1 >= x0
  // if meq is 0, then x0 == 0 and x1 == 2
  // if meq is wrong, then x0 == x1, so x0 == x1 == 1
  const Q = [[1, 0], [0, 1]];
  const c = [0, -2];
  const A = [[1, -1]];
  const b = [0];
  const { solution: [x0, x1] } = solve(Q, c, A, b);

  assertAlmostEquals(x0, 0);
  assertAlmostEquals(x1, 2);
});

Deno.test("test that empty amat works properly", () => {
  // min x^2
  const { solution: [x] } = solve([[1]], [0], [], []);

  assertAlmostEquals(x, 0);
});

Deno.test("test that default factorized is false", () => {
  // min (x0 - 0)^2 + (x1 - x0)^2
  // If factorization is assumed, wrong result
  const Q = [[2, -1], [-1, 1]];
  const c = [0, 0];
  const A = [[0, -1]];
  const b = [-1];
  const { solution: [x0, x1] } = solve(Q, c, A, b);

  assertAlmostEquals(x0, 0.5); // This will be -1 if factorized is assumed
  assertAlmostEquals(x1, 1);
});
