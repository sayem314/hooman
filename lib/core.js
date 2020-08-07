'use strict';
const { JSDOM } = require('jsdom');
const vm = require('vm');
const delay = require('./delay');

// Solve challange with this function
const solve = async (url, html) => {
  // Trigger 4 seconds delay and in the meantime solve challenge
  const sleep = delay(4000);

  // Emulate browser dom
  const { document } = new JSDOM(html, { url, referrer: url }).window;

  // Parse script to execute
  let jschl_answer = document.getElementsByTagName('script')[0].textContent;
  let scriptIndex = jschl_answer.indexOf('var s');
  if (scriptIndex > -1) {
    jschl_answer = jschl_answer.substring(scriptIndex);
    jschl_answer = jschl_answer.substring(
      0,
      jschl_answer.indexOf(jschl_answer.includes('return f.submit') ? 'return f.submit' : 'f.submit')
    );
    jschl_answer = jschl_answer.replace('location.', 'document.location.');
    if (jschl_answer.trim().endsWith('return')) {
      jschl_answer = jschl_answer.split('\n');
      jschl_answer.pop();
      jschl_answer = jschl_answer.join('\n');
    }

    // Retrive answers from form to submit challenge
    const body = [];
    vm.runInNewContext(
      `${jschl_answer}
    // Retrive answers from form to submit challenge
    const input = document.getElementsByTagName("input");
    for (const i of input) {
      body.push(i.name + "=" + encodeURIComponent(i.value));
    }`,
      {
        document,
        body,
        setInterval: () => {},
      }
    );

    // Parse request information
    const { method, action, enctype } = document.getElementById('challenge-form');

    // Wait until delay is finished
    await sleep;

    // Return network request data
    return {
      method, // POST
      url: action, // Challange submit URL
      headers: {
        'content-type': enctype, // application/x-www-form-urlencoded
      },
      body: body.join('&'), // r=value&jschl_vc=value&pass=value&jschl_answer=value
    };
  }
};

module.exports = solve;
