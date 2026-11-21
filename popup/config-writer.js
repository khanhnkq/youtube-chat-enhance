(function () {
  'use strict';

  // One in-flight write, with newer edits coalesced behind it.
  globalThis.createConfigWriter = function (storage, { interval = 120, onError = () => {} } = {}) {
    let pending = {};
    let timer = null;
    let inFlight = null;
    let lastWrite = -Infinity;

    function schedule() {
      if (timer !== null || inFlight || Object.keys(pending).length === 0) return;
      const delay = Math.max(0, interval - (Date.now() - lastWrite));
      timer = setTimeout(() => {
        timer = null;
        write().catch(onError);
      }, delay);
    }

    function write() {
      if (inFlight) return inFlight;
      if (Object.keys(pending).length === 0) return Promise.resolve();
      const batch = pending;
      pending = {};
      lastWrite = Date.now();
      inFlight = Promise.resolve().then(() => storage.set(batch)).catch(error => {
        pending = { ...batch, ...pending };
        throw error;
      }).finally(() => {
        inFlight = null;
      });
      return inFlight;
    }

    async function flush() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      while (inFlight || Object.keys(pending).length > 0) await write();
    }

    return {
      update(partial, immediate = false) {
        pending = { ...pending, ...partial };
        if (immediate) return flush();
        schedule();
        // A slow storage write still needs to drain subsequent input.
        if (inFlight) inFlight.then(schedule, () => {});
        return Promise.resolve();
      },
      flush
    };
  };
})();
