const fibonaccis = (n) => {
  if (n < 2) {
    return n;
  }
  return fibonaccis(n - 1) + fibonaccis(n - 2);
}

module.exports = (value) => {
  return new Promise((resolve) => {
    resolve(fibonaccis(value))
  });
}