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
	 * @param {string[]} rules
	 * @param {(pattern: string, input: string) => boolean} matcher
	 * @returns {boolean}
	 */
	const isAllowed = (subject, rules, matcher) => {
		for (const rule of rules) {

			const action = rule.split(" ")[0];
			const pattern = rule.split(" ")[1];

			if (action === "allow" && pattern === "all") {
				trace(`${subject} allowed by rule ${rule}`);
				return true;
			}
			
			if (action === "deny" && pattern === "all") {
				trace(`${subject} denied by rule ${rule}`);
				return false;
			}

			if (action === "allow") {
				if (matcher(pattern, subject)) {
					trace(`${subject} allowed by rule ${rule}`);
					return true;
				}
			}

			if (action === "deny") {
				if (matcher(pattern, subject)) {
					trace(`${subject} denied by rule ${rule}`);
					return false;
				}
			}

			// continue to the next rule
		}

		// default is false
		trace(`${subject} allowed by default`);
		return true;
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

		const rules = permissions.permissions.net.rules || [];
		trace(`[net] inspecting host ${host} with rules: ${JSON.stringify(rules)}`);

		return isAllowed(host, rules, hostmatch);
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

		const rules = permissions.permissions.exec.rules || [];
		trace(`[exec] inspecting command ${command} with rules: ${JSON.stringify(rules)}`);

		/**
		 * @param {string} pattern
		 * @param {string} path
		 * @returns {boolean}
		 */
		const _pathmatch = (pattern, path) => {
			return pathmatch(path, pattern);
		};

		return isAllowed(command, rules, _pathmatch);
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

		const rules = permissions.permissions.fs.rules || [];
		trace(`[fs] inspecting path ${path} with rules: ${JSON.stringify(rules)}`);

		/**
		 * @param {string} pattern
		 * @param {string} path
		 * @returns {boolean}
		 */
		const _pathmatch = (pattern, path) => {
			return pathmatch(path, pattern);
		};

		return isAllowed(path, rules, _pathmatch);
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
