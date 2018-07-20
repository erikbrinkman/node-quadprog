let epsilon = 1.0e-60;

while ((1 + 0.1 * epsilon <= 1) || (1 + 0.2 * epsilon <= 1)) {
  epsilon *= 2;
}

module.exports = epsilon;
