// LoveDays 倒数日小组件 · Scriptable (https://scriptable.app)
//
// 用法：在 Scriptable 里新建脚本，粘贴本文件，运行一次 → 按提示填写
//   1. 服务器地址，例如 https://lovedays.example.com
//   2. 只读 API Key（LoveDays「设置」页创建，scope 选 read）
// 两者都存在 iOS 钥匙串里，不写在脚本中。之后在桌面添加 Scriptable 小组件并选择本脚本。
// 支持小 / 中 / 大桌面小组件和锁屏小组件；断网时显示上次成功获取的数据。

const SERVER_KEY = "lovedays.server";
const API_KEY = "lovedays.apiKey";
const CACHE_FILE = "lovedays-cache.json";
const REFRESH_MINUTES = 30;

const CATEGORY_COLORS = {
  rose: "#f43f5e",
  orange: "#f97316",
  amber: "#f59e0b",
  emerald: "#10b981",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  slate: "#64748b",
};
const BG = Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e"));
const FG = Color.dynamic(new Color("#111827"), new Color("#f3f4f6"));
const SUB = Color.dynamic(new Color("#6b7280"), new Color("#9ca3af"));

const ROWS = { medium: 3, large: 7, extraLarge: 7 };

class AuthError extends Error {}

function catColor(category) {
  return new Color(CATEGORY_COLORS[category] || CATEGORY_COLORS.slate);
}

function stored(name) {
  return Keychain.contains(name) ? Keychain.get(name) : null;
}

// ---------- 设置 ----------

async function askSettings() {
  const a = new Alert();
  a.title = "LoveDays 设置";
  a.message = "服务器地址（https://...）和只读 API Key（ld_...，在 LoveDays「设置」页创建）";
  a.addTextField("https://你的域名", stored(SERVER_KEY) || "https://");
  a.addSecureTextField("ld_...（留空则保留原 Key）", "");
  a.addAction("保存");
  a.addCancelAction("取消");
  if ((await a.present()) === -1) return false;

  const server = a.textFieldValue(0).trim().replace(/\/+$/, "");
  const key = a.textFieldValue(1).trim();
  if (!/^https?:\/\/[^/]+/.test(server)) throw new Error("服务器地址应以 https:// 开头");
  if (key && !key.startsWith("ld_")) throw new Error("API Key 应以 ld_ 开头");
  if (!key && !stored(API_KEY)) throw new Error("请填写 API Key");

  Keychain.set(SERVER_KEY, server);
  if (key) Keychain.set(API_KEY, key);
  return true;
}

// ---------- 数据 ----------

async function loadDays(server, key) {
  const fm = FileManager.local();
  const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
  try {
    const req = new Request(`${server}/api/v1/days`);
    req.headers = { Authorization: `Bearer ${key}` };
    req.timeoutInterval = 15;
    const json = await req.loadJSON();
    const status = req.response.statusCode;
    if (status === 401) throw new AuthError("API Key 无效：在 Scriptable 里运行脚本重新设置");
    if (status !== 200) throw new Error((json && json.error && json.error.message) || `HTTP ${status}`);
    fm.writeString(cachePath, JSON.stringify(json.data));
    return { days: json.data, stale: false };
  } catch (e) {
    if (!(e instanceof AuthError) && fm.fileExists(cachePath)) {
      return { days: JSON.parse(fm.readString(cachePath)), stale: true };
    }
    throw e;
  }
}

// ---------- 渲染 ----------

function text(stack, value, font, color, lines = 1) {
  const t = stack.addText(value);
  t.font = font;
  t.textColor = color;
  t.lineLimit = lines;
  return t;
}

/** 「还有 12 天」：数字用类别颜色加粗。 */
function addCount(stack, d, size) {
  const color = catColor(d.category);
  if (d.status === "today") {
    text(stack, "就是今天", Font.boldSystemFont(size), color);
    return;
  }
  text(stack, d.status === "upcoming" ? "还有 " : "已经 ", Font.systemFont(size - 3), SUB);
  text(stack, String(d.days), Font.boldRoundedSystemFont(size + 1), color);
  text(stack, " 天", Font.systemFont(size - 3), SUB);
}

function addRow(w, d, size) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const bar = row.addStack();
  bar.size = new Size(4, size + 4);
  bar.cornerRadius = 2;
  bar.backgroundColor = catColor(d.category);
  row.addSpacer(8);

  const title = text(row, d.title, Font.mediumSystemFont(size), FG);
  title.minimumScaleFactor = 0.8;
  row.addSpacer();
  addCount(row, d, size);
}

function addHeader(w, stale) {
  const h = w.addStack();
  h.layoutHorizontally();
  text(h, "倒数日", Font.semiboldSystemFont(12), SUB);
  h.addSpacer();
  if (stale) text(h, "离线", Font.systemFont(11), SUB);
}

function renderSmall(w, d, stale) {
  const color = catColor(d.category);
  const top = w.addStack();
  top.layoutHorizontally();
  text(top, d.categoryName || "", Font.semiboldSystemFont(12), color);
  top.addSpacer();
  if (stale) text(top, "离线", Font.systemFont(10), SUB);

  w.addSpacer(4);
  text(w, d.title, Font.boldSystemFont(16), FG, 2).minimumScaleFactor = 0.7;
  w.addSpacer();

  if (d.status === "today") {
    text(w, "就是今天", Font.heavySystemFont(30), color).minimumScaleFactor = 0.6;
  } else {
    text(w, d.status === "upcoming" ? "还有" : "已经", Font.systemFont(12), SUB);
    const n = w.addStack();
    n.layoutHorizontally();
    n.bottomAlignContent();
    text(n, String(d.days), Font.heavyRoundedSystemFont(40), color).minimumScaleFactor = 0.5;
    text(n, " 天", Font.semiboldSystemFont(14), SUB);
  }
  text(w, d.displayDate, Font.systemFont(11), SUB);
}

function renderList(w, days, family, stale) {
  addHeader(w, stale);
  w.addSpacer(6);
  const size = family === "medium" ? 15 : 16;
  const shown = days.slice(0, ROWS[family] || 3);
  shown.forEach((d, i) => {
    if (i > 0) w.addSpacer(family === "medium" ? 6 : 8);
    addRow(w, d, size);
  });
  w.addSpacer();
}

function renderAccessory(w, d, family) {
  const phrase =
    d.status === "today" ? "就是今天" : `${d.status === "upcoming" ? "还有" : "已经"} ${d.days} 天`;
  if (family === "accessoryInline") {
    text(w, `${d.title} ${phrase}`, Font.systemFont(12), FG);
  } else if (family === "accessoryCircular") {
    w.addSpacer();
    const n = text(w, d.status === "today" ? "今天" : String(d.days), Font.boldRoundedSystemFont(20), FG);
    n.centerAlignText();
    n.minimumScaleFactor = 0.5;
    const t = text(w, d.title, Font.systemFont(9), FG);
    t.centerAlignText();
    w.addSpacer();
  } else {
    text(w, d.title, Font.semiboldSystemFont(14), FG).minimumScaleFactor = 0.7;
    text(w, phrase, Font.boldRoundedSystemFont(18), FG);
    text(w, d.displayDate, Font.systemFont(11), FG);
  }
}

function message(w, msg, family) {
  if (!String(family).startsWith("accessory")) addHeader(w, false);
  w.addSpacer();
  text(w, msg, Font.systemFont(13), SUB, 4);
  w.addSpacer();
}

async function buildWidget(family) {
  const w = new ListWidget();
  const accessory = String(family).startsWith("accessory");
  if (!accessory) {
    w.backgroundColor = BG;
    w.setPadding(14, 14, 14, 14);
  }
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60 * 1000);

  const server = stored(SERVER_KEY);
  const key = stored(API_KEY);
  if (!server || !key) {
    message(w, "请先在 Scriptable 里运行一次本脚本，填写服务器地址和 API Key", family);
    return w;
  }
  w.url = server;

  try {
    const { days, stale } = await loadDays(server, key);
    if (days.length === 0) message(w, "还没有倒数日", family);
    else if (accessory) renderAccessory(w, days[0], family);
    else if (family === "small") renderSmall(w, days[0], stale);
    else renderList(w, days, family, stale);
  } catch (e) {
    message(w, `出错了：${e.message}`, family);
  }
  return w;
}

// ---------- 入口 ----------

if (config.runsInWidget) {
  Script.setWidget(await buildWidget(config.widgetFamily || "medium"));
} else {
  try {
    if (!stored(SERVER_KEY) || !stored(API_KEY)) await askSettings();
    const menu = new Alert();
    menu.title = "LoveDays 小组件";
    ["预览 · 小", "预览 · 中", "预览 · 大", "修改设置"].forEach((t) => menu.addAction(t));
    menu.addCancelAction("完成");
    const choice = await menu.present();
    if (choice === 3) {
      if (await askSettings()) await (await buildWidget("medium")).presentMedium();
    } else if (choice >= 0) {
      const family = ["small", "medium", "large"][choice];
      const w = await buildWidget(family);
      if (family === "small") await w.presentSmall();
      else if (family === "medium") await w.presentMedium();
      else await w.presentLarge();
    }
  } catch (e) {
    const a = new Alert();
    a.title = "出错了";
    a.message = e.message;
    a.addAction("好");
    await a.present();
  }
}
Script.complete();
