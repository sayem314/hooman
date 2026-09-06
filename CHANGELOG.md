# Unreleased

- Added TypeScript declarations (`hooman.d.ts`, `lib/types.d.ts`): the default export and every HTTP alias are typed, hooman's custom options are exposed as `HoomanContext` and `HoomanOptions`. The JavaScript sources stay untouched.
- New `npm run test:types` script checks the declarations with `tsc --strict` against every usage pattern from the README, wired into `npm test`.

# 1.2.6

- Fixed issue related with v1 challenge
