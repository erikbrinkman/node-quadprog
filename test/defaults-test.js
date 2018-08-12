"use strict";
const test = require("tape");

const epsilon = require("../lib/vsmall");
const solve = require("..");

function almostEqual(a, b) {
    const isAlmostEqual = Math.abs(a - b) <= epsilon + 1e-10 * Math.abs(b);

    if (!isAlmostEqual) {
        console.error(a, b); // eslint-disable-line no-console
    }

    return isAlmostEqual;
}

test("Test that default meq is 0", t => {

    // min (x0 - 0)^2 + (x1 - 2)^2 st. x1 >= x0
    // if meq is 0, then x0 == 0 and x1 == 2
    // if meq is wrong, then x0 == x1, so x0 == x1 == 1
    const Q = [[1, 0], [0, 1]];
    const c = [0, -2];
    const A = [[1, -1]];
    const b = [0];
    const { solution: [x0, x1] } = solve(Q, c, A, b);

    t.ok(almostEqual(x0, 0));
    t.ok(almostEqual(x1, 2));
    t.end();
});

test("Test that empty amat works properly", t => {

    // min x^2
    try {
        const { solution: [x] } = solve([[1]], [0], [], []);

        t.ok(almostEqual(x, 0));
        t.end();
    } catch (ex) {
        t.fail(`Errored from ${ex} likely due to improper handling of empty Amat`);
        t.end();
    }

});

test("Test that default factorized is false", t => {

    // min (x0 - 0)^2 + (x1 - x0)^2
    // If factorization is assumed, wrong result
    const Q = [[2, -1], [-1, 1]];
    const c = [0, 0];
    const A = [[0, -1]];
    const b = [-1];
    const { solution: [x0, x1] } = solve(Q, c, A, b);

    t.ok(almostEqual(x0, 0.5)); // This will be -1 if factorized is assumed
    t.ok(almostEqual(x1, 1));
    t.end();
});
