import hooman from '../hooman.js';
import assert from 'node:assert';
import { writeFileSync, statSync } from 'node:fs';

// Test URL
const hCaptchaPage = 'https://cf-captcha.sayem.eu.org';
const jsChallengePage = 'https://cf-js-challenge.sayem.eu.org';

let legacyChallenge = false;

const fetchHtml = async () => {
  const response = await hooman(jsChallengePage);
  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.body, 'string');
  assert.equal(response.isFromCache, false);
  assert(response.body.includes('sayem314'));
};

describe('- real world test', () => {
  before(async function () {
    this.timeout(1000 * 30);
    // Cloudflare retired the 2017 era "I'm Under Attack" jschl-answer page this
    // library solves. The endpoints still sit behind Cloudflare but serve the
    // modern managed challenge, which is a different beast entirely. Skip the
    // challenge tests with a clear reason when the legacy format is gone.
    try {
      const response = await hooman(jsChallengePage, {
        throwHttpErrors: false,
        context: { cloudflareRetry: 0 },
      });
      legacyChallenge =
        response.statusCode === 503 && response.body.includes('jschl-answer') && response.body.includes('var s');
    } catch {
      legacyChallenge = false;
    }
    if (!legacyChallenge) {
      console.warn('\n  endpoint no longer serves the legacy js-challenge format, challenge tests are skipped');
    }
  });

  // Runs every challenge test only when the legacy format is actually served
  const challengeTest = (title, fn, timeout) => {
    it(title, function () {
      if (!legacyChallenge) {
        this.skip();
      }
      return fn();
    }).timeout(timeout);
  };

  challengeTest('should return html', fetchHtml, 1000 * 30);

  // should fetch within 4 seconds
  challengeTest('should respect cookies', fetchHtml, 1000 * 4);

  challengeTest(
    'should download images',
    async () => {
      const response = await hooman(jsChallengePage + '/images/background.jpg', {
        responseType: 'buffer',
      });
      assert.equal(response.statusCode, 200);
      assert(Buffer.isBuffer(response.body));

      // Write image to file
      writeFileSync('image.jpg', response.body);

      // Check image size
      const { size } = statSync('image.jpg');
      assert.equal(size, 31001);
    },
    1000 * 5
  );

  // Happy path without any cloudflare in front, always runs
  it('should fetch a plain page', async () => {
    const response = await hooman('https://example.com/');
    assert.equal(response.statusCode, 200);
    assert(typeof response.body === 'string');
    assert(response.body.includes('Example Domain'));
  }).timeout(1000 * 15);

  if (process.env.CAPTCHA_API_KEY) {
    it('should solve captchas', async () => {
      const response = await hooman(hCaptchaPage, { context: { captchaKey: process.env.CAPTCHA_API_KEY } });
      assert.equal(response.statusCode, 200);
      assert.equal(typeof response.body, 'string');
      assert.equal(response.isFromCache, false);
      assert(response.body.includes('sayem314'));
    }).timeout(1000 * 200); // 3 min and 20 sec
  }
});
