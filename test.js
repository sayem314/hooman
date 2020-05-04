const test = require("ava");
const scrape = require(".");

test("real world test", async t => {
  t.timeout(1000 * 30);
  const { body } = await scrape("https://cf-js-challenge.sayem.eu.org");
  t.is(body.includes("sayem314"), true);
});
