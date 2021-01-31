const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

let resolvePromise = (promise2, value, resolve, reject) => {
  let called;
  if (value === promise2) return reject(new TypeError("循环引用"));
  if (value && (typeof value === "object" || typeof value === "function")) {
    try {
      if (typeof value === "function") {
        let then = value.then;
        then.call(
          value,
          function onFulfilled(res) {
            if (called) return;
            called = true;
            resolvePromise(promise2, res, resolve, reject);
          },
          function onRejected(err) {
            if (called) return;
            called = true;
            reject(err);
          }
        );
      } else {
        resolve(value);
      }
    } catch (err) {
      if (called) return;
      called = true;
      reject(err);
    }
  } else {
    resolve(value);
  }
};
class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.data = undefined;
    this.resolvedCallbacks = [];
    this.rejectedCallbacks = [];

    let resolve = res => {
      if (this.status === PENDING) {
        this.data = res;
        this.status = RESOLVED;
        this.resolvedCallbacks.forEach(cb => cb());
      }
    };
    let rejected = err => {
      if (this.status === PENDING) {
        this.data = err;
        this.status = REJECTED;
        this.rejectedCallbacks.forEach(cb => cb());
      }
    };

    try {
      executor(resolve, rejected);
    } catch (err) {
      rejected(err);
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : res => res;
    onRejected =
      typeof onRejected === "function "
        ? onRejected
        : err => {
            throw err;
          };

    let promise2 = new Promise((resolve, reject) => {
      switch (this.status) {
        case PENDING: {
          this.resolvedCallbacks.push(() => {
            setTimeout(() => {
              try {
                let res = onFulfilled(this.value);
                resolvePromise(promise2, res, resolve, reject);
              } catch (err) {
                reject(err);
              }
            });
          });
          this.rejectedCallbacks.push(() => {
            setTimeout(() => {
              try {
                let res = onFulfilled(this.value);
                resolvePromise(promise2, res, resolve, reject);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
        case RESOLVED: {
          setTimeout(() => {
            try {
              let res = onFulfilled(this.value);
              resolvePromise(promise2, res, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        }
        case REJECTED: {
          setTimeout(() => {
            try {
              let res = onFulfilled(this.value);
              resolvePromise(promise2, res, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        }
      }
    });
    return promise2;
  }
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  finally(callback) {
    if (typeof callback != "function") callback = () => {};
    return this.then(
      res => Promise.resolve(callback()).then(() => res),
      err =>
        Promise.resolve(callback()).then(() => {
          throw err;
        })
    );
  }
  static all(iterator) {
    if (!iterator[Symbol.iterator]) throw new Error("argument is not iterable");
    return new Promise((resolve, reject) => {
      let result = [];

      if (!iterator.length) return resolve(result);

      let onResolve = res => {
        result.push(res);
        if (result.length === iterator.length) {
          resolve(result);
        }
      };

      iterator
        .map(item => Promise.resolve(item))
        .forEach(promise => {
          promise.then(onResolve, reject);
        });
    });
  }
  static race(iterator) {
    return new Promise((resolve, reject) => {
      iterator
        .map(item => Promise.resolve(item))
        .forEach(promise => {
          promise.then(resolve, reject);
        });
    });
  }
  static resolve(value) {
    return new Promise(resolve => {
      resolve(value);
    });
  }
  static rejecte(err) {
    return new Promise((resolve, reject) => {
      reject(err);
    });
  }
}

let a = new Promise((resolve, reject) => {});
