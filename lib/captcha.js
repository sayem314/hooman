const captcha = require('./2captcha');
const { JSDOM } = require('jsdom');

const solve = async (response) => {
  const sitekey = response.body.match(/\sdata-sitekey=["']?([^\s"'<>&]+)/);

  if (sitekey && sitekey[1]) {
    // Parse html
    const { document } = new JSDOM(response.body).window;

    // Form submit data
    const input = document.getElementsByTagName('input');
    const body = [];
    for (const i of input) {
      body.push(i.name + '=' + encodeURIComponent(i.value));
    }

    // Solve if captcha method is found: g/h
    const captchaMethod = body.find((i) => i.includes('cf_captcha_kind'));
    if (captchaMethod === 'cf_captcha_kind=h' || captchaMethod === 'cf_captcha_kind=g') {
      const { rucaptcha, captchaKey, onCaptcha } = response.request.options;
      const captchaOptions = {
        key: captchaKey,
        pageurl: response.url,
        sitekey: sitekey[1],
        method: captchaMethod.split('=')[1] + 'captcha',
      };
      const captchaResponse = onCaptcha
        ? await onCaptcha(captchaOptions)
        : await captcha.solve({ ...captchaOptions, rucaptcha });

      if (captchaResponse && typeof captchaResponse === 'string') {
        body.push('g-captcha-response=' + captchaResponse);
        if (captchaMethod === 'cf_captcha_kind=h') {
          body.push('h-captcha-response=' + captchaResponse);
        }

        const baseUrl = response.url.substring(0, response.url.lastIndexOf('/'));
        const { method, action, enctype } = document.getElementById('challenge-form');
        return {
          method,
          url: action.startsWith('/') ? baseUrl + action : action,
          headers: {
            'content-type': enctype, // application/x-www-form-urlencoded
          },
          body: body.join('&'),
        };
      }
    }
  }
};

module.exports = solve;
