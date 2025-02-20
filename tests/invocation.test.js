const assert = require('assert');
const childProcess = require('child_process');

const FUSELOCK_E2E = parseInt(process.env.FUSELOCK_E2E || "0");

FUSELOCK_E2E && describe('invocation', () => {
	it('baseline works', (done) => {

		// make sure not all commands are blocked
		const output = childProcess.execSync('/bin/echo hello');
		const stdout = output.toString();
		assert.ok(stdout.includes('hello'));

		// make sure execSync can be blocked
		try {
			childProcess.execSync('/bin/hostname');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});

	it("should instrument through property access", (done) => {
		// now try various ways to call execSync and make sure they're all blocked
		try {
			childProcess["execSync"]('/bin/hostname');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	})	

	it("should instrument through process.mainModule.require", (done) => {
		try {
			process.mainModule.require('child_process').execSync('/bin/hostname');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});

	it("should instrument through eval", (done) => {
		try {
			eval('requ' + 'ire("child_process").execSync("/bin/hostname")');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});

	it("should instrument through new Function", (done) => {
		try {
			const callExecSync = new Function('return require("child_process").execSync("/bin/hostname")');
			callExecSync();
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});

	it("should instrument through (0, eval)", (done) => {
		try {
			(0, eval)('require("child_process").execSync("/bin/hostname")');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});

	it("should instrument through vm.runInThisContext", (done) => {
		try {
			const vm = require('vm');
			vm.runInThisContext('require("child_process").execSync("/bin/hostname")');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});

	it("should instrument through Proxy + Reflect.get", (done) => {
		try {
			const cp = require('child_process');
			const proxyCp = new Proxy(cp, {
				get(target, prop) {
					return Reflect.get(target, prop);
				}
			});

			proxyCp.execSync('ls');
			done(new Error('should have failed'));
		} catch (error) {
			// expected
			done();
		}
	});
});