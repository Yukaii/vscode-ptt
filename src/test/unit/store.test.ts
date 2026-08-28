import assert from 'node:assert';
import store, { type ArticleListItem } from '../../store';

describe('ArticleStore Unit Tests', () => {
  beforeEach(() => {
    store.release('Gossiping');
    store.release('C_Chat');
  });

  it('starts empty for a new board', () => {
    assert.strictEqual(store.isEmpty('Gossiping'), true);
    assert.deepStrictEqual(store.asList('Gossiping'), []);
    assert.strictEqual(store.lastSn('Gossiping'), 0);
  });

  it('can add articles and retrieve them in fixed-first order and sorted descending by sn', () => {
    const articles: ArticleListItem[] = [
      {
        sn: 100,
        push: '爆',
        date: '08/27',
        fixed: false,
        author: 'user1',
        status: '',
        title: 'Regular Article 1'
      },
      {
        sn: 101,
        push: '10',
        date: '08/27',
        fixed: true,
        author: 'admin',
        status: '!',
        title: 'Pinned Announcement'
      },
      {
        sn: 102,
        push: '5',
        date: '08/27',
        fixed: false,
        author: 'user2',
        status: '',
        title: 'Regular Article 2'
      }
    ];

    store.add('Gossiping', articles);

    assert.strictEqual(store.isEmpty('Gossiping'), false);
    const list = store.asList('Gossiping');
    assert.strictEqual(list.length, 3);
    // Pinned announcement (fixed: true) should be first
    assert.strictEqual(list[0].sn, 101);
    assert.strictEqual(list[0].fixed, true);
    // Non-fixed articles should be descending by sn
    assert.strictEqual(list[1].sn, 102);
    assert.strictEqual(list[2].sn, 100);
    // lastSn should be the lowest non-fixed sn (100)
    assert.strictEqual(store.lastSn('Gossiping'), 100);
  });

  it('accumulates multiple batches of articles beyond 42 posts', () => {
    // Batch 1: articles 81..100
    const batch1: ArticleListItem[] = [];
    for (let sn = 100; sn >= 81; sn--) {
      batch1.push({
        sn,
        push: '1',
        date: '08/27',
        fixed: false,
        author: 'author',
        status: '',
        title: `Post ${sn}`
      });
    }
    store.add('Gossiping', batch1);
    assert.strictEqual(store.asList('Gossiping').length, 20);
    assert.strictEqual(store.lastSn('Gossiping'), 81);

    // Batch 2: articles 61..80
    const batch2: ArticleListItem[] = [];
    for (let sn = 80; sn >= 61; sn--) {
      batch2.push({
        sn,
        push: '1',
        date: '08/27',
        fixed: false,
        author: 'author',
        status: '',
        title: `Post ${sn}`
      });
    }
    store.add('Gossiping', batch2);
    assert.strictEqual(store.asList('Gossiping').length, 40);
    assert.strictEqual(store.lastSn('Gossiping'), 61);

    // Batch 3: articles 41..60
    const batch3: ArticleListItem[] = [];
    for (let sn = 60; sn >= 41; sn--) {
      batch3.push({
        sn,
        push: '1',
        date: '08/27',
        fixed: false,
        author: 'author',
        status: '',
        title: `Post ${sn}`
      });
    }
    store.add('Gossiping', batch3);
    assert.strictEqual(store.asList('Gossiping').length, 60);
    assert.strictEqual(store.lastSn('Gossiping'), 41);

    // Batch 4: articles 21..40
    const batch4: ArticleListItem[] = [];
    for (let sn = 40; sn >= 21; sn--) {
      batch4.push({
        sn,
        push: '1',
        date: '08/27',
        fixed: false,
        author: 'author',
        status: '',
        title: `Post ${sn}`
      });
    }
    store.add('Gossiping', batch4);
    assert.strictEqual(store.asList('Gossiping').length, 80);
    assert.strictEqual(store.lastSn('Gossiping'), 21);
  });

  it('deduplicates articles by sn when adding new ones', () => {
    const article1: ArticleListItem = {
      sn: 50,
      push: '1',
      date: '08/27',
      fixed: false,
      author: 'user1',
      status: '',
      title: 'First'
    };
    const article2: ArticleListItem = {
      sn: 50,
      push: '2',
      date: '08/27',
      fixed: false,
      author: 'user1',
      status: '',
      title: 'First Updated'
    };

    store.add('C_Chat', [article1]);
    assert.strictEqual(store.asList('C_Chat').length, 1);

    store.add('C_Chat', [article2]);
    assert.strictEqual(store.asList('C_Chat').length, 1);
    assert.strictEqual(store.asList('C_Chat')[0].title, 'First Updated');
  });

  it('releases board data correctly', () => {
    const article: ArticleListItem = {
      sn: 1,
      push: '0',
      date: '08/27',
      fixed: false,
      author: 'user',
      status: '',
      title: 'Test'
    };

    store.add('Gossiping', [article]);
    assert.strictEqual(store.isEmpty('Gossiping'), false);

    store.release('Gossiping');
    assert.strictEqual(store.isEmpty('Gossiping'), true);
    assert.strictEqual(store.asList('Gossiping').length, 0);
  });
});
