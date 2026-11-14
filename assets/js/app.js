"use strict";

const form = document.querySelector("#entry-form");
const body = document.querySelector("#body");
const photo = document.querySelector("#photo");
const preview = document.querySelector("#photo-preview");
const previewImage = document.querySelector("#preview-image");
const saveButton = document.querySelector("#save-entry");
const status = document.querySelector("#form-status");
const timeline = document.querySelector("#entries");
const emptyState = document.querySelector("#empty-state");
const emptyMessage = document.querySelector("#empty-message");
const entryCount = document.querySelector("#entry-count");
const characterCount = document.querySelector("#character-count");

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxPhotoBytes = 10_000_000;
const entryDate = new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "medium" });
let database;
let previewUrl;
let timelineUrls = [];

const today = new Date();
const todayLabel = document.querySelector("#today");
todayLabel.dateTime = new Intl.DateTimeFormat("sv-SE").format(today);
todayLabel.textContent = new Intl.DateTimeFormat("zh-TW", { dateStyle: "full" }).format(today);

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("personal-diary-journal", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database upgrade is blocked"));
  });
}

function readEntries() {
  return new Promise((resolve, reject) => {
    const request = database.transaction("entries").objectStore("entries").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function writeEntry(entry) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("entries", "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.objectStore("entries").add(entry);
  });
}

async function renderTimeline() {
  const entries = await readEntries();
  entries.sort((first, second) => second.createdAt.localeCompare(first.createdAt) || second.id - first.id);

  const previousUrls = timelineUrls;
  timelineUrls = [];
  timeline.replaceChildren(...entries.map((entry) => {
    const item = document.createElement("li");
    item.className = "entry";

    const time = document.createElement("time");
    time.dateTime = entry.createdAt;
    time.textContent = entryDate.format(new Date(entry.createdAt));

    const text = document.createElement("p");
    text.textContent = entry.body;
    item.append(time, text);

    if (entry.image) {
      const image = document.createElement("img");
      const url = URL.createObjectURL(entry.image);
      timelineUrls.push(url);
      image.src = url;
      image.alt = "日記附圖";
      image.loading = "lazy";
      item.append(image);
    }
    return item;
  }));

  previousUrls.forEach((url) => URL.revokeObjectURL(url));
  emptyMessage.textContent = "還沒有日記，先寫下今天的第一篇吧。";
  emptyState.hidden = entries.length > 0;
  timeline.hidden = entries.length === 0;
  entryCount.textContent = `${entries.length} 篇`;
}

function clearPhotoPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  previewImage.removeAttribute("src");
  preview.hidden = true;
}

function updateCount() {
  characterCount.textContent = `${body.value.length.toLocaleString("zh-TW")} / 2,000`;
}

body.addEventListener("input", () => {
  body.setCustomValidity("");
  updateCount();
});

photo.addEventListener("change", () => {
  clearPhotoPreview();
  status.textContent = "";
  const file = photo.files[0];
  if (!file) return;

  if (!acceptedTypes.has(file.type) || file.size > maxPhotoBytes || file.size === 0) {
    photo.value = "";
    status.textContent = "請選擇有效的 JPEG、PNG、WebP 或 GIF，且大小在 10 MB 以內。";
    return;
  }

  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  preview.hidden = false;
});

previewImage.addEventListener("error", () => {
  if (!previewUrl) return;
  photo.value = "";
  clearPhotoPreview();
  status.textContent = "無法讀取這張圖片，請選擇其他圖片。";
});

document.querySelector("#remove-photo").addEventListener("click", () => {
  photo.value = "";
  clearPhotoPreview();
  photo.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saveButton.disabled) return;
  const text = body.value.trim();
  if (!text) {
    body.setCustomValidity("請輸入日記內容。");
    body.reportValidity();
    return;
  }

  saveButton.disabled = true;
  body.readOnly = true;
  photo.disabled = true;
  const removePhoto = document.querySelector("#remove-photo");
  removePhoto.disabled = true;
  status.textContent = "正在儲存…";

  try {
    await writeEntry({ body: text, createdAt: new Date().toISOString(), image: photo.files[0] ?? null });
    form.reset();
    clearPhotoPreview();
    updateCount();
    try {
      await renderTimeline();
      status.textContent = "日記已儲存。";
    } catch {
      status.textContent = "日記已儲存，但時間軸更新失敗。請重新整理頁面。";
    }
  } catch {
    status.textContent = "無法儲存日記。請確認瀏覽器有可用的網站儲存空間後再試。";
  } finally {
    body.readOnly = false;
    photo.disabled = false;
    removePhoto.disabled = false;
    saveButton.disabled = false;
  }
});

async function initialize() {
  try {
    database = await openDatabase();
    await renderTimeline();
    saveButton.disabled = false;
  } catch {
    emptyMessage.textContent = "目前無法讀取日記。請確認瀏覽器允許網站儲存資料後重新整理。";
  }
}

initialize();
