const debug = process.env.HOOMAN_DEBUG;

const info = async (message) => {
  if (debug) {
    console.log('[info] ' + message);
  }
};

const warn = async (message) => {
  if (debug) {
    console.warn('[warn] ' + message);
  }
};

const error = async (message) => {
  if (debug) {
    console.error('[error] ' + message);
  }
};

module.exports = { info, warn, error };
