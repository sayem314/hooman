const got = require('got');

const onCaptcha = async ({ pageurl, sitekey, method }) => {
  try {
    const { host } = new URL(pageurl);
    console.log(`[info] Solving ${method} at ${host} for free!`);

    let response,
      retry = 3;
    while ((!response || !response.body.pass) && retry > 0) {
      retry--;
      response = await got(`https://harvest.caddy.eu.org/solve/${host}/${sitekey}`, { responseType: 'json' });
    }

    return response.body.generated_pass_UUID;
  } catch (e) {
    console.log(e.message);
  }
};

module.exports = onCaptcha;
