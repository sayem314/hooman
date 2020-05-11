'use strict';
const got = require('got');
const solve = require('./lib/core');
const UserAgent = require('user-agents');
const captcha = require('./lib/2captcha');
const { CookieJar } = require('tough-cookie');
const { JSDOM } = require('jsdom');

// Got instance to handle cloudflare bypass
const instance = got.extend({
  cookieJar: new CookieJar(), // Automatically parse and store cookies
  retry: {
    limit: 2,
    statusCodes: [408, 413, 429, 500, 502, 504, 521, 522, 524],
  }, // Do not retry 503, we will handle it
  cloudflareRetry: 5, // Prevent cloudflare loop
  notFoundRetry: 1, // Handle redirect issue
  captchaRetry: 1,
  captchaKey: null,
  http2: true, // Use recommended protocol
  headers: {
    'cache-control': 'max-age=0',
    'upgrade-insecure-requests': '1',
    'user-agent': new UserAgent().toString(), // Use random user agent between sessions
  }, // Mimic browser environment
  hooks: {
    beforeRequest: [
      (options) => {
        // Add required headers to mimic browser environment
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
          response.body.includes('jschl-answer')
        ) {
          // Solve js challange
          if (response.request.options.cloudflareRetry > 0) {
            const data = await solve(response.url, response.body);
            response.request.options.cloudflareRetry--;
            return instance({ ...response.request.options, ...data });
          }
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
          // Solve hCaptcha
          // Find captcha kind and site-key
          const sitekey = response.body.match(/\sdata-sitekey=["']?([^\s"'<>&]+)/);
          if (sitekey) {
            const { document } = new JSDOM(response.body).window;
            const input = document.getElementsByTagName('input');
            const body = [];
            for (const i of input) {
              body.push(i.name + '=' + encodeURIComponent(i.value));
            }
            const captchaMethod = body.find((i) => i.includes('cf_captcha_kind'));
            if (captchaMethod) {
              const captchaResponse = await captcha.solve({
                key: response.request.options.captchaKey,
                pageurl: response.url,
                sitekey: sitekey[1],
                method: captchaMethod.split('=')[1] + 'captcha',
              });
              body.push('g-captcha-response=' + captchaResponse);
              if (captchaMethod === 'cf_captcha_kind=h') {
                body.push('h-captcha-response=' + captchaResponse);
              }

              const baseUrl = response.url.substring(0, response.url.lastIndexOf('/'));
              const { method, action, enctype } = document.getElementById('challenge-form');
              return instance({
                method,
                url: action.startsWith('/') ? baseUrl + action : action,
                headers: {
                  'content-type': enctype, // application/x-www-form-urlencoded
                },
                body: body.join('&'),
                captchaRetry: response.request.options.captchaRetry - 1,
              });
            }
          }
        }

        return response;
      },
    ],
  },
  mutableDefaults: true, // Defines if config can be changed later
});

module.exports = instance;
