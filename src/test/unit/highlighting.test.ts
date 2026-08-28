import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe('PTT Syntax Highlighting and Language Configuration Tests', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const grammarPath = path.join(rootDir, 'syntaxes/ptt.tmLanguage.json');
  const langConfigPath = path.join(rootDir, 'language-configuration.json');
  const pkgPath = path.join(rootDir, 'package.json');

  it('has valid package.json with language and grammar contributions', () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    assert.ok(pkg.contributes, 'contributes should exist');
    assert.ok(Array.isArray(pkg.contributes.languages), 'contributes.languages should be array');
    const pttLang = pkg.contributes.languages.find((l: any) => l.id === 'ptt');
    assert.ok(pttLang, 'ptt language contribution should exist');
    assert.strictEqual(pttLang.configuration, './language-configuration.json');

    assert.ok(Array.isArray(pkg.contributes.grammars), 'contributes.grammars should be array');
    const pttGrammar = pkg.contributes.grammars.find((g: any) => g.language === 'ptt');
    assert.ok(pttGrammar, 'ptt grammar contribution should exist');
    assert.strictEqual(pttGrammar.scopeName, 'source.ptt');
    assert.strictEqual(pttGrammar.path, './syntaxes/ptt.tmLanguage.json');
  });

  it('has valid language-configuration.json', () => {
    assert.ok(fs.existsSync(langConfigPath), 'language-configuration.json should exist');
    const config = JSON.parse(fs.readFileSync(langConfigPath, 'utf8'));
    assert.ok(config.comments, 'comments config should exist');
    assert.ok(Array.isArray(config.brackets), 'brackets config should exist');
    assert.ok(Array.isArray(config.autoClosingPairs), 'autoClosingPairs should exist');
  });

  it('has valid syntaxes/ptt.tmLanguage.json structure', () => {
    assert.ok(fs.existsSync(grammarPath), 'syntaxes/ptt.tmLanguage.json should exist');
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    assert.strictEqual(grammar.scopeName, 'source.ptt');
    assert.strictEqual(grammar.name, 'PTT');
    assert.ok(grammar.repository, 'repository should exist');
    assert.ok(grammar.repository.header, 'header pattern repository should exist');
    assert.ok(grammar.repository['push-comment'], 'push-comment pattern repository should exist');
    assert.ok(grammar.repository['boo-comment'], 'boo-comment pattern repository should exist');
    assert.ok(grammar.repository['arrow-comment'], 'arrow-comment pattern repository should exist');
    assert.ok(grammar.repository['quote-line'], 'quote-line pattern repository should exist');
  });

  describe('Grammar regex patterns', () => {
    let grammar: any;

    before(() => {
      grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    });

    it('matches header author line', () => {
      const authorRule = grammar.repository.header.patterns.find((p: any) => p.name === 'meta.header.author.ptt');
      const regex = new RegExp(authorRule.match);
      const sample = '作者: Yukaii (魚凱) 看板: Gossiping';
      const match = sample.match(regex);
      assert.ok(match);
      assert.strictEqual(match[1], '作者:');
      assert.strictEqual(match[2], 'Yukaii');
      assert.strictEqual(match[3], '(魚凱)');
      assert.strictEqual(match[4], '看板:');
      assert.strictEqual(match[5], 'Gossiping');
    });

    it('matches header title line and category tags', () => {
      const titleRule = grammar.repository.header.patterns.find((p: any) => p.name === 'meta.header.title.ptt');
      const regex = new RegExp(titleRule.match);

      const sample1 = '標題: [問卦] 請問有幫vscode-ptt上色的辦法嗎';
      const match1 = sample1.match(regex);
      assert.ok(match1);
      assert.strictEqual(match1[1], '標題:');
      assert.strictEqual(match1[3], '[問卦]');
      assert.strictEqual(match1[4], '請問有幫vscode-ptt上色的辦法嗎');

      const sample2 = '標題: Re: [問卦] 回覆標題測試';
      const match2 = sample2.match(regex);
      assert.ok(match2);
      assert.strictEqual(match2[1], '標題:');
      assert.strictEqual(match2[2], 'Re: ');
      assert.strictEqual(match2[3], '[問卦]');
      assert.strictEqual(match2[4], '回覆標題測試');
    });

    it('matches header time line', () => {
      const timeRule = grammar.repository.header.patterns.find((p: any) => p.name === 'meta.header.time.ptt');
      const regex = new RegExp(timeRule.match);
      const sample = '時間: Fri Aug 28 15:25:44 2026';
      const match = sample.match(regex);
      assert.ok(match);
      assert.strictEqual(match[1], '時間:');
      assert.strictEqual(match[2], 'Fri Aug 28 15:25:44 2026');
    });

    it('matches separator lines and signature divider', () => {
      const separatorRegex = new RegExp(grammar.repository.separator.match);
      assert.ok('───────────────────────────────────────'.match(separatorRegex));
      assert.ok('---------------------------------------'.match(separatorRegex));

      const sigRegex = new RegExp(grammar.repository['signature-divider'].match);
      assert.ok('--'.match(sigRegex));
      assert.ok('-- '.match(sigRegex));
    });

    it('matches push comments (推 / 噓 / →)', () => {
      const pushBeginRegex = new RegExp(grammar.repository['push-comment'].begin);
      const booBeginRegex = new RegExp(grammar.repository['boo-comment'].begin);
      const arrowBeginRegex = new RegExp(grammar.repository['arrow-comment'].begin);

      const pushMatch = '推 testUser: 這是一則推文                                      08/28 15:40'.match(pushBeginRegex);
      assert.ok(pushMatch);
      assert.strictEqual(pushMatch[1], '推');
      assert.strictEqual(pushMatch[2], 'testUser');

      const booMatch = '噓 testUser: 這是一則噓文                                      08/28 15:41'.match(booBeginRegex);
      assert.ok(booMatch);
      assert.strictEqual(booMatch[1], '噓');
      assert.strictEqual(booMatch[2], 'testUser');

      const arrowMatch = '→ testUser: 這是一則箭頭                                      08/28 15:42'.match(arrowBeginRegex);
      assert.ok(arrowMatch);
      assert.strictEqual(arrowMatch[1], '→');
      assert.strictEqual(arrowMatch[2], 'testUser');
    });

    it('matches quote headers and quote lines', () => {
      const quoteHeaderRegex = new RegExp(grammar.repository['quote-header'].match);
      const qhSample = '※ 引述《Yukaii (魚凱)》之銘言：';
      const qhMatch = qhSample.match(quoteHeaderRegex);
      assert.ok(qhMatch);
      assert.strictEqual(qhMatch[2], 'Yukaii (魚凱)');

      const quoteLineBeginRegex = new RegExp(grammar.repository['quote-line'].begin);
      assert.ok(': 這是第一層引言'.match(quoteLineBeginRegex));
      assert.ok(': : 這是第二層引言'.match(quoteLineBeginRegex));
      assert.ok('> 這是箭頭引言'.match(quoteLineBeginRegex));
    });

    it('matches system notices and URLs', () => {
      const originNoticeRule = grammar.repository['system-notice'].patterns.find((p: any) => p.name === 'meta.notice.origin.ptt');
      const originRegex = new RegExp(originNoticeRule.match);
      const originMatch = '※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 140.112.30.1 (臺灣)'.match(originRegex);
      assert.ok(originMatch);

      const urlRule = grammar.repository.urls;
      const urlRegex = new RegExp(urlRule.match);
      const urlMatch = 'https://www.ptt.cc/bbs/Gossiping/M.123456.A.789.html'.match(urlRegex);
      assert.ok(urlMatch);
    });
  });
});
