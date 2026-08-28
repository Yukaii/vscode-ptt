export interface FavoriteBoardItem {
    bn: number;
    read: boolean;
    boardname: string;
    category: string;
    title: string;
    users: string;
    admin: string;
    folder: boolean;
    divider: boolean;
}
export interface ArticleListItem {
    sn: number;
    push: string;
    date: string;
    author: string;
    status: string;
    title: string;
    fixed: boolean;
}
export interface ArticleDetail {
    sn: number | string;
    author: string;
    title: string;
    timestamp: string;
    lines: string[];
}
export interface PttState {
    connect: boolean;
    login: boolean;
    position: {
        boardname: string;
    };
}
