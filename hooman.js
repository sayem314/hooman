'use strict';
const got = require('got');
const solveChallenge = require('./lib/core');
const solveCaptcha = require('./lib/captcha');
const delay = require('./lib/delay');
const log = require('./lib/logging');
const { CookieJar } = require('tough-cookie');
const UserAgent = require('user-agents');

const cookieJar = new CookieJar(); // Automatically parse and store cookies
const challengeInProgress = {};

// Got instance to handle cloudflare bypass
const instance = got.extend({
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
  headers: {
    'accept-encoding': 'gzip, deflate',
    'accept-language': 'en-US,en;q=0.5',
    'cache-control': 'max-age=0',
    'upgrade-insecure-requests': '1',
    'user-agent': new UserAgent().toString(), // Use random user agent between sessions
  }, // Mimic browser environment
  hooks: {
    beforeRequest: [
      async (options) => {
        // In case the host is in challenge progress wait
        while (challengeInProgress[options.url.host]) {
          await delay(1000);
        }

        // Add required headers to mimic browser environment
        options.headers.host = options.url.host;
        options.headers.origin = options.url.origin;
        options.headers.referer = options.url.href;
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

module.exports = instance;
