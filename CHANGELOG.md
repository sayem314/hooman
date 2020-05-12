### v1.2.1

- Fixed #9
- Fixed proxy issue #10
- Added support for rucaptcha
- Refactored captcha code

### v1.2.0

- Refactored code
- Added 2captcha support

### v1.1.1

- Faster and better sandbox code execution
- Added the ability to specify custom retry limit for Cloudflare challenges

```js
// Example
const { body } = await got(url, {
  cloudflareRetry: 8, // default 5
});
```

### v1.1.1

- Faster and better sandbox code execution
- Added the ability to specify custom retry limit for Cloudflare challenges

```js
// Example
const { body } = await got(url, {
  cloudflareRetry: 8, // default 5
});
```

### v1.1.0

- Added vm2 to run code safely
- got as peer dependencies

### v1.0.0

- Initial commit
