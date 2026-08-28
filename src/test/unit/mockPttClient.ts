import { IPttClient, FavoriteBoardItem, PttArticleDetail, PttClientState } from '../../types';
import { ArticleListItem } from '../../store';

export class MockPttClient implements IPttClient {
  state: PttClientState = { login: false };
  _state?: PttClientState = this.state;

  public searchCondition: { type?: string; criteria?: string } | null = null;
  public sentKeys: string[] = [];
  public articlesByBoard: Record<string, ArticleListItem[]> = {};
  public articleDetails: Record<string, PttArticleDetail> = {};
  public favorites: FavoriteBoardItem[] = [];

  constructor(initialLogin = false) {
    this.state.login = initialLogin;
  }

  async login(username?: string, password?: string, _kickLogin?: boolean): Promise<boolean> {
    if (username && password) {
      this.state.login = true;
      return true;
    }
    return false;
  }

  async getFavorite(): Promise<FavoriteBoardItem[]> {
    return this.favorites;
  }

  async enterBoard(boardname: string): Promise<boolean> {
    return boardname.length > 0;
  }

  async getArticles(boardname: string, _fromSn?: number): Promise<ArticleListItem[]> {
    return this.articlesByBoard[boardname] || [];
  }

  async getArticle(boardname: string, sn: string | number): Promise<PttArticleDetail> {
    const key = `${boardname}/${sn}`;
    return this.articleDetails[key] || { lines: ['[No Content]'] };
  }

  setSearchCondition(type: string, criteria: string): void {
    this.searchCondition = { type, criteria };
  }

  resetSearchCondition(): void {
    this.searchCondition = null;
  }

  async send(keys: string): Promise<void> {
    this.sentKeys.push(keys);
  }
}
