import React, { useState, useEffect, useCallback, type FC } from 'react';
import * as vscode from 'vscode';
import ReactTreeView, { TreeItem } from '@hackmd/react-vsc-treeview';
import store, { type ArticleListItem } from '../store';
import type { IPttClient } from '../types';

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
    return boardItem;
  }
  const item = boardItem as Record<string, unknown>;
  if (typeof item.boardname === 'string') {
    return item.boardname;
  }
  if (item.value && typeof item.value === 'object') {
    const val = item.value as Record<string, unknown>;
    if (typeof val.label === 'string') {
      return val.label;
    }
    if (val.label && typeof val.label === 'object' && 'label' in val.label) {
      return (val.label as { label: string }).label;
    }
    if (typeof val.id === 'string' && val.id.startsWith('board-')) {
      return val.id.replace('board-', '');
    }
  }
  if (typeof item.label === 'string') {
    return item.label;
  }
  if (item.label && typeof item.label === 'object' && 'label' in item.label) {
    return (item.label as { label: string }).label;
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
  ptt: IPttClient;
  isLoggedIn: boolean;
  version?: number;
}> = ({ boardName, ptt, isLoggedIn, version }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async (force = false) => {
    if (!isLoggedIn || !ptt?.state?.login) {
      return;
    }
    if (!force && !store.isEmpty(boardName)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ptt.getArticles(boardName);
      store.add(boardName, data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '載入文章失敗';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [boardName, ptt, isLoggedIn]);

  useEffect(() => {
    if (store.isEmpty(boardName)) {
      fetchArticles(false);
    }
  }, [boardName, version, fetchArticles]);

  const articles = store.asList(boardName);
  const articleCount = articles.length;
  const description = articleCount > 0 ? `${articleCount} 篇` : undefined;
  const oldestSn = store.lastSn(boardName);
  const hasReachedBeginning = oldestSn <= 1 && articleCount > 0;

  return (
    <TreeItem
      id={`board-${boardName}`}
      label={boardName}
      description={description}
      iconPath={new vscode.ThemeIcon('bookmark')}
      contextValue="board"
    >
      {loading && (
        <TreeItem
          id={`loading-${boardName}`}
          label="載入文章列表中..."
          iconPath={new vscode.ThemeIcon('loading~spin')}
        />
      )}

      {error && (
        <TreeItem
          id={`error-${boardName}`}
          label={`載入失敗: ${error}`}
          description="點擊重試"
          iconPath={new vscode.ThemeIcon('error')}
          command={{
            command: 'ptt.refresh-article',
            title: '重新整理',
            arguments: [boardName]
          }}
        />
      )}

      {!loading && !error && articleCount === 0 && (
        <TreeItem
          id={`empty-${boardName}`}
          label="看板尚無文章"
          iconPath={new vscode.ThemeIcon('info')}
        />
      )}

      {!loading &&
        articles.map(article => (
          <ArticleNode
            key={`${boardName}-${article.sn}`}
            article={article}
            boardName={boardName}
          />
        ))}

      {!loading && articleCount > 0 && !hasReachedBeginning && (
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

      {!loading && hasReachedBeginning && (
        <TreeItem
          id={`end-${boardName}`}
          label="已載入所有歷史文章"
          iconPath={new vscode.ThemeIcon('check')}
        />
      )}
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

  if (boardList.length === 0) {
    return (
      <>
        <TreeItem
          id="no-boards"
          label="尚未訂閱任何看板"
          description="點擊新增看板"
          iconPath={new vscode.ThemeIcon('add')}
          command="ptt.add-board"
        />
        <TreeItem
          id="pick-favorite"
          label="從我的最愛匯入看板"
          iconPath={new vscode.ThemeIcon('star')}
          command="ptt.favorite-board"
        />
      </>
    );
  }

  const sortedBoards = [...boardList].sort();

  return (
    <>
      {sortedBoards.map(boardName => (
        <BoardNode
          key={boardName}
          boardName={boardName}
          ptt={ptt}
          isLoggedIn={isLoggedIn}
          version={version}
        />
      ))}
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
