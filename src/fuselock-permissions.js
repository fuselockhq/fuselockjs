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
	 * @param {string[]} packages
	 * @returns {boolean}
	 */
	const isHttpRequestAllowed = (host, packages) => {
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
			trace(`None of these packages have permissions to make http requests to ${host}: ${packages.join(",")}`);
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
	 * @param {string[]} packages
	 * @returns {boolean}
	 */
	const isFunctionConstructorAllowed = (packages) => {
		// TODO: FIXME
		return true;
	};

	/**
	 * @param {string} command
	 * @param {string[]} packages
	 * @returns {boolean}
	 */
	const isExecAllowed = (command, packages) => {
		if (permissions == null) {
			// no permissions defined, allow all
			return true;
		}

		if (permissions.permissions.exec?.allow) {
			for (const packageName of ["*", ...packages]) {
				if (permissions.permissions.exec.allow.includes(packageName)) {
					return true;
				}
			}
		}

		return false;
	};

	return {
		isExecAllowed,
		isHttpRequestAllowed,
		isFunctionConstructorAllowed,
	};
};

module.exports = {
	createPermissions,
};
