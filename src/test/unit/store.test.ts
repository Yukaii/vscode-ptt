import * as assert from 'assert';
import store, { ArticleListItem } from '../../store';

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

  it('can add articles and retrieve them in fixed-first order', () => {
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
