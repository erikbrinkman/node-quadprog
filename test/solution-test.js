const fs = require('fs');

const test = require('tape');

const epsilon = require('../lib/vsmall');
const wrap = require('./wrapper');
const solve = require('..');

function almostEqual(a, b) {
  const isAlmostEqual = Math.abs(a - b) <= epsilon + 1e-10 * Math.abs(b);

  if (!isAlmostEqual) {
    console.error(a, b); // eslint-disable-line no-console
  }

  return isAlmostEqual;
}

function almostEqualArray(a, b) {
  return a.length === b.length && a.every((av, i) => almostEqual(av, b[i]));
}

function testWrapper(base) {
  const {
    Dmat, dvec, Amat, bvec, meq, factorized,
  } = wrap(JSON.parse(fs.readFileSync(`test/${base}-data.json`, 'utf8')));
  const expected = JSON.parse(fs.readFileSync(`test/${base}-result.json`));

  if (expected.Lagrangian.length === undefined) {
    expected.Lagrangian = [expected.Lagrangian];
  }
  if (expected.iact.length === undefined) {
    expected.iact = [expected.iact];
  }
  expected.iact.forEach((v, i) => expected.iact[i] = v - 1);

  function wrappedTest(t) {
    const {
      value, solution, unconstrained, lagrangian, active, iterations, inactive,
    } = solve(Dmat, dvec, Amat, bvec, meq, factorized);

    t.ok(almostEqual(value, expected.value), 'values are almost equal');
    t.ok(almostEqualArray(solution, expected.solution), 'solutions are almost equal');
    t.ok(almostEqualArray(unconstrained, expected['unconstrained.solution']), 'unconstrained solutions are almost equal');
    t.ok(almostEqualArray(lagrangian, expected.Lagrangian), 'lagrangians are almost equal');
    t.deepEqual(active, expected.iact, 'iact values are equal');
    t.equal(iterations, expected.iterations[0] - 1, 'iterations are equal');
    t.equal(inactive, expected.iterations[1], 'inactive switches are equal');
    t.end();
  }
  return wrappedTest;
}

fs.readdirSync('test')
  .filter(f => f.endsWith('-data.json'))
  .map(f => f.slice(0, -10))
  .forEach(name => test(`Test ${name}`, testWrapper(name)));
