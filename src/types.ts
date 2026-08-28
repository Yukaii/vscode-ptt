import { ArticleListItem } from './store';

export interface FavoriteBoardItem {
  bn: string;
  read: string;
  boardname: string;
  category: string;
  title: string;
  users: string;
  admin: string;
  folder: boolean;
  divider: boolean;
}

export interface PttArticleDetail {
  lines: string[];
  [key: string]: any;
}

export interface PttClientState {
  login: boolean;
  [key: string]: any;
}

export interface IPttClient {
  state: PttClientState;
  _state?: PttClientState;
  login(username?: string, password?: string, kickLogin?: boolean): Promise<any>;
  getFavorite(): Promise<FavoriteBoardItem[]>;
  enterBoard(boardname: string): Promise<boolean>;
  getArticles(boardname: string, fromSn?: number): Promise<ArticleListItem[]>;
  getArticle(boardname: string, sn: string | number): Promise<PttArticleDetail>;
  setSearchCondition(type: string, criteria: string): void;
  resetSearchCondition(): void;
  send(keys: string): Promise<any>;
  once?(event: string, listener: (...args: any[]) => void): any;
}
