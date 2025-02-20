/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * Given a permissions model, return a new permissions model that reports on the actions taken.
 * 
 * @param {PermissionsModel} permissionsModel
 * @returns {PermissionsModel}
 */
const wrapPermissions = (permissionsModel) => {

	const fs = require("fs");
	const reportFile = process.env.FUSELOCK_REPORT_FILE || null;

	/**
	 * @param {string} name
	 * @param {object} params
	 */
	const report = (name, params) => {
		if (reportFile) {
			const item = {
				name,
				params,
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
		report("exec", {command, packages, result});
		return result;
	};

	/**
	 * @param {string} host
	 * @param {string[]} packages
	 */
	const isHttpRequestAllowed = (host, packages) => {
		const result = permissionsModel.isHttpRequestAllowed(host, packages);
		report("http", {host, packages, result});
		return result;
	};

	/** @param {string[]} packages */
	const isFunctionConstructorAllowed = (packages) => {
		const result = permissionsModel.isFunctionConstructorAllowed(packages);
		report("eval", {packages, result});
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
