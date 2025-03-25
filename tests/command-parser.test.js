const assert = require("assert");
const {parseCommand} = require("../src/fuselock-command-parser");

describe("command parser", () => {
	it("should parse command", () => {
		/** @type {string[]} */
		let result;

		result = parseCommand("ls -l");
		assert.deepStrictEqual(result, ["ls", "-l"]);

		result = parseCommand("\"ls\" -l");
		assert.deepStrictEqual(result, ["ls", "-l"]);

		result = parseCommand("echo \"argument with spaces\"");
		assert.deepStrictEqual(result, ["echo", "argument with spaces"]);

	});
});
