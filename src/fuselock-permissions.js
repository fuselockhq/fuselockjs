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

	const DEFAULT_ORDER = "allow,deny";

	/**
	 * @param {string} subject
	 * @param {string[]} allowlist
	 * @param {string[]} denylist
	 * @param {string} order
	 * @param {(pattern: string, input: string) => boolean} matcher
	 * @returns {boolean}
	 */
	const isAllowed = (subject, allowlist, denylist, order, matcher) => {
		if (order === "allow,deny") {
			if (allowlist.some(allow => matcher(allow, subject))) {
				// at least one rule allows this. now we check if any deny it
				for (const deny of denylist) {
					if (matcher(deny, subject)) {
						trace(`${subject} denied by rule ${deny}`);
						return false;
					}
				}

				trace(`${subject} allowed by ${allowlist}`);
				return true;
			}

			// default is false
			trace(`${subject} denied by default`);
			return false;
		}

		if (order === "deny,allow") {
			if (denylist.some(deny => matcher(deny, subject))) {
				// at least one rule denies this. now we check if any allow it
				for (const allow of allowlist) {
					if (matcher(allow, subject)) {
						trace(`${subject} allowed by rule ${allow}`);
						return true;
					}
				}

				trace(`${subject} denied by ${denylist}`);
				return false;
			}

			// default is true
			trace(`${subject} allowed by default`);
			return true;
		}

		trace(`Invalid order ${order} defined, denying request for ${subject}`);
		return false;
	};

	/**
	 * @param {string} host
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isNetRequestAllowed = (host, stackTrace) => {
		if (permissions == null || permissions.permissions == null || permissions.permissions.net == null) {
			// no permissions defined, allow all
			return true;
		}

		const order = permissions.permissions.net.order || DEFAULT_ORDER;
		const allowlist = permissions.permissions.net.allow || [];
		const denylist = permissions.permissions.net.deny || [];
		trace(`[net] inspecting host ${host} with order: ${order}, allow list: ${JSON.stringify(allowlist)}, deny list: ${JSON.stringify(denylist)}`);

		return isAllowed(host, allowlist, denylist, order, hostmatch);
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

		const order = permissions.permissions.exec.order || DEFAULT_ORDER;
		const allowlist = permissions.permissions.exec.allow ? permissions.permissions.exec.allow : [];
		const denylist = permissions.permissions.exec.deny ? permissions.permissions.exec.deny : [];
		trace(`[exec] inspecting command ${command} with order: ${order}, allow list: ${JSON.stringify(allowlist)}, deny list: ${JSON.stringify(denylist)}`);

		/**
		 * @param {string} pattern
		 * @param {string} path
		 * @returns {boolean}
		 */
		const _pathmatch = (pattern, path) => {
			return pathmatch(path, pattern);
		};

		return isAllowed(command, allowlist, denylist, order, _pathmatch);
	};

	/**
	 * @param {string} path
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isFileAccessAllowed = (path, stackTrace) => {
		if (permissions == null || permissions.permissions == null || permissions.permissions.fs == null) {
			// no permissions defined, allow all
			return true;
		}

		const order = permissions.permissions.fs.order || DEFAULT_ORDER;
		const allowlist = permissions.permissions.fs.allow || [];
		const denylist = permissions.permissions.fs.deny || [];
		trace(`[fs] inspecting path ${path} with order: ${order}, allow list: ${JSON.stringify(allowlist)}, deny list: ${JSON.stringify(denylist)}`);

		/**
		 * @param {string} pattern
		 * @param {string} path
		 * @returns {boolean}
		 */
		const _pathmatch = (pattern, path) => {
			return pathmatch(path, pattern);
		};
		
		return isAllowed(path, allowlist, denylist, order, _pathmatch);
	};

	return {
		isExecAllowed,
		isFileAccessAllowed,
		isNetRequestAllowed,
	};
};

module.exports = {
	createPermissions,
};
