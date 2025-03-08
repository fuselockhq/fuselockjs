const assert = require('assert');
const fs = require('fs');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

!FUSELOCK_E2E && describe('fs', () => {
});

FUSELOCK_E2E && describe("fs+fuselock", () => {

	const assertFileNotFound = (err) => {
		assert.ok(err instanceof Error);
		assert.ok(err.message.includes("ENOENT"), "err.message: " + err.message);
		assert.ok(err.code === "ENOENT");
		assert.ok(err.syscall === "open");
		assert.ok(err.path === "/etc/passwd");
		assert.ok(err.errno === -2);
	}

	const assertUndefined = (value) => {
		assert.ok(typeof value === 'undefined');
	}

	it('should block readFile', (done) => {
		const stream = fs.readFile('/etc/passwd', (err, data) => {
			assert.ok(err !== null);
			assertFileNotFound(err);
			done();
		});

		assert.ok(typeof stream === 'undefined');
	});

	it('should block readFile with options', (done) => {
		const stream = fs.readFile('/etc/passwd', {encoding: 'utf8'}, (err, data) => {
			assert.ok(err !== null);
			assertUndefined(data);
			assertFileNotFound(err);
			done();
		});

		assertUndefined(stream);
	});

	it('should block readFileSync', (done) => {
		try {
			fs.readFileSync('/etc/passwd');
			done(new Error("readFileSync should have failed"));
		} catch (err) {
			assertFileNotFound(err);
			done();
		}
	});

	it('should block copyFile', (done) => {
		fs.copyFile('/etc/passwd', '/tmp/.fuselock-test-file', (err, res) => {
			assertFileNotFound(err);
			assertUndefined(res);
			assert.equal(err.message, "ENOENT: no such file or directory, copyfile '/etc/passwd' -> '/tmp/.fuselock-test-file'");
			done();
		});
	});

	it('should block copyFileSync', (done) => {
		try {
			fs.copyFileSync('/etc/passwd', '/tmp/.fuselock-test-file');
			done(new Error("copyFileSync should have failed"));
		} catch (err) {
			assertFileNotFound(err);
			assert.equal(err.message, "ENOENT: no such file or directory, copyfile '/etc/passwd' -> '/tmp/.fuselock-test-file'");
			done();
		}
	});

	it('should handle copyFile with no callback', (done) => {
		try {
			fs.copyFile('/etc/passwd', '/tmp/.fuselock-test-file');
			done(new Error("copyFile should have failed"));
		} catch (err) {
			assert.ok(err instanceof Error);
			if (process.version.startsWith("v14")) {
				assert.ok(err.message.includes(`Callback must be a function. Received undefined`), "err.message: " + err.message);
			} else {
				assert.ok(err.message.includes(`The "cb" argument must be of type function. Received undefined`), "err.message: " + err.message);
			}
			done();
		}
	});
});
