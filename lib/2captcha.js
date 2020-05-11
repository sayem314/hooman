const got = require('got');
const delay = require('./delay');

// https://2captcha.com/2captcha-api
const API_URL = 'https://2captcha.com';

const solve = async ({ key, pageurl, sitekey, method = 'h' }) => {
  // Post captcha information
  console.log(`[info] Solving ${method} at ${pageurl}`);
  const response = await got.post(API_URL + '/in.php', {
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
    throw new Error(response.body.request);
  }

  // Retrive captcha result once solved
  let maxAttempt = 45; // 2 min
  await delay(10000); // Wait 10 seconds

  // Fetch captcha response
  while (maxAttempt > 0) {
    maxAttempt--;
    // console.log("Remaining captch response attempt: " + maxAttempt);
    const { body } = await got.get(
      `https://2captcha.com/res.php?key=${key}&action=get&id=${response.body.request}&json=1`,
      {
        responseType: 'json',
      }
    );
    if (body.status === 1 && body.request) {
      return body.request;
    }
    await delay(3000); // 3 seconds
  }

  // After 2 min and 10 seconds
  throw new Error(`Captcha timeout for ${pageurl}, sitekey: ${sitekey}`);
};

// report = bad - report incorrectly solved captcha
// report = good - confirm correct answer
const report = async (key, id, report = 'bad') => {
  const { body } = await got.get(`${API_URL}/res.php?key=${key}&action=report${report}&id=${id}`);
  return body; // return OK_REPORT_RECORDED or an error code if something went wrong.
};

const balance = async (key, id, type = 'getbalance') => {
  const { body } = await got.get(`${API_URL}/res.php?key=${key}&action=${type}${id ? '&id' + id : ''}`);
  return body; // '2.73688'
};

module.exports = { solve, report, balance };
