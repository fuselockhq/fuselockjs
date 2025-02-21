(function fuselock() {

	/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

	const {createPermissions} = require('./fuselock-permissions');
	const {wrapPermissions} = require('./fuselock-report');
	const {trace, LOG_LEVEL_WARN, setLogLevel} = require('./fuselock-log');

	const fs = require("fs");
	const path = require("path");
	const module = require('module');

	/**
	 * Set of packages that have already been required() in the past
	 * @type {Set<string>}
	 **/
	const packagesRequired = new Set();

	setLogLevel(parseInt(process.env.FUSELOCK_LOGLEVEL || `${LOG_LEVEL_WARN}`));

	const hookNet = require('./fuselock-net');
	const hookHttp = require('./fuselock-http');
	const hookHttps = require('./fuselock-https');
	const hookChildProcess = require('./fuselock-child_process');

	/** @type {Record<string, Function>} */
	const modules = {
		'net': hookNet,
		'http': hookHttp,
		'https': hookHttps,
		'child_process': hookChildProcess,
	};

	/**
	 * @param {string} path
	 * @returns {PermissionsModel}
	 */
	const getPermissionsForPath = (path) => {
		if (fs.existsSync(path)) {
			const json = JSON.parse(fs.readFileSync(path, "utf8"));
			const model = createPermissions(json);
			trace("[fuselock] loaded json from " + path + " into " + JSON.stringify(json));
			return wrapPermissions(model);
		}

		return null;
	}

	/** @type {PermissionsModel} */
	const globalPermissionsModel = {

		/**
		 * @param {string} command
		 * @param {string[]} packages
		 */
		isExecAllowed: (command, packages) => {
			trace("[http] Checking isExecAllowed for " + command + " with packages " + packages.join(','));
			return packages
				.map(package => path.join(package, "fuselock.json"))
				.map(path => getPermissionsForPath(path))
				.filter(model => model !== null)
				.every(model => model.isExecAllowed(command, packages));
		},

		/**
		 * @param {string} host
		 * @param {string[]} packages
		 */
		isHttpRequestAllowed: (host, packages) => {
			trace("[http] Checking isHttpRequestAllowed for " + host + " with packages " + packages.join(','));
			return packages
				.map(package => path.join(package, "fuselock.json"))
				.map(path => getPermissionsForPath(path))
				.filter(model => model !== null)
				.every(model => model.isHttpRequestAllowed(host, packages));
		},

		/**
		 * @param {string[]} packages
		 */
		isFunctionConstructorAllowed: (packages) => {
			return true;
		},
	};

	const hookModule = () => {
		const originalRequire = module.prototype.require;
		/** @param {string} id */
		module.prototype.require = function (id) {
			if (!packagesRequired.has(id)) {
				trace(`[module] Requiring: ${id}`);
			}

			const result = originalRequire.apply(this, [id]);

			if (!packagesRequired.has(id)) {
				// patch modules immediately after they are required
				packagesRequired.add(id);
				if (id in modules) {
					modules[id](globalPermissionsModel);
				}
			}

			return result;
		};
	};

	// hooking module first, because that's how new modules are loaded
	hookModule();
})();
