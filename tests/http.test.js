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

	it('should succeed http requests with simple-http-listen', (done) => {
		const simpleHttpListen = require('./helpers/http/simple-http-listen');
		const server = simpleHttpListen(3000, () => {
			server.close();
			done();
		});
	});
});

FUSELOCK_E2E && describe("http+fuselock", () => {
	it('should succeed http requests not blocked', (done) => {
		// with fuselock, request to microsoft.com should succeed
		http.get('http://www.example.com', (res) => {
			res.resume();
			assert.ok(res.statusCode >= 200 && res.statusCode < 400, `Expected successful status code, got ${res.statusCode}`);
			done();
		});
	});

	it('should block http requests', (done) => {
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
});
