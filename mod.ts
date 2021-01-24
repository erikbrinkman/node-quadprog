import { solveQP } from "./lib/quadprog.js";

export interface Solution {
  solution: number[];
  lagrangian: number[];
  unconstrained: number[];
  iterations: number;
  inactive: number;
  active: number[];
  value: number;
}

export default function (
  qmat: number[][],
  cvec: number[],
  amat: number[][],
  bvec: number[],
  meq = 0,
  factorized = false,
) {
  const Dmat = [[0]].concat(qmat.map((row) => [0].concat(row)));
  const dvec = [0].concat(cvec.map((v) => -v));
  const Amat = [[0]].concat(
    amat.length === 0
      ? new Array(qmat.length).fill([0])
      : amat[0].map((_, i) => [0].concat(amat.map((row) => -row[i]))),
  );
  const bvecp = [0].concat(bvec.map((v) => -v));
  const {
    solution,
    lagrangian,
    value: boxedVal,
    unconstrainedSolution: unconstrained,
    iterations: iters,
    iact,
    message,
  } = solveQP(Dmat, dvec, Amat, bvecp, meq, [0, +factorized]) as {
    solution: number[];
    lagrangian: number[];
    value: [unknown, number];
    unconstrainedSolution: number[];
    iterations: [unknown, number, number];
    iact: number[];
    message: string;
  };

  if (message.length > 0) {
    throw new Error(message);
  } else {
    solution.shift();
    lagrangian.shift();
    unconstrained.shift();
    iact.push(0);
    const active = iact.slice(1, iact.indexOf(0)).map((v) => v - 1);
    const [, value] = boxedVal;
    const [, iterations, inactive] = iters;

    return {
      solution,
      lagrangian,
      unconstrained,
      iterations,
      inactive,
      active,
      value,
    };
  }
}
