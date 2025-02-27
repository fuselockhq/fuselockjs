const assert = require('assert');
const http = require('http');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

!FUSELOCK_E2E && describe('http', () => {
	it('should succeed http requests ', (done) => {
		// without fuselock, request to google.com should succeed
		http.get('http://www.google.com', (res) => {
			res.resume();
			assert.ok(res.statusCode >= 200 && res.statusCode < 400);
			done();
		});
	});
});

FUSELOCK_E2E && describe("http+fuselock", () => {
	it('should succeed http get requests not blocked', (done) => {
		// with fuselock, request to example.com should succeed
		const r = http.get('http://www.example.com', (res) => {
			res.resume();
			assert.ok(res.statusCode >= 200 && res.statusCode < 500, `Expected successful status code, got ${res.statusCode}`);
			done();
		});
		r.end();
	});

	it('should succeed http post requests not blocked', (done) => {
		// with fuselock, request to example.com should succeed
		const r = http.request('http://www.example.com', (res) => {
			res.resume();
			assert.ok(res.statusCode >= 200 && res.statusCode < 500, `Expected successful status code, got ${res.statusCode}`);
			done();
		});
		r.end();
	});

	it('should block http get requests', (done) => {
		// with fuselock, request to google.com should fail
		http
			.get('http://www.google.com', (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND http://www.google.com"));
				done();
			});
	});

	it('should block http get requests with options (host)', (done) => {
		// with fuselock, request to google.com should fail
		http
			.get({ host: 'http://www.google.com' }, (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND http://www.google.com"));
				done();
			});
	});

	it('should block http get requests with options (hostname)', (done) => {
		// with fuselock, request to google.com should fail
		http
			.get({ hostname: 'http://www.google.com' }, (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND http://www.google.com"));
				done();
			});
	});

	it('should block http post requests', (done) => {
		// with fuselock, request to google.com should fail
		http
			.request('http://www.google.com', { method: 'POST' }, (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND http://www.google.com"));
				done();
			});
	});

	it('should block http post requests with options', (done) => {
		// with fuselock, request to google.com should fail
		http
			.request({ hostname: 'http://www.google.com', method: 'POST' }, (res) => {
				res.resume();
				done(new Error("request was supposed to fail"));
			})
			.on("error", (err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes("getaddrinfo ENOTFOUND http://www.google.com"));
				done();
			});
	});
});
