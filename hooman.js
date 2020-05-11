"use strict";
const got = require("got");
const solve = require("./lib/core");
const { CookieJar } = require("tough-cookie");
const UserAgent = require("user-agents");

// Got instance to handle cloudflare bypass
const instance = got.extend({
  cookieJar: new CookieJar(), // Automatically parse and store cookies
  retry: {
    limit: 2,
    statusCodes: [408, 413, 429, 500, 502, 504, 521, 522, 524]
  }, // Do not retry 503, we will handle it
  cloudflareRetry: 5, // Prevent cloudflare loop
  notFoundRetry: 0, // Handle redirect issue
  http2: true, // Use recommended protocol
  headers: {
    "cache-control": "max-age=0",
    "upgrade-insecure-requests": "1",
    "user-agent": new UserAgent().toString() // Use random user agent between sessions
  }, // Mimic browser environment
  hooks: {
    beforeRequest: [
      options => {
        // Add required headers to mimic browser environment
        options.headers.origin = options.url.origin;
        options.headers.referer = options.url.href;
      }
    ],
    afterResponse: [
      async response => {
        if (
          // If site is not hosted on cloudflare skip
          response.statusCode === 503 &&
          response.headers.server === "cloudflare" &&
          response.body.includes("jschl-answer")
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
          response.headers.server === "cloudflare" &&
          response.url.includes("?__cf_chl_jschl_tk")
        ) {
          // Do not retry again
          if (response.request.options.notFoundRetry === 0) {
            return instance({
              url: response.url.split("?__cf_chl_jschl_tk")[0],
              notFoundRetry: response.request.options.notFoundRetry + 1
            });
          }
        }

        return response;
      }
    ]
  },
  mutableDefaults: true // Defines if config can be changed later
});

module.exports = instance;
