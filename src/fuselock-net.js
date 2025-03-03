/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

const {nextTick} = require('process');

// FIXME: check for net.createServer

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const net = require('net');
	const {trace} = require("./fuselock-log");
	const {getStackTrace, hookPrototypeMethod} = require("./fuselock-utils");

	/**
	 * @param {any[]} args
	 * @returns {{host: string | null, port: number | null, path: string | null}}
	 */
	const normalizeConnectArgs = (args) => {
		let host = null;
		let port = null;
		let path = null;

		if (typeof args[0] === "object") {
			// connect(options: SocketConnectOpts, connectionListener?: () => void): this;
			const options = args[0];
			host = options.host || options.hostname || null;
			port = parseInt(options.port) || null;
			path = options.path || null;
		} else if (typeof args[0] === 'string') {
			// connect(path: string, connectionListener?: () => void): this;
			path = args[0];
		} else if (typeof args[0] === 'number') {
			// connect(port: number, host: string, connectionListener?: () => void): this;
			// connect(port: number, connectionListener?: () => void): this;
			port = args[0];
			host = (typeof args[1] === 'string') ? args[1] : null;
		}

		return {host, port, path};
	};

	/**
	 * @param {any} thisArg
	 * @param {any[]} args
	 * @returns {boolean}
	 */
	const check = (thisArg, args) => {
		const normalized = normalizeConnectArgs(args);
		const {host, port, path} = normalized;

		if (path) {
			// FIXME: not checked if allowed
			trace(`[net] Connecting to IPC path: ${path} ❌`);
			return false;
		} else if (host) {
			return permissionsModel.isHttpRequestAllowed(host, getStackTrace());
		} else {
			// this is going to fail, pass this through to node to emit the right error
			if (process.version.startsWith('v14.')) {
				trace(`[net] connect() called with no arguments on node 14 ❌`);
				return false;
			}
		}

		return true;
	};

	/**
	 * @param {any} thisArg
	 * @param {any[]} args
	 */
	const fail = (thisArg, args) => {
		const {path, host} = normalizeConnectArgs(args);

		if (path) {
			nextTick(() => {
				thisArg.emit('error', new Error(`connect ENOENT ${path}`));
			});
		} else if (host) {
			nextTick(() => {
				thisArg.emit('error', new Error(`connect ENOENT ${host}`));
			});
		} else {
			// can only happen on node 14
			nextTick(() => {
				thisArg.emit('error', new Error(`connect ENOENT`));
			});
		}

		return thisArg;
	};

	// connect(options: SocketConnectOpts, connectionListener?: () => void): this;
	// connect(port: number, host: string, connectionListener?: () => void): this;
	// connect(port: number, connectionListener?: () => void): this;
	// connect(path: string, connectionListener?: () => void): this;
	hookPrototypeMethod(net.Socket.prototype, 'connect', check, fail);
};
