/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

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
	 * @returns {string}
	 */
	const getPackageVersion = (packagePath) => {
		const packageJsonPath = path.join(packagePath, "package.json");
		if (!fs.existsSync(packageJsonPath)) {
			return "";
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		return packageJson.version;
	};

	/**
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @returns {any[]}
	 */
	const humanizeStackTrace = (stackTrace) => {
		return stackTrace.map(callsite => {
			return {
				file: callsite.getFileName(),
				line: callsite.getLineNumber(),
				column: callsite.getColumnNumber(),
				func: callsite.getFunctionName(),
			};
		});
	};

	/**
	 * @param {string} name
	 * @param {NodeJS.CallSite[]} stackTrace
	 * @param {boolean} result
	 * @param {object} params
	 */
	const report = (name, stackTrace, result, params) => {

		const packages = getCallingPackages(stackTrace);
		const packagesWithVersions = packages.map(path => {
			return {
				path,
				version: getPackageVersion(path),
			};
		});

		if (reportFile) {
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
		}
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
	const isHttpRequestAllowed = (host, stackTrace) => {
		const result = permissionsModel.isHttpRequestAllowed(host, stackTrace);
		report("http", stackTrace, result, {host});
		return result;
	};

	return {
		isExecAllowed,
		isHttpRequestAllowed,
	};
};

module.exports = {
	wrapPermissions,
};
