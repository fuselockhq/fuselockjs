const assert = require('assert');
const https = require('https');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

!FUSELOCK_E2E && describe('https', () => {
	it('should succeed https requests ', (done) => {
		https.get('https://www.google.com', (res) => {
			res.resume();
			assert.ok(res.statusCode >= 200 && res.statusCode < 400);
			done();
		});
	});
});

FUSELOCK_E2E && describe("https+fuselock", () => {
	it('should succeed https get requests not blocked', (done) => {
		https.get('https://www.example.com', (res) => {
			res.resume();
			assert.ok(res.statusCode >= 200 && res.statusCode < 400, `Expected successful status code, got ${res.statusCode}`);
			done();
		});
	});

	it('should block https get requests', (done) => {
		https
			.get('https://www.google.com', (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND https://www.google.com"));
				done();
			});
	});

	it('should block https post requests', (done) => {
		// with fuselock, request to google.com should fail
		https
			.request('https://www.google.com', { method: 'POST' }, (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND https://www.google.com"));
				done();
			});
	});

	it('should block https post requests with options', (done) => {
		// with fuselock, request to google.com should fail
		https
			.request({ hostname: 'https://www.google.com', method: 'POST' }, (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND https://www.google.com"));
				done();
			});
	});
});
