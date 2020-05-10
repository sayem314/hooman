const hooman = require("../");
const assert = require("assert");
const { writeFileSync, statSync } = require("fs");

// Test URL
const jsChallengePage = "https://cf-js-challenge.sayem.eu.org";

const fetchHtml = async () => {
  const response = await hooman(jsChallengePage);
  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.body, "string");
  assert.equal(response.isFromCache, false);
  assert(response.body.includes("sayem314"));
};

describe("- real world test", () => {
  // solve challenge within 15 seconds
  it("should return html", fetchHtml).timeout(15000);

  // should fetch within 4 seconds
  it("should respect cookies", fetchHtml).timeout(4000);

  it("should download images", async () => {
    const response = await hooman(jsChallengePage + "/images/background.jpg", {
      responseType: "buffer"
    });
    assert.equal(response.statusCode, 200);
    assert(Buffer.isBuffer(response.body));

    // Write image to file
    writeFileSync("image.jpg", response.body);

    // Check image size
    const { size } = statSync("image.jpg");
    assert.equal(size, 31001);
  }).timeout(5000);
});
