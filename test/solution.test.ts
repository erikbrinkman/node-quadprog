import solve from "../mod.ts";
import {
  assertAlmostEquals,
  assertArrayAlmostEquals,
  assertArrayStrictEquals,
  assertStrictEquals,
} from "./assert.ts";

const testDir = new URL(".", import.meta.url);

function ensureArray<T>(inp: T | T[]): T[] {
  return Array.isArray(inp) ? inp : [inp];
}

async function testSolution(base: string): Promise<void> {
  const [inputs, expected] = await Promise.all([
    Deno.readTextFile(new URL(`${base}-data.json`, testDir).pathname).then(
      JSON.parse,
    ),
    Deno.readTextFile(new URL(`${base}-result.json`, testDir).pathname).then(
      JSON.parse,
    ),
  ]);

  const { Dmat: qmat, dvec, Amat, bvec, meq, factorized } = inputs as {
    Dmat: number[][];
    dvec: number[];
    Amat: number[][];
    bvec: number[];
    meq: number;
    factorized: boolean;
  };
  const cvec = dvec.map((v) => -v);
  const amat = bvec.map((_, i) => Amat.map((row) => -row[i]));
  const bvecp = bvec.map((v) => -v);

  const [expIterations, expInactive] = expected.iterations;

  Deno.test(`solution of ${base} works`, () => {
    const {
      solution,
      value,
      unconstrained,
      iterations,
      inactive,
      lagrangian,
      active,
    } = solve(qmat, cvec, amat, bvecp, meq, factorized);

    assertArrayAlmostEquals(solution, expected.solution);
    assertAlmostEquals(value, expected.value);
    assertArrayAlmostEquals(unconstrained, expected["unconstrained.solution"]);
    assertStrictEquals(iterations, expected.iterations[0]);
    assertStrictEquals(inactive, expected.iterations[1]);
    assertArrayAlmostEquals(lagrangian, ensureArray(expected.Lagrangian));
    assertArrayStrictEquals(
      active,
      ensureArray(expected.iact).map((i: number) => i - 1),
    );
  });
}

const tests: Promise<void>[] = [];
for await (const file of Deno.readDir(testDir.pathname)) {
  if (/-data\.json$/.test(file.name)) {
    tests.push(testSolution(file.name.slice(0, -10)));
  }
}
await Promise.all(tests);
