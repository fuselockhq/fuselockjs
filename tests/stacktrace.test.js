const assert = require('assert');
const path = require('path');
const {innerGetStackTrace, innerGetCallingPackages} = require("./helpers/stacktrace/inner-stack-trace");
const {humanizeStackTrace} = require("../src/fuselock-report");

describe('stacktrace', () => {
	it('gets stack trace', () => {
		const result = innerGetStackTrace();
		assert.ok(result.length >= 2);
		assert.equal(result[0].getScriptNameOrSourceURL(), path.resolve(path.join(__dirname, "helpers/stacktrace/inner-stack-trace.js")));
		assert.equal(result[1].getScriptNameOrSourceURL(), __filename);

		result.forEach(callsite => {
			/** @type {CallSite} callsite */
			// console.log(callsite.getScriptNameOrSourceURL());
		});
	});

	it('parses calling packages from stack trace', () => {
		const packages = innerGetCallingPackages();
		assert.equal(packages.length, 3, "Expected 3 items in stack trace, got: " + JSON.stringify(packages));
		assert.equal(packages[0], `${__dirname}/helpers/stacktrace`);
		assert.equal(packages[1], `${__dirname}`);
		assert.equal(packages[2], path.resolve(path.join(__dirname, "../node_modules/mocha")));
	});

	// it('humanizes stack trace', () => {
	// 	console.dir(new Error());
	// 	const stackTrace = innerGetStackTrace();
	// 	const humanized = humanizeStackTrace(stackTrace);
	// 	assert.equal(humanized, "");
	// });
});
