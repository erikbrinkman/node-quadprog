import { solveQP } from "./lib/quadprog.js";

type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;
type Tuple<T, N extends number> = N extends N
  ? number extends N ? T[] : _TupleOf<T, N, []>
  : never;
export type Vector<N extends number = number> = Tuple<number, N>;
export type Matrix<N extends number = number, M extends number = number> =
  Tuple<Vector<M>, N>;

export interface Solution<N extends number> {
  solution: Vector<N>;
  lagrangian: Vector<N>;
  unconstrained: Vector<N>;
  iterations: number;
  inactive: number;
  active: number[];
  value: number;
}

export default function solve<
  N extends number = number,
  C extends number = number,
>(
  qmat: Matrix<N, N>,
  cvec: Vector<N>,
  amat: Matrix<C, N>,
  bvec: Vector<C>,
  meq = 0,
  factorized = false,
): Solution<N> {
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
      solution: solution as Vector<N>,
      lagrangian: lagrangian as Vector<N>,
      unconstrained: unconstrained as Vector<N>,
      iterations,
      inactive,
      active,
      value,
    };
  }
}
