const assert = require('assert');
const {hostmatch} = require('../src/fuselock-hostmatch');

describe('hostmatch', () => {

	const _test = (items) => {
		items.forEach(([pattern, input, expected]) => {
			assert.equal(hostmatch(pattern, input), expected, `Matching of "${pattern}" with ${input} expected to result with ${expected}`);
		});
	}

	it('should match if only domain provided', () => {
		_test([
			// if only host is provided, then protocol, port and path don't matter
			["google.com", "https://google.com/q?=1", true],
			["google.com", "https://google.com:443/q?=1", true],
			["google.com", "http://google.com/?q=1", true],
			["google.com", "http://google.com:8080/?q=1", true],
			["google.com", "http://google.com", true],
			["google.com", "ftp://google.com", true],

			// root domain and subdomains do not match
			["google.com", "http://www.google.com", false],
		]);
	});

	it('should match protocols if provided', () => {
		_test([
			// protocol provided must match
			["https://google.com", "https://google.com/?q=1", true],
			// http defaults to 80
			["http://google.com", "http://google.com:80/?q=1", true],
			["http://google.com:80", "http://google.com/?q=1", true],
			// https defaults to 443
			["https://google.com", "https://google.com:443/?q=1", true],
			["https://google.com:443", "https://google.com/?q=1", true],
			// ports must match (with defaults)
			["https://google.com:443", "https://google.com/?q=1", true],
			// axios uses google.com instead of http://google.com when matching
			["google.com", "google.com", true],
			// protocol provided must match
			["https://google.com", "http://google.com/?q=1", false],
			// ports must match
			["https://google.com:1010/", "https://google.com:1011/", false],
		]);
	});

	it('should match subdomains', () => {
		_test([
			// match all subdomains
			["https://*.google.com", "https://www.google.com", true],
			// match part of domain
			["https://g*o*le.com", "https://google.com/q?=1", true],
			["https://g*o*le.com", "https://goooooogggggglllle.com/q?=1", true],
			["https://g*o*le.com", "https://gole.com/q?=1", true],
			// expecting greedy to work
			["https://g*o*le.com", "https://goltle.com/q?=1", true],
			// match all subdomains, excluding root
			["https://*.google.com", "https://google.com", false],
		]);
	});
});

