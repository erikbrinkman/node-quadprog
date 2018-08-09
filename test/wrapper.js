"use strict";

function wrap(data) {
    const {
        Dmat, dvec, Amat, bvec, meq, factorized
    } = data;
    const Atrans = Amat[0].map((_, i) => Amat.map(r => -r[i]));

    dvec.forEach((v, i) => dvec[i] = -v); // eslint-disable-line no-return-assign
    bvec.forEach((v, i) => bvec[i] = -v); // eslint-disable-line no-return-assign
    return {
        Dmat,
        dvec,
        Amat: Atrans,
        bvec,
        meq,
        factorized
    };
}

module.exports = wrap;
