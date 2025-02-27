/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {

	const {Readable} = require('stream');
	const childProcess = require('child_process');
	const {trace} = require("./fuselock-log");
	const {hookMethod, getStackTrace, getCallingPackages, makeEmptyChildProcess, hookMethod2, makeSimpleErrorEventEmitter, makeEmptyChildProcessWithError} = require("./fuselock-utils");

	/**
	 * @param {string} command
	 * @returns {boolean}
	 */
	const checkExecAllowed = (command) => {
		if (command === null || command === undefined || typeof command !== 'string') {
			// let the original method throw an exception
			return true;
		}

		const commandArguments = command.split(" ");
		const executable = commandArguments[0];
		return permissionsModel.isExecAllowed(executable, getStackTrace());
	};

	/**
	 * @param {string} command
	 * @param {any[]} args
	 * @throws {Error}
	 */
	const makeExecError = (command, ...args) => {
		const error = new Error(`${command}: No such file or directory`);
		if (args.length >= 1) {
			const callback = args[args.length - 1];
			if (callback && callback instanceof Function) {
				callback(error, '', '');
				// FIXME: must be event emitter
				return null;
			}
		}

		throw error;
	};

	// child_process.exec(command[, options][, callback])
	hookMethod2(childProcess, 'exec', checkExecAllowed, makeExecError);

	// child_process.execSync(command[, options])
	hookMethod2(childProcess, 'execSync', checkExecAllowed, makeExecError);

	/**
	 * @param {string} file 
	 * @param {any[]} args 
	 * @param {any} options 
	 * @param {any} callback 
	 * @returns {{file: string, args: any[], options: object, callback: Function | null}}
	 */
	const normalizeExecFileArgs = (file, args, options, callback) => {

		// this follows the logic in https://github.com/nodejs/node/blob/main/lib/child_process.js#L262
		if (Array.isArray(args)) {
			// first argument is array
		} else if (args !== null && typeof args === 'object') {
			// shift all parameters left
			callback = options;
			options = args;
			args = [];
		} else if (typeof args === 'function') {
			callback = args;
			options = null;
			args = [];
		}

		if (typeof options === 'function') {
			callback = options;
			options = null;
		}

		if (options === null || options === undefined) {
			options = {};
		}

		return {file, args, options, callback};
	};

	/**
	 * @param {string} file
	 * @param {any} args
	 * @param {any} options
	 * @param {any} callback
	 * @returns boolean
	 */
	const checkExecFileAllowed = (file, args, options, callback) => {
		({file, args, options, callback} = normalizeExecFileArgs(file, args, options, callback));

		if (file === null || file === undefined || typeof file !== 'string') {
			// let the original method throw an exception
			return true;
		}

		let executable = file;
		if (options.shell) {
			// if shell is true, then we need to parse out the executable from the command
			const commandArguments = file.split(" ");
			executable = commandArguments[0];
		}

		return permissionsModel.isExecAllowed(executable, getStackTrace());
	};

	/**
	 * @param {string} file
	 * @param {any[]} args
	 * @param {any} options
	 * @param {any} callback
	 * @returns {childProcess.ChildProcess}
	 */
	const makeExecFileError = (file, args, options, callback) => {
		({file, args, options, callback} = normalizeExecFileArgs(file, args, options, callback));

		if (callback) {
			const executable = file;
			const error = new Error(`[child_process] Blocked execFile: ${executable}`);
			callback(error, '', '');
		}

		return makeEmptyChildProcess();
	};

	// child_process.execFile(file[, args][, options][, callback])
	hookMethod2(childProcess, 'execFile', checkExecFileAllowed, makeExecFileError);

	/**
	 * @param {string} file
	 * @param {any} args
	 * @param {any} options
	 * @returns {boolean}
	 */
	const checkExecFileSyncAllowed = (file, args, options) => {
		return checkExecFileAllowed(file, args, options, null);
	};

	/**
	 * @param {string} file
	 * @param {any[]} args
	 * @param {any} options
	 * @returns {childProcess.ChildProcess}
	 */
	const makeExecFileSyncError = (file, args, options) => {
		const error = new Error(`${file} ENOENT`);
		error.code = 'ENOENT';
		error.errno = -2;
		throw error;
	};

	// child_process.execFileSync(file[, args][, options])
	hookMethod2(childProcess, 'execFileSync', checkExecFileSyncAllowed, makeExecFileSyncError);

	// child_process.spawn(command[, args][, options])
	hookMethod(childProcess, 'spawn', (originalMethod, args) => {
		const command = args[0];
		const allowed = permissionsModel.isExecAllowed(command, getStackTrace());

		if (!allowed) {
			const commandWithArgs = [command, ...args[1]].join(" ");
			return makeEmptyChildProcessWithError(`spawn ${commandWithArgs} ENOENT`, {code: "ENOENT", errno: -2});
		}

		return originalMethod.apply(this, args);
	});

	// child_process.spawnSync(command[, args][, options])
	hookMethod(childProcess, 'spawnSync', (originalMethod, args) => {
		const command = args[0];
		const allowed = permissionsModel.isExecAllowed(command, getStackTrace());
		trace(`[child_process] Spawning process: ${command} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			throw new Error(`[child_process] Blocked spawnSync: ${command}`);
		}

		return originalMethod.apply(this, args);
	});

	/**
	 * @param {string} modulePath
	 * @returns {boolean}
	 */
	function checkForkAllowed(modulePath) {
		return permissionsModel.isExecAllowed(modulePath, getStackTrace());
	}

	/**
	 * @param {string} modulePath 
	 */
	function makeForkError(modulePath) {
		throw new Error(`[child_process] Blocked fork module: ${modulePath}`);
	}

	// child_process.fork(modulePath[, args][, options])
	hookMethod2(childProcess, 'fork', checkForkAllowed, makeForkError);
};
