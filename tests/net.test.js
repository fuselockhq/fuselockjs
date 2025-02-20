const assert = require('assert');
const fs = require('fs');
const net = require('net');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

!FUSELOCK_E2E && describe('net', () => {
	it('should succeed net socket connections', (done) => {
		// without fuselock, connection to google.com should succeed
		const socket = new net.Socket();
		socket.connect(80, 'www.google.com', () => {
			socket.end();
			done();
		});
		socket.on('error', done);
	});

	it('should succeed with connection options object', (done) => {
		const socket = new net.Socket();
		socket.connect({
			host: 'www.google.com',
			port: 80
		}, () => {
			socket.end();
			done();
		});
		socket.on('error', done);
	});

	it('should succeed local IPC connections', function (done) {
		// FIXME: when running under linux, we need to run socat to create a unix domain socket
		if (!fs.existsSync("/var/run/usbmuxd")) {
			this.skip();
			done();
		}

		const socket = new net.Socket();
		socket.connect('/var/run/usbmuxd', () => {
			socket.end();
			done();
		});

		socket.on('error', (err) => {
			done(err);
		});
	});
});

FUSELOCK_E2E && describe("net+fuselock", () => {
	it('should succeed net connections not blocked', (done) => {
		// with fuselock, connection to example.com should succeed
		const socket = new net.Socket();
		const result = socket.connect(80, 'www.example.com', () => {
			socket.end();
			done();
		});

		// make sure socket.connect returns (this)
		assert.equal(result, socket);

		socket.on('error', (err) => done(err));
	});

	it('should block net connections', (done) => {
		// with fuselock, connection to google.com should fail
		const socket = new net.Socket();
		const result = socket.connect(80, 'www.google.com', () => {
			done(new Error("Allowed this connection to go through"));
		});

		// make sure socket.connect returns (this)
		assert.equal(result, socket);

		socket.on('error', (err) => {
			assert.ok(err instanceof Error);
			assert.ok(err.message.includes("getaddrinfo ENOTFOUND www.google.com"));
			done();
		});
	});

	it('should block connections with options object', (done) => {
		const socket = new net.Socket();
		const result = socket.connect({
			host: 'www.google.com',
			port: 80
		}, () => {
			done(new Error("Allowed this connection to go through"));
		});

		// make sure socket.connect returns (this)
		assert.equal(result, socket);

		socket.on('error', (err) => {
			assert.ok(err instanceof Error);
			assert.ok(err.message.includes("getaddrinfo ENOTFOUND www.google.com"));
			done();
		});
	});

	it('should block local IPC connections', (done) => {

		const socket = new net.Socket();
		const result = socket.connect('/var/run/usbmuxd', () => {
			done(new Error("Allowed this connection to go through"));
		});

		// make sure socket.connect returns (this)
		assert.equal(result, socket);

		socket.on('error', (err) => {
			assert.ok(err instanceof Error);
			assert.ok(err.message.includes("getaddrinfo ENOTFOUND /var/run/usbmuxd"));
			done();
		});
	});
});
