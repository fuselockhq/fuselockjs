/** @typedef {import('./fuselock.d.ts').Permissions} Permissions */
/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {Permissions} p
 * @returns PermissionsModel
 */
const createPermissions = (p) => {

	const {trace} = require('./fuselock-log');
	const {hostmatch} = require('./fuselock-hostmatch');

	/** @type Permissions */
	const permissions = p;

	/**
	 * @param {string} host
	 * @returns {boolean}
	 */
	const isHttpRequestAllowed = (host) => {
		if (permissions == null) {
			// no permissions defined, allow all
			return true;
		}

		// logic:
		// 1. one (or more) of the allow list match
		// 2. none of the deny list match
		const allowlist = permissions.permissions.http?.allow || [];
		const denylist = permissions.permissions.http?.deny || [];
		trace("[http] this is the allow list: " + JSON.stringify(allowlist) + " and deny list: " + JSON.stringify(denylist));

		const oneAllow = allowlist.some(allow => hostmatch(allow, host));
		if (!oneAllow) {
			trace(`Host ${host} denied because there is not a single permission to allow this`);
			return false;
		}

		for (const deny of denylist) {
			if (hostmatch(deny, host)) {
				trace(`Host ${host} denied by rule ${deny}`);
				return false;
			}
		}

		return true;
	};

	/**
	 * @param {string} command
	 * @returns {boolean}
	 */
	const isExecAllowed = (command) => {
		if (permissions == null) {
			// no permissions defined, allow all
			return true;
		}

		if (permissions.permissions.exec?.allow) {
			for (const allowedCommand of permissions.permissions.exec.allow) {
				if (command == allowedCommand) {
					return true;
				}
			}
		}

		return false;
	};

	return {
		isExecAllowed,
		isHttpRequestAllowed,
	};
};

module.exports = {
	createPermissions,
};
