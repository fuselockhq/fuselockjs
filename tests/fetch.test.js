const assert = require('assert');
const {getNodeMajorVersion} = require('../src/fuselock-utils');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");
const NODE_18 = getNodeMajorVersion() >= 18;

NODE_18 && !FUSELOCK_E2E && describe('fetch', () => {
	it('should succeed fetch requests ', (done) => {
		// without fuselock, request to google.com should succeed
		fetch('http://www.google.com')
			.then(res => {
				assert.ok(res.status >= 200 && res.status < 400);
				done();
			})
			.catch(err => {
				done(err);
			});
	});
});

NODE_18 && FUSELOCK_E2E && describe("fetch+fuselock", () => {
	it('should succeed fetch requests not blocked', (done) => {
		// with fuselock, request to example.com should succeed
		fetch('http://www.example.com')
			.then(res => {
				assert.ok(res.status >= 200 && res.status < 500, `Expected successful status code, got ${res.status}`);
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	it('should block fetch get requests', (done) => {
		// with fuselock, request to google.com should fail
		fetch('http://www.google.com')
			.then(res => {
				done(new Error("request was supposed to fail"));
			})
			.catch(err => {
				console.log("Successfully blocked fetch get request");
				assert.ok(err instanceof Error);
				assert.equal("fetch failed", err.message);
				assert.ok(err.cause instanceof Error);
				assert.ok(err.cause.message.includes("getaddrinfo ENOTFOUND www.google.com"), "got " + err.message);
				done();
			})
			.catch(err => {
				// this second catch is never reached because the first catch doesn't rethrow
				done(err);
			});
	});
});
