
/**
 * @param {string} command - The command string to parse
 * @returns {string[]}
 */
const parseCommand = (command) => {

	const result = [];

	let currentString = "";

	let state = 0;
	let delimiter = "";

	for (const char of command) {
		switch (state) {
			case 0:
				// waiting for string to start
				if (char === " " || char === "\t") {
					// whitespace, ignore
				} else if (char === "'" || char === "\"") {
					state = 1;
					delimiter = char;
				} else {
					state = 1;
					delimiter = " ";
					currentString += char;
				}
				break;

			case 1:
				// waiting for delimiter
				if (char === delimiter) {
					state = 0;
					result.push(currentString);
					currentString = "";			
				} else {
					currentString += char;
				}
				break;
		}
	}

	if (currentString.length > 0) {
		result.push(currentString);
	}

	return result;
};

module.exports = {
	parseCommand,
};