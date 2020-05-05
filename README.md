## hooman ![Build Status](https://img.shields.io/travis/sayem314/hooman.svg?style=flat-square&label=daily+builds)

An http interceptor using got to bypass cloudflare ddos protection on nodejs.

![](https://github.com/sayem314/hooman/raw/master/screenshot.png)

## Install

```shell
# with npm: npm i hooman got
yarn add hooman got
```

> got is peer-dependencies

## Usage

```js
const got = require("hooman");

got("https://sayem.eu.org")
  .then(response => {
    console.log(response.body);
  })
  .catch(error => {
    console.error(error);
  });
```

All methods and props of [got](https://github.com/sindresorhus/got) should work fine.
