const got = require('got');
const delay = require('./delay');

const solve = async ({ key, pageurl, sitekey, method = 'h' }) => {
  // Post captcha information
  console.log(`[info] Solving ${method} at ${pageurl}`);
  const response = await got.post('https://2captcha.com/in.php', {
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

module.exports = { solve };
