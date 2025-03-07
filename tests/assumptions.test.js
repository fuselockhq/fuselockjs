const assert = require('assert');
const http = require('http');
const https = require('https');

describe('assumptions', () => {

	it('should verify that http.request calls net.Socket.connect', (done) => {
		const net = require('net');
		const originalConnect = net.Socket.prototype.connect;
		
		let connectWasCalled = false;
		
		net.Socket.prototype.connect = function (...args) {
			connectWasCalled = true;
			return originalConnect.apply(this, args);
		};
		
		const req = http.request('http://example.com', (res) => {
			assert.strictEqual(connectWasCalled, true);
			net.Socket.prototype.connect = originalConnect;
			res.resume();
			done();
		});
		
		req.on('error', (err) => {
			net.Socket.prototype.connect = originalConnect;
			done(err);
		});
		
		req.end();
	});

	it('should verify that https.request calls net.Socket.connect', (done) => {
		const net = require('net');
		const originalConnect = net.Socket.prototype.connect;
		
		let connectWasCalled = false;
		
		net.Socket.prototype.connect = function (...args) {
			connectWasCalled = true;
			return originalConnect.apply(this, args);
		};
		
		const req = https.request('https://example.com', (res) => {
			assert.strictEqual(connectWasCalled, true);
			net.Socket.prototype.connect = originalConnect;
			res.resume();
			done();
		});
		
		req.on('error', (err) => {
			net.Socket.prototype.connect = originalConnect;
			done(err);
		});
		
		req.end();
	});
});


