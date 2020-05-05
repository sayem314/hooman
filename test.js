const test = require("tape");
const scrape = require(".");

const jsChallengePage = "https://cf-js-challenge.sayem.eu.org";

// First run might take upto 15 seconds
// For most users shouldn't take more than 5 seconds
test("real world test #1", async t => {
  console.time("1st run");
  const { body } = await scrape(jsChallengePage);
  console.timeEnd("1st run");

  // Check if response is served correctly
  // If not expected response, fail test
  t.equal(typeof body, "string");
  t.ok(body.includes("sayem314"));
});

// Second run shouldn't take more than 4 seconds even on slow connection
test("real world test #2", async t => {
  console.time("2nd run");
  const timeMs = Date.now();
  const response = await scrape(jsChallengePage);
  console.timeEnd("2nd run");

  // Check if response was served withing 4 seconds
  // If response was served in time it means cookies are respected
  t.ok(Date.now() - timeMs < 4000);
  t.equal(typeof response.body, "string");

  // Check if it's a fresh copy or from cache
  // If served from cache, fail test
  t.notOk(response.isFromCache);
  t.ok(response.body.includes("sayem314"));
});
