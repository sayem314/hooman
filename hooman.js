'use strict';
const got = require('got');
const solveChallenge = require('./lib/core');
const solveCaptcha = require('./lib/captcha');
const delay = require('./lib/delay');
const log = require('./lib/logging');
const { CookieJar } = require('tough-cookie');
const SSL_OP_ALL = require('constants').SSL_OP_ALL;
const UserAgent = require('user-agents');
const userAgentSettings = require('./lib/user_agent_settings');

const cookieJar = new CookieJar(); // Automatically parse and store cookies
const challengeInProgress = {};

const SIGNATURE_ALGORITHMS = 'ecdsa_secp256r1_sha256:ecdsa_secp384r1_sha384:ecdsa_secp521r1_sha512:ed25519:ed448:rsa_pss_pss_sha256:rsa_pss_pss_sha384:rsa_pss_pss_sha512:rsa_pss_rsae_sha256:rsa_pss_rsae_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha256:rsa_pkcs1_sha384:rsa_pkcs1_sha512:ECDSA+SHA224:RSA+SHA224:DSA+SHA224:DSA+SHA256:DSA+SHA384:DSA+SHA512';

const userAgentSsl = got.extend(
  {
    honorCipherOrder: true,
    maxVersion: 'TLSv1.3',
    sigalgs: SIGNATURE_ALGORITHMS,
    ALPNProtocols: ['http/1.1'],
    ecdhCurve: 'prime256v1',
    secureOptions: SSL_OP_ALL,
    hooks: {
      beforeRequest: [
        async (options) => {
          try {
            const { cipherSuite } = userAgentSettings(options.headers['user-agent']);

            if (!options.ciphers) {
              options.ciphers = cipherSuite.join(':');
            }
          }
          catch(e) {
            log.warn('Unable to set user agent ciphers: ' + e);
          }
        },
      ]
    }
  }
);

const ensureUserAgent = got.extend({
  hooks: {
    beforeRequest: [
      async (options) => {
        if (options.headers['user-agent'] === got.defaults.options.headers['user-agent']) {
          const userAgent = new UserAgent(/Firefox|Chrome/);
          options.headers['user-agent'] = userAgent.toString();
        }
      }
    ]
  }
});

const userAgentHeaders = got.extend({
  hooks: {
    beforeRequest: [
      async (options) => {
        try {
          const { headers } = userAgentSettings(options.headers['user-agent']);
          options.headers = got.mergeOptions({ headers: options.headers }, { headers }).headers;
        }
        catch(e) {
          log.warn('Unable to set user agent headers: ' + e);
        }

        // Add required headers to mimic browser environment
        options.headers.host = options.url.host;
        options.headers.origin = options.url.origin;
        options.headers.referer = options.url.href;
      },
    ]
  }
});

const capitalizedHeaders = got.extend({
  hooks: {
    beforeRequest: [
      async (options) => {
        options.headers = Object.keys(options.headers).reduce((result, lowerCaseKey) => {
          const value = options.headers[lowerCaseKey];
          const words = lowerCaseKey.split('-');
          const upperCaseKey = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
          const header = [upperCaseKey, value];
          if(upperCaseKey === 'Host') {
            result.unshift(header);
          } else {
            result.push(header);
          }
          return result;
        }, []);
      },
    ]
  }
});

// Got instance to handle cloudflare bypass
const captcha = got.extend({
  cookieJar,
  retry: {
    limit: 2,
    statusCodes: [408, 413, 429, 500, 502, 504, 521, 522, 524],
  }, // Do not retry 503, we will handle it
  cloudflareRetry: 5, // Prevent cloudflare loop
  notFoundRetry: 1, // Handle redirect issue
  captchaRetry: 1, // Max retry on captcha
  onCaptcha: null, // Custom function to handle captcha
  captchaKey: process.env.HOOMAN_CAPTCHA_KEY,
  rucaptcha: process.env.HOOMAN_RUCAPTCHA,
  http2: false, // http2 doesn't work well with proxies
  hooks: {
    beforeRequest: [
      async (options) => {
        // In case the host is in challenge progress wait
        while (challengeInProgress[options.url.host]) {
          await delay(1000);
        }
      },
    ],
    afterResponse: [
      async (response) => {
        if (
          // If site is not hosted on cloudflare skip
          response.statusCode === 503 &&
          response.headers.server === 'cloudflare' &&
          response.request.options.cloudflareRetry > 0 &&
          response.body.includes('jschl-answer') &&
          response.body.includes('var s')
        ) {
          // Solve js challange
          const host = response.request.options.url.host;
          if (challengeInProgress[host]) {
            log.info('Waiting for js-challenge to be solved: ' + host);
            while (challengeInProgress[host]) {
              await delay(1000);
            }
            log.info('JS-Challenge were solved and waiting is over, refreshing: ' + host);
            return instance(response.request.options);
          }

          log.info('Solving js-challenge: ' + response.url);
          challengeInProgress[host] = true;
          const data = await solveChallenge(response.url, response.body).finally(() => {
            setTimeout(() => {
              if (challengeInProgress[host]) {
                log.info('Clear js-challenge in progress: ' + host);
                delete challengeInProgress[host];
              }
            }, 2000);
          });
          response.request.options.cloudflareRetry--;
          return instance({ ...response.request.options, ...data });
        } else if (
          // Handle redirect issue for cloudflare
          response.statusCode === 404 &&
          response.headers.server === 'cloudflare' &&
          response.request.options.notFoundRetry > 0 &&
          response.url.includes('?__cf_chl_jschl_tk')
        ) {
          // Do not retry again
          return instance({
            url: response.url.split('?__cf_chl_jschl_tk')[0],
            notFoundRetry: response.request.options.notFoundRetry - 1,
          });
        } else if (
          response.statusCode === 403 &&
          response.headers.server === 'cloudflare' &&
          response.request.options.captchaKey &&
          response.request.options.captchaRetry > 0 &&
          response.body.includes('cf_captcha_kind')
        ) {
          // Solve g/hCaptcha
          // If there are captcha solving in progress for current domain do not request for solving
          const host = response.request.options.url.host;
          if (challengeInProgress[host] && !response.request.options.ignoreInProgress) {
            log.info('Waiting for captcha to be solved: ' + host);
            while (challengeInProgress[host]) {
              await delay(1000);
            }
            log.info('Captcha were solved and waiting is over, refreshing: ' + host);
            return instance(response.request.options);
          }

          challengeInProgress[host] = true;
          const captchaData = await solveCaptcha(response).finally(() => {
            setTimeout(() => {
              if (challengeInProgress[host]) {
                log.info('Clear captcha in progress: ' + host);
                delete challengeInProgress[host];
              }
            }, 2000);
          });

          // Submit captcha data
          if (captchaData) {
            log.info('Submit captcha: ' + captchaData.url);
            return instance({
              ...response.request.options,
              ...captchaData,
              captchaRetry: response.request.options.captchaRetry - 1,
              ignoreInProgress: true,
            });
          }
        }

        return response;
      },
    ],
  },
  mutableDefaults: true, // Defines if config can be changed later
});

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);
const instances = [captcha, ensureUserAgent, userAgentHeaders];
if(nodeMajorVersion >= 12) {
  instances.push(userAgentSsl);
}
else {
  log.warn('User agent SSL emulation is only available in Node v12+');
}
// header capitalization should come last, because it changes headers from an object to an array
instances.push(capitalizedHeaders);

const instance = got.extend(...instances);

module.exports = instance;
