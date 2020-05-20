## hooman ![JS-Challange](https://github.com/sayem314/hooman/workflows/JS-Challenge/badge.svg)

HTTP interceptor using got to bypass Cloudflare DDOS protection / JavaScript challenge on Node.js

|                           JS-Challange                            |                            hCaptcha                             |
| :---------------------------------------------------------------: | :-------------------------------------------------------------: |
| ![](https://github.com/sayem314/hooman/raw/master/screenshot.png) | ![](https://github.com/sayem314/hooman/raw/master/hCaptcha.png) |

> hooman is not meant for spamming, please use it sanely.

## Install

```shell
# with npm: npm i hooman got
yarn add hooman got
```

> got is peer-dependency

## Usage Example

###### GET HTML

```js
const hooman = require('hooman');

(async () => {
  try {
    const response = await hooman.get('https://sayem.eu.org');
    console.log(response.body);
    //=> '<!doctype html> ...'
  } catch (error) {
    console.log(error.response.body);
    //=> 'Internal server error ...'
  }
})();
```

###### POST JSON

```js
const { body } = await hooman.post('https://httpbin.org/anything', {
  json: {
    hello: 'world',
  },
  responseType: 'json',
});
console.log(body.data);
//=> {hello: 'world'}
```

###### Pipe Stream

```js
// This is mandatory to set cookie first since .stream() doesn't fire hooks
await hooman(jsChallengePage);

// Now we can download files
const image = fs.createWriteStream('image.jpg');
hooman.stream(imageUrl).pipe(image);
```

###### Captcha

```js
const response = await hooman.get(url, {
  captchaKey: '2captcha_or_rucaptcha_api_key',
  rucaptcha: true | false, // optional (default false)
});
console.log(response.body);
```

You can also set environment variable `HOOMAN_CAPTCHA_KEY` and `HOOMAN_RUCAPTCHA`

> All you need to do is provide `captchaKey` and rest is done by hooman. It automatically detects if g/hCaptcha is present and need solving or can be solved. There are console.log print on hit as well.

> Note that if you make multiple request to same site at once only the first request will be sent for captcha solving while other request will be hanged until captcha is solved. You might face multiple trigger to captcha, please monitor your usage. Best practice is to make a dummy request first and let hooman solve captcha and then process further requests.

###### Custom Captcha Handling

```js
const response = await hooman.get(url, {
  // required
  captchaKey: 'your_captcha_api_key',
  // use with captchaKey, should return captcha response string or undefined
  onCaptcha: ({ key, pageurl, sitekey, method }) => {
    // solve captcha here
    return h_captcha_response;
  },
});
console.log(response.body);
```

###### Proxy

```js
const HttpsProxyAgent = require('https-proxy-agent');

const proxy = new HttpsProxyAgent('http://127.0.0.1:3128');

const response = await hooman('https://sayem.eu.org', {
  agent: {
    https: proxy,
  },
});
```

#### API

Please see available [API here](https://github.com/sindresorhus/got/blob/master/readme.md#api).

> All methods and props of [got](https://github.com/sindresorhus/got) should work fine.

## Support

If you open any issue, please respect issue template and provide clean and re-producible example code which can be run without any modification. Low effort issue will be ignored.

---

I don't make any profit with this library. If you want to show your appreciation, you can donate me [here](https://sayem.eu.org/donate) :scream_cat: Thanks! You can also hire me for scraping solution, ping me and we will discuss further :smile:

> Made with :heart: & :coffee: by Sayem
