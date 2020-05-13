const got = require('got');
const delay = require('./delay');
const log = require('./logging');

// docs: https://2captcha.com/2captcha-api
const API_2CAPTCHA = 'https://2captcha.com';
const API_RUCAPTCHA = 'https://rucaptcha.com';

const solve = async ({ rucaptcha, key, pageurl, sitekey, method = 'hcaptcha' }) => {
  // Post captcha information
  console.log(`[info] Solving ${method} at ${pageurl}`);
  const response = await got.post(rucaptcha ? API_RUCAPTCHA : API_2CAPTCHA + '/in.php', {
    json: {
      key,
      sitekey,
      pageurl,
      method,
      json: 1,
    },
    responseType: 'json',
  });
  if (response.body.status === 0) {
    log.error(response.body.request);
    throw new Error(response.body.request);
  }

  // Retrive captcha result once solved
  let maxAttempt = 60; // 3 min
  await delay(10000); // Wait 10 seconds

  // Fetch captcha response
  while (maxAttempt > 0) {
    maxAttempt--;
    log.info(`Looking for captcha response, remaining attempt: ${maxAttempt}, page: ${pageurl}`);
    const { body } = await got.get(
      `https://2captcha.com/res.php?key=${key}&action=get&id=${response.body.request}&json=1`,
      {
        responseType: 'json',
      }
    );
    if (body.status === 1 && body.request) {
      log.info('Captcha response received: ' + pageurl);
      return body.request;
    }
    await delay(3000); // 3 seconds
  }

  // After 3 min and 10 seconds
  throw new Error(`Captcha timeout for ${pageurl}, sitekey: ${sitekey}`);
};

// report = bad - report incorrectly solved captcha
// report = good - confirm correct answer
const report = async ({ rucaptcha, key, id, report = 'bad' }) => {
  const { body } = await got.get(
    `${rucaptcha ? API_RUCAPTCHA : API_2CAPTCHA}/res.php?key=${key}&action=report${report}&id=${id}`
  );
  return body; // return OK_REPORT_RECORDED or an error code if something went wrong.
};

const balance = async ({ rucaptcha, key, id, type = 'getbalance' }) => {
  const { body } = await got.get(
    `${rucaptcha ? API_RUCAPTCHA : API_2CAPTCHA}/res.php?key=${key}&action=${type}${id ? '&id' + id : ''}`
  );
  return body; // '2.73688'
};

module.exports = { solve, report, balance };
