# 2.0.0

- Version bumped for the breaking stack modernization below.
- Dependencies are pinned to exact versions (no caret ranges) to reduce supply-chain risk. `package-lock.json` locks the transitive tree, and the `got` peer dependency stays a floor range since consumers install and resolve it themselves.
- Added TypeScript declarations (`hooman.d.ts`, `lib/types.d.ts`): the default export and every HTTP alias are typed, hooman's custom options are exposed as `HoomanContext` and `HoomanOptions`. The JavaScript sources stay untouched.
- New `npm run test:types` script checks the declarations with `tsc --strict` against every usage pattern from the README, wired into `npm test`.

# 1.2.6

- Fixed issue related with v1 challenge
