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
	 * @param {string} name
	 * @param {string[]} packages
	 * @param {boolean} result
	 * @param {object} params
	 */
	const report = (name, packages, result, params) => {

		const packagesWithVersions = packages.map(path => {
			return {
				path,
				version: getPackageVersion(path),
			}
		});

		if (reportFile) {
			const item = {
				"fuselock-report": {
					version: 1,
					timestamp: new Date().toISOString(),
					name,
					packages: packagesWithVersions,
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
	 * @param {string[]} packages
	 */
	const isExecAllowed = (command, packages) => {
		const result = permissionsModel.isExecAllowed(command, packages);
		report("exec", packages, result, {command});
		return result;
	};

	/**
	 * @param {string} host
	 * @param {string[]} packages
	 */
	const isHttpRequestAllowed = (host, packages) => {
		const result = permissionsModel.isHttpRequestAllowed(host, packages);
		report("http", packages, result, {host});
		return result;
	};

	/** @param {string[]} packages */
	const isFunctionConstructorAllowed = (packages) => {
		const result = permissionsModel.isFunctionConstructorAllowed(packages);
		report("eval", packages, result, {});
		return result;
	};

	return {
		isExecAllowed,
		isHttpRequestAllowed,
		isFunctionConstructorAllowed,
	};
};

module.exports = {
	wrapPermissions,
};
