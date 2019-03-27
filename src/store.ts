interface ArticleListItem {
  sn: number;
  push: string;
  date: string;
  fixed: boolean;
  author: string;
  status: string;
  title: string;
}

class ArticleStore {
  private articleStore : { [boardname: string]: { [sn: number]: ArticleListItem } } = {};
  private articleIds : { [boardname: string]: Array<number> } = {};

  asList (boardname: string) {
    return (this.articleIds[boardname] || []).map(id => this.articleStore[boardname][id])
      .sort((a, b) => {
        if (a.fixed && b.fixed) {
          return 0;
        } else if (a.fixed) {
          return -1;
        } else {
          return 1;
        }
      });
  }

  // TODO: typed articles
  add (boardname: string, articles: Array<ArticleListItem>) {
    articles.forEach(article => {
      this.articleStore[boardname] = this.articleStore[boardname] || {};
      this.articleStore[boardname][article.sn] = article;
    });
    const ids = this.articleIds[boardname] || [];
    this.articleIds[boardname] = [...new Set(ids.concat(articles.map(art => art.sn)))];
  }

  lastSn (boardname: string) {
    return this.asList(boardname).slice(-1)[0].sn;
  }
}

export default new ArticleStore();
