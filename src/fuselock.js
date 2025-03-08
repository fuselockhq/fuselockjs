(function fuselock() {

	/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

	const {createPermissions} = require('./fuselock-permissions');
	const {wrapPermissions} = require('./fuselock-report');
	const {getCallingPackages} = require('./fuselock-utils');
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

	const hookFs = require('./fuselock-fs');
	const hookNet = require('./fuselock-net');
	// const hookHttp = require('./fuselock-http');
	// const hookHttps = require('./fuselock-https');
	const hookChildProcess = require('./fuselock-child_process');

	/** @type {Record<string, Function>} */
	const modules = {
		//'net': hookNet,
		// 'http': hookHttp,
		// 'https': hookHttps,
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
	};

	/** @type {PermissionsModel} */
	const globalPermissionsModel = {

		/**
		 * @param {string} command
		 * @param {NodeJS.CallSite[]} stackTrace
		 * @returns {boolean}
		 */
		isExecAllowed: (command, stackTrace) => {
			const packages = getCallingPackages(stackTrace);
			trace("[fuselock] Checking isExecAllowed for " + command + " with packages " + packages.join(','));
			return packages
				.map(package => path.join(package, "fuselock.json"))
				.map(path => getPermissionsForPath(path))
				.filter(model => model !== null)
				.every(model => model.isExecAllowed(command, stackTrace));
		},

		/**
		 * @param {string} host
		 * @param {NodeJS.CallSite[]} stackTrace
		 * @returns {boolean}
		 */
		isHttpRequestAllowed: (host, stackTrace) => {
			const packages = getCallingPackages(stackTrace);
			trace("[fuselock] Checking isHttpRequestAllowed for " + host + " with packages " + packages.join(','));
			return packages
				.map(package => path.join(package, "fuselock.json"))
				.map(path => getPermissionsForPath(path))
				.filter(model => model !== null)
				.every(model => model.isHttpRequestAllowed(host, stackTrace));
		},

		/**
		 * @param {string} _path
		 * @param {NodeJS.CallSite[]} stackTrace
		 * @returns {boolean}
		 */
		isFileAccessAllowed: (_path, stackTrace) => {
			if (typeof _path === 'string') {
				if (_path.endsWith('/fuselock.json')) {
					return true;
				}
			}

			const packages = getCallingPackages(stackTrace);
			trace("[fuselock] Checking isFileAccessAllowed for " + _path + " with packages " + packages.join(','));
			return packages
				.map(package => path.join(package, "fuselock.json"))
				.map(_path => getPermissionsForPath(_path))
				.filter(model => model !== null)
				.every(model => model.isFileAccessAllowed(_path, stackTrace));
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

	// hook fs
	hookFs(globalPermissionsModel);

	// hook net, since it's used by http and https
	hookNet(globalPermissionsModel);
})();
