# Change Log

## 0.3.2

### Fixed

- 修正 vscode-ptt 無法連線問題 [#18](https://github.com/Yukaii/vscode-ptt/pull/18)
  > 詳細的討論有興趣的朋友可以參考 [#16](https://github.com/Yukaii/vscode-ptt/issues/16)，原因為 PTT 更新系統，擋掉沒有特別提供 origin 的 websocket 連線，改成符合規則連線就正常了。感謝 [@kevinptt0323][kevinptt0323]、[@JosephT5566][JosephT5566] 支援

然後是閒聊的部分，不知道大家知不知道最近 [Notepad++ 的新版本事件](https://notepad-plus-plus.org/news/v781-free-uyghur-edition/)，~~我在想要不要下個大版本更新也來想個類似的哏，第三世界開發者想紅就只能靠這種方式了~~（一次兩個哏會不會太多？只是逞一時口舌之快不要打我啦 😂）

## 0.3.1

### Fixed

- 升級 ptt-client 到 0.8.1，一併修正了搜尋 API 的更動 [#15](https://github.com/Yukaii/vscode-ptt/pull/15) [@JosephT5566][JosephT5566]
- 修正 「從我的最愛新增訂閱 列表不完整 [#11](https://github.com/Yukaii/vscode-ptt/issues/11)」，升級 ptt-client 版本解決

感謝上游 ptt-client [@kevinptt0323][kevinptt0323] 支援、[@JosephT5566][JosephT5566] 開 PR 修正。

~~抱腿抱的好，用嘴寫程式就好~~（逃

## 0.3.0

### Fixed

- 用 factory mode 修改了 getTreeItem() 的實作 [#14](https://github.com/Yukaii/vscode-ptt/pull/14) [@JosephT5566][JosephT5566]
- 讓文章顯示的順序依照文章編號排序 [#14](https://github.com/Yukaii/vscode-ptt/pull/14) [@JosephT5566][JosephT5566]

### Added

- 以推文數搜尋文章 [#14](https://github.com/Yukaii/vscode-ptt/pull/14) [@JosephT5566][JosephT5566]
    ![search-article-by-push](https://i.imgur.com/91tbyYB.gif)

感謝 [@JosephT5566][JosephT5566] 熱烈凱瑞了這次的 Release！

## 0.2.1

### Fixed

- 加入看板前檢查看板是否存在 [#13](https://github.com/Yukaii/vscode-ptt/pull/13) 感謝 [@JosephT5566][JosephT5566]

## 0.2.0

### Added

- 保留已登入使用者 [#6](https://github.com/Yukaii/vscode-ptt/issues/6)，也有設定值可以更改此行為
- 升級 ptt-client 到 0.5.2，大感謝 [@kevinptt0323][kevinptt0323]

## 0.1.0

### Added

- 從我的最愛新增訂閱看板 [#8](https://github.com/Yukaii/vscode-ptt/pull/8) 感謝 [@JosephT5566][JosephT5566]
- 改善開源社群體驗：增加 Issue Template、PR Template、Contribution Guide 等。雖然我的開源專案 87% 都在自嗨啦 😂 PR 多點還是不錯的。

## 0.0.2

- 載入更多文章

## 0.0.1

首次發佈。功能詳見 [MVP Task List](https://github.com/Yukaii/vscode-ptt/issues/2)

[JosephT5566]: https://github.com/JosephT5566
[kevinptt0323]: https://github.com/kevinptt0323
