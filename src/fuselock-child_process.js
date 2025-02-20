/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {

	const { Readable } = require('stream');
	const childProcess = require('child_process');
	const { trace } = require("./fuselock-log");
	const { getCallingPackages, hookMethod } = require("./fuselock-utils");

	hookMethod(childProcess, 'exec', (originalMethod, args) => {
		const command = args[0];
		if (command === null || command === undefined) {
			// let the original method throw an exception
			return originalMethod.apply(this, args);
		}

		const allowed = permissionsModel.isExecAllowed(command, getCallingPackages());
		trace(`[child_process] Executing command: ${command} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			const commandArguments = command.split(" ");
			const executable = commandArguments[0];
			const error = new Error(`${executable}: No such file or directory`);
			if (args.length >= 1 && args[args.length -1]) {
				const callback = args[args.length -1];
				if (callback instanceof Function && callback) {
					callback(error, '', '');
					// FIXME: must be event emitter
					return null;
				}
			}

			// fallthrough
			throw error;
		}

		return originalMethod.apply(this, args);
	});

	hookMethod(childProcess, 'execSync', (originalMethod, args) => {
		const command = args[0];
		const allowed = permissionsModel.isExecAllowed(command, getCallingPackages());
		trace(`[child_process] Executing command: ${command} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			throw new Error(`[child_process] Blocked execSync: ${command}`);
		}

		return originalMethod.apply(this, args);
	});

	hookMethod(childProcess, 'execFile', (originalMethod, args) => {
		const file = args[0];
		const allowed = permissionsModel.isExecAllowed(file, getCallingPackages());
		trace(`[child_process] Executing file: ${file} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			if (args.length >= 1 && args[args.length - 1] instanceof Function) {
				trace("last argument is a callback");
				const callback = args[args.length - 1];
				const error = new Error(`[child_process] Blocked execFile: ${file}`);
				callback(error, '', '');
			}

			const result = new childProcess.ChildProcess();
			result.stdout = new Readable();
			result.stderr = new Readable();
			return result;
			// throw new Error(`[child_process] Blocked exec file: ${file}`);
		}

		return originalMethod.apply(this, args);
	});

	hookMethod(childProcess, 'execFileSync', (originalMethod, args) => {
		const file = args[0];
		const allowed = permissionsModel.isExecAllowed(file, getCallingPackages());
		trace(`[child_process] Executing file: ${file} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			throw new Error(`[child_process] Blocked execFileSync: ${file}`);
		}

		return originalMethod.apply(this, args);
	});

	hookMethod(childProcess, 'spawn', (originalMethod, args) => {
		const command = args[0];
		const allowed = permissionsModel.isExecAllowed(command, getCallingPackages());
		trace(`[child_process] Spawning process: ${command} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			trace(`[child_process] Blocked spawn command: ${command} from packages: ${getCallingPackages().join(",")}`);
			const result = new childProcess.ChildProcess();
			result.stdout = new Readable();
			return result;
		}

		return originalMethod.apply(this, args);
	});

	hookMethod(childProcess, 'spawnSync', (originalMethod, args) => {
		const command = args[0];
		const allowed = permissionsModel.isExecAllowed(command, getCallingPackages());
		trace(`[child_process] Spawning process: ${command} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			throw new Error(`[child_process] Blocked spawnSync: ${command}`);
		}

		return originalMethod.apply(this, args);
	});

	hookMethod(childProcess, 'fork', (originalMethod, args) => {
		const modulePath = args[0];
		const allowed = permissionsModel.isExecAllowed(modulePath, getCallingPackages());
		trace(`[child_process] Forking module: ${modulePath} ` + (allowed ? "✅" : "❌"));

		if (!allowed) {
			throw new Error(`[child_process] Blocked fork module: ${modulePath}`);
		}

		return originalMethod.apply(this, args);
	});
};
