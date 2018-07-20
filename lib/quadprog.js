const vsmall = require('./vsmall');

/* Solve the quadratic programming problem
 *
 * min 1/2 xT Q x + cT x
 *  st A x <= b
 *
 * The first meq rows of A and b are treated as equality constraints instead of
 * inequality constraints.
 *
 * If factorized is set to true, then instead of passing in Q, pass in R
 * inverse where R inverse is upper triangular and R.T R = Q.
 *
 * This returns the solution, the lagrangian at the solution, the objective
 * value of the solution, the unconstrained solution, the number of iterations
 * it took, the number of times active constraints became inactive, and the
 * indices of the active constraints.
 */
function quadprog(qmat, cvec, amat, bvec, meq = 0, factorized = false) {
  const n = qmat.length;
  const q = amat.length;
  const r = Math.min(n, q);

  if (qmat.some(row => n !== row.length)) {
    throw new Error('Dmat is not symmetric!');
  } else if (n !== cvec.length) {
    throw new Error('Dmat and cvec are incompatible!');
  } else if (amat.some(row => n !== row.length)) {
    throw new Error('Amat and cvec are incompatible!');
  } else if (q !== bvec.length) {
    throw new Error('Amat and bvec are incompatible!');
  } else if ((meq > q) || (meq < 0)) {
    throw new Error('Value of meq is invalid!');
  }

  const iact = new Array(q).fill(-1);
  const lagr = new Array(q).fill(0);
  const work = cvec.slice();
  const workzv = new Array(n);
  const workrv = new Array(r).fill(0);
  const workuv = new Array(r + 1).fill(0);
  const workrm = new Array((r * (r + 1)) / 2).fill(0);
  const worksv = new Array(q).fill(0);
  const worknbv = amat.map(row => Math.sqrt(row.reduce((s, av) => s + av * av, 0)));

  if (factorized) {
    for (let j = 0; j < n; j += 1) {
      workzv[j] = -cvec.reduce((s, cv, i) => s + cv * qmat[i][j], 0);
    }
    for (let j = 0; j < n; j += 1) {
      let t = 0;
      for (let i = j; i < n; i += 1) {
        t += qmat[j][i] * workzv[i];
      }
      cvec[j] = t;
    }
  } else {
    if (qmat[0][0] <= 0) {
      throw new Error('matrix D in quadratic function is not positive definite!');
    }
    qmat[0][0] = Math.sqrt(qmat[0][0]);
    for (let j = 1; j < n; j += 1) {
      let s = 0;
      for (let k = 0; k < j; k += 1) {
        let t = qmat[k][j];
        for (let i = 0; i < k; i += 1) {
          t -= qmat[i][j] * qmat[i][k];
        }
        t /= qmat[k][k];
        qmat[k][j] = t;
        s += t * t;
      }
      s = qmat[j][j] - s;
      if (s <= 0) {
        throw new Error('matrix D in quadratic function is not positive definite!');
      }
      qmat[j][j] = Math.sqrt(s);
    }

    for (let k = 0; k < n; k += 1) {
      let t = 0;
      for (let i = 0; i < k; i += 1) {
        t += qmat[i][k] * cvec[i];
      }
      cvec[k] = (cvec[k] - t) / qmat[k][k];
    }

    for (let k = n - 1; k >= 0; k -= 1) {
      cvec[k] /= -qmat[k][k];
      const t = cvec[k];
      for (let i = 0; i < k; i += 1) {
        cvec[i] += t * qmat[i][k];
      }
    }

    for (let k = 0; k < n - 1; k += 1) {
      qmat[k][k] = 1 / qmat[k][k];
      const t = -qmat[k][k];

      for (let i = 0; i < k; i += 1) {
        qmat[i][k] *= t;
      }

      for (let j = k + 1; j < n; j += 1) {
        const t1 = qmat[k][j];
        qmat[k][j] = 0;

        for (let i = 0; i < k + 1; i += 1) {
          qmat[i][j] += t1 * qmat[i][k];
        }
      }
    }

    qmat[n - 1][n - 1] = 1 / qmat[n - 1][n - 1];
    const t = -qmat[n - 1][n - 1];

    for (let i = 0; i < n - 1; i += 1) {
      qmat[i][n - 1] *= t;
    }

    for (let j = 0; j < n; j += 1) {
      for (let i = j + 1; i < n; i += 1) {
        qmat[i][j] = 0;
      }
    }
  }

  const sol = cvec.slice();
  let crval = sol.reduce((s, sv, j) => s + sv * work[j], 0) / 2;
  let nvl;
  let it1;
  let nact = 0;

  function fnGoto50() {
    for (let i = 0; i < q; i += 1) {
      let sum = bvec[i] - amat[i].reduce((s, av, j) => s + av * sol[j], 0);
      if (Math.abs(sum) < vsmall) {
        sum = 0;
      }
      if (i >= meq) {
        worksv[i] = sum;
      } else {
        worksv[i] = -Math.abs(sum);
        if (sum > 0) {
          for (let j = 0; j < n; j += 1) {
            amat[i][j] *= -1;
          }
          bvec[i] *= -1;
        }
      }
    }

    for (let i = 0; i < nact; i += 1) {
      worksv[iact[i]] = 0;
    }

    nvl = -1;
    let temp = 0;

    for (let i = 0; i < q; i += 1) {
      if (worksv[i] < temp * worknbv[i]) {
        nvl = i;
        temp = worksv[i] / worknbv[i];
      }
    }
    if (nvl === -1) {
      for (let i = 0; i < nact; i += 1) {
        lagr[iact[i]] = workuv[i];
      }
      return false;
    } else {
      return true;
    }
  }

  function fnGoto55() {
    for (let i = 0; i < n; i += 1) {
      work[i] = -amat[nvl].reduce((s, av, j) => s + av * qmat[j][i], 0);
    }

    workzv.fill(0);
    for (let j = nact; j < n; j += 1) {
      for (let i = 0; i < n; i += 1) {
        workzv[i] += qmat[i][j] * work[j];
      }
    }

    let t1inf = true;
    for (let i = nact - 1; i >= 0; i -= 1) {
      let sum = work[i];

      let l = ((i + 1) * (i + 4)) / 2 - 1;
      const l1 = l - i - 1;
      for (let j = i + 1; j < nact; j += 1) {
        sum -= workrm[l] * workrv[j];
        l += j + 1;
      }
      sum /= workrm[l1];
      workrv[i] = sum;
      if ((iact[i] >= meq) && (sum > 0)) {
        t1inf = false;
        it1 = i + 1;
      }
    }

    let t1;
    if (!t1inf) {
      t1 = workuv[it1 - 1] / workrv[it1 - 1];
      for (let i = 0; i < nact; i += 1) {
        if ((iact[i] >= meq) && (workrv[i] > 0)) {
          const temp = workuv[i] / workrv[i];
          if (temp < t1) {
            t1 = temp;
            it1 = i + 1;
          }
        }
      }
    }

    const sum1 = workzv.reduce((s, v) => s + v * v, 0);
    if (Math.abs(sum1) <= vsmall) {
      if (t1inf) {
        throw new Error('constraints are inconsistent, no solution!');
      }
      for (let i = 0; i < nact; i += 1) {
        workuv[i] -= t1 * workrv[i];
      }
      workuv[nact] += t1;
      return true;
    }
    const sum2 = -amat[nvl].reduce((s, av, i) => s + av * workzv[i], 0);
    let tt = -worksv[nvl] / sum2;
    let t2min = true;
    if (!t1inf && (t1 < tt)) {
      tt = t1;
      t2min = false;
    }

    for (let i = 0; i < n; i += 1) {
      sol[i] += tt * workzv[i];
      if (Math.abs(sol[i]) < vsmall) {
        sol[i] = 0;
      }
    }

    crval += tt * sum2 * (tt / 2 + workuv[nact]);
    for (let i = 0; i < nact; i += 1) {
      workuv[i] -= tt * workrv[i];
    }
    workuv[nact] += tt;

    if (t2min) {
      iact[nact] = nvl;
      nact += 1;

      let l = ((nact - 1) * nact) / 2;
      for (let i = 0; i < nact - 1; i += 1) {
        workrm[l] = work[i];
        l += 1;
      }

      if (nact === n) {
        workrm[l] = work[n - 1];
      } else {
        for (let i = n - 1; i >= nact; i -= 1) {
          if (work[i] !== 0) {
            const gc1 = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
            const gs1 = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
            const temp = ((work[i - 1] >= 0 ? 1 : -1)
              * Math.abs(gc1 * Math.sqrt(1 + gs1 * gs1 / (gc1 * gc1))));
            const gc = work[i - 1] / temp;
            const gs = work[i] / temp;

            if (gc === 0) {
              work[i - 1] = gs * temp;
              qmat.forEach((row) => {
                const temp1 = row[i - 1];
                row[i - 1] = row[i];
                row[i] = temp1;
              });
            } else if (gc !== 1) {
              work[i - 1] = temp;
              const nu = gs / (1 + gc);
              qmat.forEach((row) => {
                const temp1 = gc * row[i - 1] + gs * row[i];
                row[i] = nu * (row[i - 1] + temp1) - row[i];
                row[i - 1] = temp1;
              });
            }
          }
        }
        workrm[l] = work[nact - 1];
      }
      return false;
    } else {
      const sum = bvec[nvl] - amat[nvl].reduce((s, av, j) => s + sol[j] * av, 0);
      if (nvl >= meq) {
        worksv[nvl] = sum;
      } else {
        worksv[nvl] = -Math.abs(sum);
        if (sum > 0) {
          for (let j = 0; j < n; j += 1) {
            amat[nvl][j] *= -1;
          }
          bvec[nvl] *= -1;
        }
      }
      return true;
    }
  }

  function fnGoto797() {
    const l = (it1 * (it1 + 1)) / 2;
    let l1 = l + it1;

    if (workrm[l1] !== 0) {
      const gc1 = Math.max(Math.abs(workrm[l1 - 1]), Math.abs(workrm[l1]));
      const gs1 = Math.min(Math.abs(workrm[l1 - 1]), Math.abs(workrm[l1]));
      const temp = ((workrm[l1 - 1] >= 0 ? 1 : -1)
        * Math.abs(gc1 * Math.sqrt(1 + gs1 * gs1 / (gc1 * gc1))));
      const gc = workrm[l1 - 1] / temp;
      const gs = workrm[l1] / temp;

      if (gc === 0) {
        for (let i = it1; i < nact; i += 1) {
          const temp1 = workrm[l1 - 1];
          workrm[l1 - 1] = workrm[l1];
          workrm[l1] = temp1;
          l1 += i + 1;
        }
        qmat.forEach((row) => {
          const temp1 = row[it1 - 1];
          row[it1 - 1] = row[it1];
          row[it1] = temp1;
        });
      } else if (gc !== 1) {
        const nu = gs / (1 + gc);
        for (let i = it1; i < nact; i += 1) {
          const temp1 = gc * workrm[l1 - 1] + gs * workrm[l1];
          workrm[l1] = nu * (workrm[l1 - 1] + temp1) - workrm[l1];
          workrm[l1 - 1] = temp1;
          l1 += i + 1;
        }
        qmat.forEach((row) => {
          const temp1 = gc * row[it1 - 1] + gs * row[it1];
          row[it1] = nu * (row[it1 - 1] + temp1) - row[it1];
          row[it1 - 1] = temp1;
        });
      }
    }

    for (let i = l - it1; i < l; i += 1) {
      workrm[i] = workrm[i + it1];
    }

    workuv[it1 - 1] = workuv[it1];
    iact[it1 - 1] = iact[it1];
    it1 += 1;
  }

  let iter = 0;
  let cons = 0;
  while (fnGoto50()) {
    iter += 1;
    while (fnGoto55()) {
      cons += 1;
      while (it1 < nact) {
        fnGoto797();
      }
      workuv[nact - 1] = workuv[nact];
      workuv[nact] = 0;
      nact -= 1;
      iact[nact] = -1;
    }
  }

  const trim = iact.indexOf(-1);
  if (trim >= 0) {
    iact.length = trim;
  }

  return {
    solution: sol,
    lagrangian: lagr,
    value: crval,
    unconstrained: cvec,
    iterations: iter,
    inactive: cons,
    active: iact,
  };
}

module.exports = quadprog;
