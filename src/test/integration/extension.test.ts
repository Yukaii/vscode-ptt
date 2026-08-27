import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Tests', () => {
  test('Commands are registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes('ptt.login'), 'ptt.login should be registered');
    assert.ok(commands.includes('ptt.logout'), 'ptt.logout should be registered');
    assert.ok(commands.includes('ptt.add-board'), 'ptt.add-board should be registered');
    assert.ok(commands.includes('ptt.remove-board'), 'ptt.remove-board should be registered');
    assert.ok(commands.includes('ptt.favorite-board'), 'ptt.favorite-board should be registered');
    assert.ok(commands.includes('ptt.refresh-article'), 'ptt.refresh-article should be registered');
  });
});
