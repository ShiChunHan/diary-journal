# 日記整理網

輸入日記文字，可附上一張圖片。按「儲存日記」後，網站記下當下時間，並將最新日記放在時間軸最上方。

日記與照片保存在目前瀏覽器的 IndexedDB。換瀏覽器、裝置或網站網址時，會看到各自的日記。清除網站資料會移除該瀏覽器的日記。

## 本機預覽

在專案根目錄執行 `python -m http.server 8000`，開啟 `http://localhost:8000`。網站由原生 HTML、CSS 與 JavaScript 組成，可直接由靜態伺服器提供。

## GitHub Pages

1. 建立公開的 GitHub repository，將解壓縮後的專案檔案上傳至 `main` 分支根目錄。
2. 開啟 repository 的 **Settings → Pages**，在 **Source** 選擇 **Deploy from a branch**。
3. 選擇 `main` 和 `/(root)` 後儲存，部署完成後從 Pages 設定頁開啟網址。

## 驗證

- 先用空白送出，再儲存兩篇日記，確認最新一篇在最上方。
- 為其中一篇選擇圖片，檢查預覽和儲存後的圖片。重新整理，確認內容與圖片仍在。
- 縮窄視窗，確認表單在時間軸上方且頁面可正常操作。

後續開發規則請見 [AGENTS.md](AGENTS.md)。
