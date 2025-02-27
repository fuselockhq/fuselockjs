const assert = require('assert');
const childProcess = require('child_process');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

!FUSELOCK_E2E && describe('child_process', () => {

	const assertSuccessfulCommand = (err, stdout, stderr) => {
		assert.equal(err, null);
		assert.equal(stderr, '');
		assert.ok(stdout.split('\n').length > 10);
		assert.ok(stdout.includes('sudo') || stdout.includes("curl"));
	}

	it('should execute commands via exec', (done) => {
		childProcess.exec('ls -l /usr/bin', (err, stdout, stderr) => {
			assertSuccessfulCommand(err, stdout, stderr);
			done();
		});
	});

	it('should execute commands via execFile', (done) => {
		childProcess.execFile('/bin/ls', ['-l', '/usr/bin'], (err, stdout, stderr) => {
			assertSuccessfulCommand(err, stdout, stderr);
			done();
		});
	});

	it('should execute commands via execSync', () => {
		const buffer = childProcess.execSync('ls -l /usr/bin');
		const stdout = buffer.toString();
		assertSuccessfulCommand(null, stdout, '');
	});

	it('should execute commands via execFileSync', () => {
		const buffer = childProcess.execFileSync('/bin/ls', ['-l', '/usr/bin']);
		const stdout = buffer.toString();
		assertSuccessfulCommand(null, stdout, '');
	});

	it('should execute commands via spawn', (done) => {
		const child = childProcess.spawn('/bin/ls', ['-l', '/usr/bin']);
		let stderr = '';
		let stdout = '';

		child.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		child.on('close', (code) => {
			assert.equal(code, 0);
			assertSuccessfulCommand(null, stdout, stderr);
			done();
		});
	});

	it('should execute commands via spawnSync', () => {
		const result = childProcess.spawnSync('/bin/ls', ['-l', '/usr/bin']);
		assert.equal(result.status, 0);
		const stdout = result.stdout.toString();
		assert.ok(stdout.split('\n').length > 10);
		assert.ok(stdout.includes('sudo') || stdout.includes("curl"));
	});

	it('should execute commands via fork', (done) => {
		const child = childProcess.fork(__dirname + '/helpers/child_process/fork-test.js');

		child.on('message', (msg) => {
			assert.equal(msg, 'Hello from child');
			child.kill();
			done();
		});

		child.on('error', (err) => {
			done(err);
		});
	});
});

FUSELOCK_E2E && describe('child_process', () => {

	it('should allow specific commands via exec', (done) => {
		childProcess.exec('/bin/echo -n hello', (err, stdout, stderr) => {
			assert.equal(err, null);
			assert.equal(stdout, 'hello');
			assert.equal(stderr, '');
			done();
		});
	});

	it('throws exception if exec called with null', (done) => {
		try {
			childProcess.exec(null, (err, stdout, stderr) => {
				done(new Error("Expected a TypeErrorexception"))
			});
		} catch (e) {
			assert.ok(e instanceof TypeError);
			assert.equal(e.message, "The \"command\" argument must be of type string. Received null");
			done();
		}
	});

	it('should block commands via exec', (done) => {
		childProcess.exec('/bin/ls -1 /usr/bin', (err, stdout, stderr) => {
			assert.notEqual(err, null);
			assert.equal(stdout, '');
			assert.equal(stderr, '');
			done();
		});
	});

	it('should block commands via execFile', (done) => {
		childProcess.execFile('/bin/ls', ['-1', '/usr/bin'], (err, stdout, stderr) => {
			assert.notEqual(err, null);
			assert.equal(stdout, '');
			assert.equal(stderr, '');
			done();
		});
	});
	
	// TODO: write a test with options.shell = true

	it('should block commands via spawn', (done) => {
		const c = childProcess.spawn('/bin/ls', ['-1', '/usr/bin']);
		c.on("error", (err) => {
			// TODO: add assertions for errno == -2, code == "ENOENT"
			assert.equal(err.message, "spawn /bin/ls -1 /usr/bin ENOENT");
			done();
		});
	});
});
