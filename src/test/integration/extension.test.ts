import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Tests', () => {
  test('Extension activates and registers commands', async () => {
    const ext = vscode.extensions.getExtension('Yukai.vscode-ptt');
    assert.ok(ext, 'Extension should be present in host');

    if (!ext.isActive) {
      await ext.activate();
    }

    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes('ptt.login'), 'ptt.login should be registered');
    assert.ok(commands.includes('ptt.logout'), 'ptt.logout should be registered');
    assert.ok(commands.includes('ptt.add-board'), 'ptt.add-board should be registered');
    assert.ok(commands.includes('ptt.remove-board'), 'ptt.remove-board should be registered');
    assert.ok(commands.includes('ptt.favorite-board'), 'ptt.favorite-board should be registered');
    assert.ok(commands.includes('ptt.refresh-article'), 'ptt.refresh-article should be registered');
    assert.ok(commands.includes('ptt.refresh-board'), 'ptt.refresh-board should be registered');
  });

  test('Can execute ptt.refresh-article command without error', async () => {
    const ext = vscode.extensions.getExtension('Yukai.vscode-ptt');
    if (ext && !ext.isActive) {
      await ext.activate();
    }

    // Should execute cleanly
    await vscode.commands.executeCommand('ptt.refresh-article');
  });
});
