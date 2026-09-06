# Unreleased

- Stack modernization release. hooman is now a native ESM package (`import hooman from 'hooman'`), drop-in `require()` is gone along with CommonJS.
- `got` peer dependency bumped to `>=16` (ESM only, requires Node >= 24).
- Custom options (`cloudflareRetry`, `notFoundRetry`, `captchaRetry`, `onCaptcha`, `captchaKey`, `rucaptcha`) moved into got's `context` object, because got v12+ rejects unknown top-level options. Pass them per request as `{ context: { captchaKey: '...' } }`.
- Dependencies refreshed: jsdom 30, tough-cookie 6, user-agents 2. Dev tooling: eslint 10 flat config, mocha 12.
- Node >= 24 required (current LTS line), CI matrix 24 and 26.
- Real-world challenge tests now detect whether the target still serves the legacy IUAM format and skip with a reason when it does not (Cloudflare retired it), an always-run plain-page test covers the happy path.

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
