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
			version: 1,
			permissions: {
				net: {
					allow: ["*"],
					deny: ["www.google.com"],
				}
			}
		});

		assert.ok(permissions.isNetRequestAllowed('example.com', []));
		assert.ok(!permissions.isNetRequestAllowed('www.google.com', []));
		assert.ok(permissions.isNetRequestAllowed('google.com', []));
	});

	it('should respect deny,allow and allow,deny rule order', () => {
		const permissions1 = createPermissions({
			version: 1,
			permissions: {
				net: {
					order: "allow,deny",
					allow: ["*"],
					deny: ["www.example.com"],
				},
			}
		});

		const permissions2 = createPermissions({
			version: 1,
			permissions: {
				net: {
					order: "deny,allow",
					allow: ["www.example.com"],
					deny: ["*"],
				},
			}
		});

		// permission1 allows "app.example.com", but disallows "www.example.com"
		assert.ok(permissions1.isNetRequestAllowed('app.example.com', []));
		assert.ok(!permissions1.isNetRequestAllowed('www.example.com', []));

		// permission2 allows "www.example.com" and disallows "app.example.com"
		assert.ok(permissions2.isNetRequestAllowed('www.example.com', []));
		assert.ok(!permissions2.isNetRequestAllowed('app.example.com', []));
	});

	it('should respect allow,deny and deny,allow default rules', () => {
		// the default for allow,deny is to deny all
		// the default for deny,allow is to allow all
		const permissions1 = createPermissions({
			version: 1,
			permissions: {
				net: {
					order: "allow,deny",
				},
			}
		});

		const permissions2 = createPermissions({
			version: 1,
			permissions: {
				net: {
					order: "deny,allow",
				},
			}
		});

		assert.ok(!permissions1.isNetRequestAllowed('www.example.com', []));
		assert.ok(permissions2.isNetRequestAllowed('www.example.com', []));
	});	
});