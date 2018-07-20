const fs = require('fs');

const Benchmark = require('benchmark');

const wrap = require('./wrapper');
const solve = require('..');

const suite = new Benchmark.Suite('quadprog');

function wsolve(file) {
  const {
    Dmat, dvec, Amat, bvec, meq, factorized,
  } = wrap(JSON.parse(fs.readFileSync(file, 'utf8')));

  function wrapped() {
    solve(Dmat.map(r => r.slice()), dvec.slice(), Amat.map(r => r.slice()),
      bvec.slice(), meq, factorized);
  }
  return wrapped;
}

fs.readdirSync('test')
  .filter(f => f.endsWith('-data.json'))
  .forEach(f => suite.add(f.slice(0, -10), wsolve(`test/${f}`)));

suite
  .on('cycle', event => console.warn(String(event.target))) // eslint-disable-line no-console
  .run();
