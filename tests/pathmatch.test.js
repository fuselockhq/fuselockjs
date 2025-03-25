const {pathmatch} = require('../src/fuselock-pathmatch');
const assert = require('assert');

describe('pathMatch', () => {
	it('should match', () => {
		assert.ok(pathmatch('/home/user/test.txt', '**'));
		assert.ok(pathmatch('/home/user/test.txt', '**/t*'));
		assert.ok(pathmatch('/home/user/test.txt', '**/test.txt'));
		assert.ok(pathmatch('/home/user/test.txt', '**/*.txt'));

		assert.ok(pathmatch('/home/user/test.txt', '/home/**'));
		assert.ok(pathmatch('/home/user/test.txt', '/h*/**'));
		assert.ok(pathmatch('/home/user/test.txt', '/h*/**/test.txt'));

		assert.ok(!pathmatch('/home/user/test.txt', '*'));
	});
});