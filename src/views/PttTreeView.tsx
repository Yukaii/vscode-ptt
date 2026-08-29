import React, { useState, useEffect, useCallback, type FC } from 'react';
import * as vscode from 'vscode';
import ReactTreeView, { TreeItem } from '@hackmd/react-vsc-treeview';
import store, { type ArticleListItem } from '../store';
import type { IPttClient, FavoriteBoardItem } from '../types';

export interface PttTreeViewProps {
  ptt: IPttClient;
  context: vscode.ExtensionContext;
  isLoggedIn: boolean;
  version?: number;
}

export function getBoardNameFromItem(boardItem: unknown): string | undefined {
  if (!boardItem) {
    return undefined;
  }
  if (typeof boardItem === 'string') {
    if (boardItem.startsWith('loadmore-')) {
      return boardItem.replace('loadmore-', '');
    }
    if (boardItem.startsWith('board-')) {
      return boardItem.replace('board-', '');
    }
    return boardItem;
  }
  const item = boardItem as Record<string, unknown>;
  if (typeof item.boardname === 'string') {
    return item.boardname;
  }
  if (item.value && typeof item.value === 'object') {
    const val = item.value as Record<string, unknown>;
    if (typeof val.id === 'string') {
      if (val.id.startsWith('loadmore-')) {
        return val.id.replace('loadmore-', '');
      }
      if (val.id.startsWith('board-')) {
        return val.id.replace('board-', '');
      }
    }
    if (typeof val.boardname === 'string') {
      return val.boardname;
    }
    if (typeof val.label === 'string' && val.label !== '載入更多文章' && !val.label.startsWith('載入')) {
      return val.label;
    }
    if (val.label && typeof val.label === 'object' && 'label' in val.label) {
      const lbl = (val.label as { label: string }).label;
      if (lbl !== '載入更多文章' && !lbl.startsWith('載入')) {
        return lbl;
      }
    }
  }
  if (typeof item.id === 'string') {
    if (item.id.startsWith('loadmore-')) {
      return item.id.replace('loadmore-', '');
    }
    if (item.id.startsWith('board-')) {
      return item.id.replace('board-', '');
    }
  }
  if (typeof item.label === 'string' && item.label !== '載入更多文章' && !item.label.startsWith('載入')) {
    return item.label;
  }
  if (item.label && typeof item.label === 'object' && 'label' in item.label) {
    const lbl = (item.label as { label: string }).label;
    if (lbl !== '載入更多文章' && !lbl.startsWith('載入')) {
      return lbl;
    }
  }
  return undefined;
}

export const ArticleNode: FC<{
  article: ArticleListItem;
  boardName: string;
}> = ({ article, boardName }) => {
  const getIcon = () => {
    if (article.fixed) {
      return new vscode.ThemeIcon('pin');
    }
    if (article.push === '爆' || Number(article.push) >= 50) {
      return new vscode.ThemeIcon('flame');
    }
    if (article.push && Number(article.push) > 0) {
      return new vscode.ThemeIcon('comment');
    }
    return new vscode.ThemeIcon('file-text');
  };

  const lines = [
    article.title,
    `作者: ${article.author}`,
    `日期: ${article.date}`,
    `推文: ${article.push || '0'}`,
    article.status ? `狀態: ${article.status}` : '',
    `文章編號: ${article.sn}`
  ].filter(Boolean);
  const tooltip = lines.join('\n');

  const pushBadge = article.push ? `[${article.push}]` : '';
  const description = [pushBadge, article.author, article.date].filter(Boolean).join(' ');

  return (
    <TreeItem
      id={`${boardName}-${article.sn}`}
      label={article.title}
      description={description}
      tooltip={tooltip}
      iconPath={getIcon()}
      contextValue="article"
      command={{
        command: 'ptt.show-article',
        title: '開啟文章',
        arguments: [article.sn, boardName]
      }}
    />
  );
};

export const BoardNode: FC<{
  boardName: string;
  boardTitle?: string;
  ptt?: IPttClient;
  isLoggedIn?: boolean;
  version?: number;
}> = ({ boardName, boardTitle }) => {
  const articles = store.asList(boardName);
  const articleCount = articles.length;
  const description = articleCount > 0 ? `${articleCount} 篇` : boardTitle;
  const tooltip = boardTitle ? `${boardName} (${boardTitle})` : boardName;
  const oldestSn = store.lastSn(boardName);
  const hasReachedBeginning = oldestSn <= 1 && articleCount > 0;

  return (
    <TreeItem
      id={`board-${boardName}`}
      label={boardName}
      description={description}
      tooltip={tooltip}
      iconPath={new vscode.ThemeIcon('bookmark')}
      contextValue="board"
    >
      {articleCount === 0 && (
        <TreeItem
          id={`load-articles-${boardName}`}
          label="點擊載入最新文章"
          iconPath={new vscode.ThemeIcon('cloud-download')}
          command={{
            command: 'ptt.refresh-article',
            title: '載入最新文章',
            arguments: [boardName]
          }}
        />
      )}

      {articles.map(article => (
        <ArticleNode
          key={`${boardName}-${article.sn}`}
          article={article}
          boardName={boardName}
        />
      ))}

      {articleCount > 0 && !hasReachedBeginning && (
        <TreeItem
          id={`loadmore-${boardName}`}
          label="載入更多文章"
          iconPath={new vscode.ThemeIcon('arrow-down')}
          contextValue="loadMore"
          command={{
            command: 'ptt.load-more-article',
            title: '載入更多文章',
            arguments: [boardName]
          }}
        />
      )}

      {hasReachedBeginning && (
        <TreeItem
          id={`end-${boardName}`}
          label="已載入所有歷史文章"
          iconPath={new vscode.ThemeIcon('check')}
        />
      )}
    </TreeItem>
  );
};

export const FavoriteNode: FC<{
  ptt: IPttClient;
  context: vscode.ExtensionContext;
  isLoggedIn: boolean;
  version?: number;
}> = ({ ptt, context, isLoggedIn, version }) => {
  const [favorites, setFavorites] = useState<FavoriteBoardItem[]>(() => {
    const inStore = store.getFavorites();
    if (inStore && inStore.length > 0) {
      return inStore;
    }
    const persisted = context?.globalState?.get<FavoriteBoardItem[]>('cachedFavorites');
    if (persisted && persisted.length > 0) {
      store.setFavorites(persisted);
      return persisted;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => isLoggedIn && !store.hasFavorites());
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async (force = false) => {
    if (!isLoggedIn || !ptt?.state?.login) {
      return;
    }
    if (!force && store.hasFavorites()) {
      setFavorites(store.getFavorites());
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ptt.getFavorite();
      const validFavorites = (data || []).filter(
        item => !item.divider && Boolean(item.boardname?.trim()) && /^[A-Za-z0-9_.-]+$/.test(item.boardname.trim())
      );
      store.setFavorites(validFavorites);
      context?.globalState?.update('cachedFavorites', validFavorites);
      setFavorites(validFavorites);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '載入我的最愛失敗';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ptt, isLoggedIn, context]);

  useEffect(() => {
    if (isLoggedIn && ptt?.state?.login) {
      fetchFavorites(false);
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [version, isLoggedIn, fetchFavorites]);

  return (
    <TreeItem
      id="favorite-root"
      label="我的最愛"
      iconPath={new vscode.ThemeIcon('star')}
      contextValue="favoriteRoot"
      expanded={true}
    >
      {loading && (
        <TreeItem
          id="favorite-loading"
          label="載入我的最愛中..."
          iconPath={new vscode.ThemeIcon('loading~spin')}
        />
      )}

      {error && (
        <TreeItem
          id="favorite-error"
          label={`載入失敗: ${error}`}
          description="點擊重試"
          iconPath={new vscode.ThemeIcon('error')}
          command={{
            command: 'ptt.refresh-article',
            title: '重新整理'
          }}
        />
      )}

      {!loading && !error && favorites.length === 0 && (
        <TreeItem
          id="favorite-empty"
          label="我的最愛目前沒有看板"
          iconPath={new vscode.ThemeIcon('info')}
        />
      )}

      {!loading &&
        favorites.map(fav => (
          <BoardNode
            key={fav.boardname}
            boardName={fav.boardname}
            boardTitle={fav.title?.trim()}
            ptt={ptt}
            isLoggedIn={isLoggedIn}
            version={version}
          />
        ))}
    </TreeItem>
  );
};

export const PttTreeView: FC<PttTreeViewProps> = ({ ptt, context, isLoggedIn, version }) => {
  const [boardList, setBoardList] = useState<string[]>(() => context?.globalState?.get<string[]>('boardlist') || []);

  useEffect(() => {
    const list = context?.globalState?.get<string[]>('boardlist') || [];
    setBoardList(list);
  }, [context, version]);

  if (!isLoggedIn) {
    return (
      <TreeItem
        id="not-logged-in"
        label="尚未登入 PTT"
        description="點擊登入"
        iconPath={new vscode.ThemeIcon('sign-in')}
        command="ptt.login"
      />
    );
  }

  const customBoards = boardList.filter(Boolean);

  return (
    <>
      <FavoriteNode
        ptt={ptt}
        context={context}
        isLoggedIn={isLoggedIn}
        version={version}
      />
      {customBoards.length > 0 && (
        <TreeItem
          id="custom-boards-root"
          label="其他看板"
          iconPath={new vscode.ThemeIcon('bookmark')}
          contextValue="customBoardsRoot"
          expanded={true}
        >
          {customBoards.sort().map(boardName => (
            <BoardNode
              key={`custom-${boardName}`}
              boardName={boardName}
              ptt={ptt}
              isLoggedIn={isLoggedIn}
              version={version}
            />
          ))}
        </TreeItem>
      )}
    </>
  );
};

export class PttTreeViewController {
  private treeView?: vscode.TreeView<unknown>;
  private version = 0;

  constructor(
    private ptt: IPttClient,
    private context: vscode.ExtensionContext,
    private getIsLoggedIn: () => boolean
  ) {}

  public setPtt(ptt: IPttClient) {
    this.ptt = ptt;
    this.refresh();
  }

  public render(): vscode.TreeView<unknown> {
    const isLoggedIn = this.getIsLoggedIn();
    this.treeView = ReactTreeView.render(
      <PttTreeView
        ptt={this.ptt}
        context={this.context}
        isLoggedIn={isLoggedIn}
        version={this.version}
      />,
      'pttTree'
    );
    return this.treeView;
  }

  public refresh(): void {
    this.version += 1;
    this.render();
  }

  public getTreeView(): vscode.TreeView<unknown> | undefined {
    return this.treeView;
  }
}
