const assert = require('assert');
const axios = require('axios');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

!FUSELOCK_E2E && describe('axios', () => {
	!FUSELOCK_E2E && it('should succeed http requests ', (done) => {
		// use axios to make http requests
		axios.get('http://www.google.com')
			.then((res) => {
				assert.ok(res.status >= 200 && res.status < 400);
				done();
			})
			.catch((err) => {
				done(err);
			});
	});
});

FUSELOCK_E2E && describe('axios+fuselock', () => {
	it('should verify that axios is calling http transport', (done) => {
		const http = require('http');
		const originalRequest = http.request;
		let requestCalled = false;

		http.request = function (...args) {
			requestCalled = true;
			return originalRequest.apply(this, args);
		};

		axios.get('http://www.example.com')
			.then((res) => {
				http.request = originalRequest;
				assert.ok(requestCalled, 'http.request was not called by axios');
				done();
			})
			.catch((err) => {
				http.request = originalRequest;
				done(err);
			})
	});

	it('should block axios http requests with exception', (done) => {
		axios.get('http://www.google.com')
			.then((res) => {
				done(new Error('Expected error, got response ' + JSON.stringify(res)));
			})
			.catch((err) => {
				assert.ok(err.message.includes('ENOTFOUND'), "got " + err.message);
				done();
			});
	});
});
