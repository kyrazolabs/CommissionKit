// Production build shim: Bun bundler strips __promiseAll helper function.
// This polyfill must be defined before any module that uses async functions.
(globalThis as any).__promiseAll = (promises: Promise<any>[]) => Promise.all(promises);
