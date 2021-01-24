Deno Quadprog
===========

![tests](https://github.com/erikbrinkman/node-quadprog/workflows/tests/badge.svg)

This module contains routines for solving quadratic programming problems, written in JavaScript.
It is a strict fork of [this library](https://github.com/albertosantini/node-quadprog) that's been wrapped to support ES6 modules and deno.
The goal is to have the wrapping be as mminimal as possible, so that version can be reabsed on top of the original.

Example
========

If we want to solve the equation:

```
min xT Q x + cT x
 st A x <= b
```

Then the following example solves it:

```
import solve from "https://deno.land/x/quadprog@v1.0.2/mod.ts";

const Q = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const c = [0, -5, 0];
const A = [[-4, -3, 0], [2, 1, 0], [0, -2, 1]];
const b = [-8, 2, 0];

console.log(solve(Q, c, A, b));
```

and produces output:

```
{
  solution: [ -1.2, 4.4, 0 ],
  lagrangian: [ 0, 0.6, 0 ],
  unconstrained: [ 0, 5, -0 ],
  iterations: 2,
  inactive: 0,
  active: [ 1 ],
  value: -11.6
}
```
