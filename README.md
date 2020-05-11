## hooman ![Build Status](https://img.shields.io/travis/sayem314/hooman.svg?style=flat-square&label=daily+builds)

HTTP interceptor using got to bypass Cloudflare DDOS protection / JavaScript challenge on Node.js

![](https://github.com/sayem314/hooman/raw/master/screenshot.png)

## Install

```shell
# with npm: npm i hooman got
yarn add hooman got
```

> got is peer-dependencies

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

#### API

Please see available [API here](https://github.com/sindresorhus/got/blob/master/readme.md#api).

> All methods and props of [got](https://github.com/sindresorhus/got) should work fine.

> > Note that hooman cannot solve captcha (Error Code 403) yet!

## Donations

If you want to show your appreciation, you can donate me [here](https://sayem.eu.org/donate). Thanks!

> Made with :heart: & :coffee: by Sayem
