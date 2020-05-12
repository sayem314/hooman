const hooman = require('../');
const assert = require('assert');
const { writeFileSync, statSync } = require('fs');

// Test URL
const hCaptchaPage = 'https://cf-captcha.sayem.eu.org';
const jsChallengePage = 'https://cf-js-challenge.sayem.eu.org';

const fetchHtml = async () => {
  const response = await hooman(jsChallengePage);
  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.body, 'string');
  assert.equal(response.isFromCache, false);
  assert(response.body.includes('sayem314'));
};

describe('- real world test', () => {
  // solve challenge within 20 seconds
  it('should return html', fetchHtml).timeout(1000 * 30);

  // should fetch within 4 seconds
  it('should respect cookies', fetchHtml).timeout(1000 * 4);

  it('should download images', async () => {
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
  }).timeout(1000 * 5);

  if (process.env.CAPTCHA_API_KEY) {
    it('should solve captchas', async () => {
      const response = await hooman(hCaptchaPage, { captchaKey: process.env.CAPTCHA_API_KEY });
      assert.equal(response.statusCode, 200);
      assert.equal(typeof response.body, 'string');
      assert.equal(response.isFromCache, false);
      assert(response.body.includes('sayem314'));
    }).timeout(1000 * 200); // 3 min and 20 sec
  }
});
