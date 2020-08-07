### v1.2.6

- Fixed issue related with v1 challenge

### v1.2.5

- Fixed new challenge [#18](https://github.com/sayem314/hooman/issues/18)

### v1.2.4

- Added custom captcha handler
- Replaced `vm2` with native `vm` to support electron [#16](https://github.com/sayem314/hooman/issues/16)

### v1.2.3

- Hooman was unable to bypass some websites which were using captcha and more strict firewall rules. It's fixed now.
- You can now optionally set environment variable `HOOMAN_CAPTCHA_KEY` and `HOOMAN_RUCAPTCHA` to solve captchas.

### v1.2.2

- Wait on captcha instead of throwing error. Fix [#11](https://github.com/sayem314/hooman/issues/11)
- Fixed hang on multiple requests at once
- Added debug logging, enable with environment variable `HOOMAN_DEBUG=true`
- Handle large requests to same site when challenge solving in progress

### v1.2.1

- Fixed [#9](https://github.com/sayem314/hooman/issues/9)
- Fixed proxy issue [#10](https://github.com/sayem314/hooman/issues/11)
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
