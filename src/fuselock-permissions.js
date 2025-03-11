/** @typedef {import('./fuselock.d.ts').Permissions} Permissions */
/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

const {hostmatch} = require('./fuselock-hostmatch');
const {pathmatch} = require('./fuselock-pathmatch');

/**
 * @param {Permissions} p
 * @returns PermissionsModel
 */
const createPermissions = (p) => {

	const {trace} = require('./fuselock-log');

	/** @type Permissions */
	const permissions = p;

	/**
	 * @param {string} host
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isHttpRequestAllowed = (host, stackTrace) => {
		if (permissions == null || permissions.permissions == null || permissions.permissions.http == null) {
			// no permissions defined, allow all
			return true;
		}

		const allowlist = permissions.permissions.http.allow || [];
		const denylist = permissions.permissions.http.deny || [];
		trace("[http] this is the allow list: " + JSON.stringify(allowlist) + " and deny list: " + JSON.stringify(denylist));

		if (!allowlist.some(allow => hostmatch(allow, host))) {
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
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isExecAllowed = (command, stackTrace) => {
		if (permissions == null || permissions.permissions == null || permissions.permissions.exec == null) {
			// no permissions defined, allow all
			return true;
		}

		const allowlist = permissions.permissions.exec.allow ? permissions.permissions.exec.allow : [];
		const denylist = permissions.permissions.exec.deny ? permissions.permissions.exec.deny : [];

		if (allowlist.length === 0) {
			// no allowlist defined, deny all by default
			return false;
		}
		
		if (!allowlist.some(allow => pathmatch(command, allow))) {
			return false;
		}

		for (const deny of denylist) {
			console.log("gilm deny: " + deny + " and command: " + command);
			if (pathmatch(command, deny)) {
				trace(`Command ${command} denied by rule ${deny}`);
				return false;
			}
		}

		return true;
	};

	/**
	 * @param {string} path
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isFileAccessAllowed = (path, stackTrace) => {
		if (permissions == null) {
			// no permissions defined, allow all
			return true;
		}

		if (permissions.permissions.fs == null) {
			// no fs permissions defined, allow all
			return true;
		}

		const allowlist = permissions.permissions.fs.allow || [];
		const denylist = permissions.permissions.fs.deny || [];

		if (!allowlist.some(allow => pathmatch(path, allow))) {
			return false;
		}

		for (const deny of denylist) {
			if (hostmatch(deny, path)) {
				trace(`File access denied by rule ${deny}`);
				return false;
			}
		}

		return true;
	};

	return {
		isExecAllowed,
		isFileAccessAllowed,
		isHttpRequestAllowed,
	};
};

module.exports = {
	createPermissions,
};
