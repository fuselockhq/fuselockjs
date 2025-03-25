const assert = require('assert');
const {createPermissions} = require('../src/fuselock-permissions');

describe('permissions', () => {
	it('permits all operations when no fuselock.json is present', () => {
		const permissions = createPermissions(null);
		assert.ok(permissions.isExecAllowed('ls', []));
		assert.ok(permissions.isNetRequestAllowed('www.example.com', []));
	});

	it('allows specific exec commands', () => {
		const permissions = createPermissions({
			"version": 1,
			"permissions": {
				"exec": {
					"allow": [
						"/bin/echo"
					]
				}
			}
		});

		assert.ok(permissions.isExecAllowed('/bin/echo', []));
		assert.ok(!permissions.isExecAllowed('/bin/ls', []));
	});

	it('allows specific https hosts', () => {
		const permissions = createPermissions({
			"version": 1,
			"permissions": {
				"net": {
					"allow": [
						"*.google.com",
					],
					"deny": [
						"www.google.com",
					]
				}
			}
		});

		assert.ok(permissions.isNetRequestAllowed('ok.google.com', []));
		assert.ok(!permissions.isNetRequestAllowed('www.google.com', []));
		assert.ok(!permissions.isNetRequestAllowed('google.com', []));
	});

	it('allows specific https hosts with star', () => {
		const permissions = createPermissions({
			"version": 1,
			"permissions": {
				"net": {
					"allow": [
						"*",
					],
					"deny": [
						"www.google.com",
					]
				}
			}
		});

		assert.ok(permissions.isNetRequestAllowed('example.com', []));
		assert.ok(!permissions.isNetRequestAllowed('www.google.com', []));
		assert.ok(permissions.isNetRequestAllowed('google.com', []));
	});
});