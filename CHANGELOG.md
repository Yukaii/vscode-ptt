# Change Log

## 0.4.0

爺爺！您安裝的擴充功能終於更新啦！🎉

在~~氛扣~~代理工程（Agentic Engineering）蓬勃發展的年代，總算能把這個陳年老專案撿回來好好現代化一番了。

雖然近年工作上比較少開 VSCode，PTT 也大多只在手機上偶爾滑一下，但回頭看著當年的專案願景與舊截圖，還是忍不住感嘆時光飛逝啊（菸。

這次睽違已久的大改版，帶來了全新重構的側邊欄架構、我的最愛深度整合、虛擬檔案系統分頁持久化、PTT 文章專屬語法高亮、訪客登入，以及全面 TypeScript 化的現代核心與工具鏈！祝大家摸魚愉快，上班看 PTT 都不會被發現（？

### Added

- **側邊欄架構升級與「我的最愛」整合** [#39](https://github.com/Yukaii/vscode-ptt/pull/39), [#40](https://github.com/Yukaii/vscode-ptt/pull/40)
  - 採用 `@hackmd/react-vsc-treeview` 重新打造樹狀視圖，分類為「我的最愛 (Favorites)」與「自訂看板 (Custom Boards)」
  - 支援展開看板時**按需載入 (On-Demand Loading)**，大幅改善啟動速度與連線負擔
  - 整合我的最愛快取機制，載入更流暢
  - 新增看板獨立重新整理動作與原生載入進度提示 (VS Code Progress Indicator)
- **虛擬檔案系統 (FileSystemProvider) 與分頁持久化** [#38](https://github.com/Yukaii/vscode-ptt/pull/38)
  - 採用 `ptt://` 虛擬檔案系統，在 VS Code 重新啟動或視窗 Reload 後仍可保留開啟的文章分頁
- **PTT 文章專屬語法高亮** [#36](https://github.com/Yukaii/vscode-ptt/pull/36)
  - 支援 BBS 格式高亮：文章作者/標題/時間資訊、推/噓/箭頭推文、引言染色、系統訊息與網址
- **Guest 訪客登入支援** [#35](https://github.com/Yukaii/vscode-ptt/pull/35)
  - 登入輸入 `guest` 或 `Guest` 免密碼即可直接連線瀏覽 PTT
- **全新高解析度向量 Logo 與圖示** [#44](https://github.com/Yukaii/vscode-ptt/pull/44)
  - 重新繪製 Extension SVG Logo 與 Activity Bar 圖示
- **自動化發布工作流程** [#42](https://github.com/Yukaii/vscode-ptt/pull/42)
  - 支援透過 GitHub Actions 自動發布至 VS Code Marketplace 與 Open VSX Registry

### Changed

- **ptt-client 核心 Modernization 與 Monorepo 整合** [#40](https://github.com/Yukaii/vscode-ptt/pull/40)
  - 將核心 `ptt-client` 納入 monorepo workspace (`packages/ptt-client`)，全面以 TypeScript 重構
  - 引入指令佇列序列化 (Command Queue Serialization) 與多頁比對機制，徹底解決並發操作 race condition
  - 完善終端機寬度計算 (`wcwidth` / `stringWidth`) 與 ANSI 序列解析
- **現代化開發工具鏈與測試** [#33](https://github.com/Yukaii/vscode-ptt/pull/33)
  - 升級至 TypeScript 5、ESLint 9 Flat Config、pnpm monorepo workspace
  - 建構雙層測試體系（Mocha 單元測試 + `@vscode/test-cli` 整合測試）與 GitHub Actions CI

### Fixed

- 修復登入連線處理、斷線自動重連與未登入時的 UI 狀態保護 [#37](https://github.com/Yukaii/vscode-ptt/pull/37)
- 修復看板文章重新整理按鈕失效問題 [#27](https://github.com/Yukaii/vscode-ptt/pull/27)
- 修復文章分頁與載入更多 (Load more) 排序與重複問題 [#39](https://github.com/Yukaii/vscode-ptt/pull/39), [#40](https://github.com/Yukaii/vscode-ptt/pull/40)
- 更新依賴套件並修復潛在安全漏洞 [#43](https://github.com/Yukaii/vscode-ptt/pull/43)

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
