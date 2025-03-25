/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

const {nextTick} = require('process');

// FIXME: check for net.createServer

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const net = require('net');
	const {trace} = require("./fuselock-log");
	const {getStackTrace, hookPrototypeMethod, getNodeMajorVersion} = require("./fuselock-utils");

	/**
	 * @param {any} arg1
	 * @param {any} arg2
	 * @returns {{host: string | null, port: number | null, path: string | null}}
	 */
	const normalizeConnectArgs = (arg1, arg2) => {

		if (Array.isArray(arg1)) {
			// in node 14, the first argument is actually the array of arguments
			[arg1, arg2] = arg1;
		}

		let host = null;
		let port = null;
		let path = null;

		if (typeof arg1 === "object") {
			// connect(options: SocketConnectOpts, connectionListener?: () => void): this;
			const options = arg1;
			host = options.host || options.hostname || null;
			port = parseInt(options.port) || null;
			path = options.path || null;
		} else if (typeof arg1 === 'string') {
			// connect(path: string, connectionListener?: () => void): this;
			path = arg1;
		} else if (typeof arg1 === 'number') {
			// connect(port: number, host: string, connectionListener?: () => void): this;
			// connect(port: number, connectionListener?: () => void): this;
			port = arg1;
			host = (typeof arg2 === 'string') ? arg2 : null;
		}

		return {host, port, path};
	};

	/**
	 * @param {any} thisArg
	 * @param {any} arg1
	 * @param {any} arg2
	 * @returns {boolean}
	 */
	const check = (thisArg, arg1, arg2) => {
		const {host, port, path} = normalizeConnectArgs(arg1, arg2);

		if (path) {
			// FIXME: not checked if allowed
			trace(`[net] Connecting to IPC path: ${path} ❌`);
			return false;
		} else if (host) {
			return permissionsModel.isNetRequestAllowed(host, getStackTrace());
		} else {
			// this is going to fail, pass this through to node to emit the right error
			if (getNodeMajorVersion() < 16) {
				trace(`[net] connect() called with no arguments on node 14 ❌`);
				return false;
			}
		}

		return true;
	};

	/**
	 * @param {any} thisArg
	 * @param {any} arg1
	 * @param {any} arg2
	 * @returns {any}
	 */
	const fail = (thisArg, arg1, arg2) => {
		const {host, port, path} = normalizeConnectArgs(arg1, arg2);

		if (path) {
			nextTick(() => {
				thisArg.emit('error', new Error(`connect ENOENT ${path}`));
			});
		} else if (host) {
			nextTick(() => {
				/** @type {any} error */
				const error = new Error(`getaddrinfo ENOTFOUND ${host}`);
				error.errno = -3008;
				error.code = 'ENOTFOUND';
				error.syscall = 'getaddrinfo';
				error.hostname = host;
				thisArg.destroy(error);

			});
		} else {
			// can only happen on node 14
			nextTick(() => {
				/** @type {any} error */
				const error = new Error(`connect ECONNREFUSED 127.0.0.1`);
				error.errno = -3008;
				error.code = 'ENOTFOUND';
				error.syscall = 'getaddrinfo';
				error.hostname = host;
				thisArg.destroy(error);
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
