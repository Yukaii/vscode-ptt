export interface ArticleListItem {
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

  add (boardname: string, articles: Array<ArticleListItem>) {
    articles.forEach(article => {
      this.articleStore[boardname] = this.articleStore[boardname] || {};
      this.articleStore[boardname][article.sn] = article;
    });
    const ids = this.articleIds[boardname] || [];
    this.articleIds[boardname] = [...new Set(ids.concat(articles.map(art => art.sn)))];
  }
  
  release (boardname: string) {
    this.articleStore[boardname] = [];
    this.articleIds[boardname] = [];
  }

  lastSn (boardname: string) {
    return this.asList(boardname).slice(-1)[0].sn;
  }

  isEmpty (boardname: string)
  {
    if (this.asList(boardname).length === 0)
    {
      return true;
    }
    return false;
  }

}

export default new ArticleStore();
