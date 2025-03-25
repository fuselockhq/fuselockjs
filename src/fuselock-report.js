/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {NodeJS.CallSite} callsite
 * @returns {string}
 */
const humanizeCallSite = (callsite) => {
	if (callsite.getFunctionName() !== null) {
		return `    at ${callsite.getFunctionName()} (${callsite.getFileName()}:${callsite.getLineNumber()}:${callsite.getColumnNumber()})`;
	} else {
		return `    at ${callsite.getFileName()}:${callsite.getLineNumber()}:${callsite.getColumnNumber()}`;
	}
};

/**
 * @param {NodeJS.CallSite[]} stackTrace
 * @returns {string}
 */
const humanizeStackTrace = (stackTrace) => {
	return [
		"Error",
		...stackTrace.map(callsite => humanizeCallSite(callsite))
	].join("\n");
};

/**
 * Given a permissions model, return a new permissions model that reports on the actions taken.
 * 
 * @param {PermissionsModel} permissionsModel
 * @returns {PermissionsModel}
 */
const wrapPermissions = (permissionsModel) => {

	const fs = require("fs");
	const path = require("path");
	const reportFile = process.env.FUSELOCK_REPORT_FILE || null;
	const {getCallingPackages} = require("./fuselock-utils");

	/**
	 * @param {string} packagePath
	 * @returns {{name: string, version: string}}
	 */
	const getPackageInfo = (packagePath) => {
		const packageJsonPath = path.join(packagePath, "package.json");
		if (!fs.existsSync(packageJsonPath)) {
			return {name: "", version: ""};
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		return {
			name: packageJson.name,
			version: packageJson.version,
		};
	};

	/**
	 * @param {string} name
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @param {boolean} result
	 * @param {object} params
	 */
	const report = (name, stackTrace, result, params) => {

		if (!reportFile) {
			return;
		}
	
		const packages = getCallingPackages(stackTrace);
		const packagesWithVersions = packages.map(path => {
			const info = getPackageInfo(path);
			return {
				path,
				name: info.name,
				version: info.version,
			};
		});

		const item = {
			"fuselock-report": {
				version: 1,
				timestamp: new Date().toISOString(),
				name,
				packages: packagesWithVersions,
				stacktrace: humanizeStackTrace(stackTrace),
				result,
				params,
			},
		};

		const data = JSON.stringify(item) + "\n";
		fs.appendFileSync(reportFile, data);
	};

	/**
	 * @param {string} command
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isExecAllowed = (command, stackTrace) => {
		const result = permissionsModel.isExecAllowed(command, stackTrace);
		report("exec", stackTrace, result, {command});
		return result;
	};

	/**
	 * @param {string} host
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isNetRequestAllowed = (host, stackTrace) => {
		const result = permissionsModel.isNetRequestAllowed(host, stackTrace);
		report("http", stackTrace, result, {host});
		return result;
	};

	/**
	 * @param {string} path
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {boolean}
	 */
	const isFileAccessAllowed = (path, stackTrace) => {
		const result = permissionsModel.isFileAccessAllowed(path, stackTrace);
		if (!path.endsWith("/package.json")) {
			report("fs", stackTrace, result, {path});
		}

		return result;
	};

	return {
		isExecAllowed,
		isFileAccessAllowed,
		isNetRequestAllowed,
	};
};

module.exports = {
	wrapPermissions,
	humanizeStackTrace,
};
