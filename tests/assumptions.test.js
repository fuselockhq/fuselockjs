const assert = require('assert');
const http = require('http');
const https = require('https');

/** 
 * These tests here make sure that our assumptions about nodejs api are valid. For example,
 * instead of hooking http.request and https.request methods (and their variants), we make sure
 * that all supported versions of nodejs have their http.request implementation call net.Socket.connect.
 */
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


