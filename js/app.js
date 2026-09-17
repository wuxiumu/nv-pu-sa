(() => {
  const DATA_URL = "./data/archive.enriched.json";
  const META_URL = "./data/meta.json";
  const CONFIG_URL = "./config.json";

  const $ = (id) => document.getElementById(id);
  const store = window.NvPuSaStore;
  const grid = $("grid");
  const empty = $("empty");
  const status = $("status");
  const tpl = $("cardTpl");

  let all = [];
  let meta = null;
  let config = {};
  let mgr = store.load();

  function fmtNum(n) {
    const x = Number(n) || 0;
    if (x >= 1e6) return (x / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (x >= 1e4) return (x / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(x);
  }

  function cleanHandle(raw) {
    return store.cleanHandle(raw);
  }

  function hubBase() {
    return (mgr.hubBaseUrl || config.hubBaseUrl || "http://127.0.0.1:8770").replace(/\/$/, "");
  }

  function hubNewUrl(handle) {
    const path = config.hubNewPath || "/app/?tab=new&account=";
    return hubBase() + path + encodeURIComponent(cleanHandle(handle));
  }

  function xUrl(handle) {
    return "https://x.com/" + encodeURIComponent(cleanHandle(handle));
  }

  function showError(msg) {
    status.hidden = !msg;
    status.textContent = msg || "";
  }

  function refreshMgrStats() {
    const s = store.stats(mgr);
    $("mgrStats").textContent = `收藏 ${s.favorites} · 备注 ${s.notes} · 标签 ${s.tagged}`;
  }

  function matches(item, q) {
    if (!q) return true;
    const handle = cleanHandle(item.screen_name);
    const hay = [
      item.screen_name,
      item.name,
      item.description,
      item.id,
      store.getNote(mgr, handle),
      store.getTags(mgr, handle).join(" "),
    ]
      .map((s) => String(s || "").toLowerCase())
      .join("\n");
    return q.split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
  }

  function sortItems(list, mode) {
    const arr = list.slice();
    const byStr = (a, b, key) =>
      String(a[key] || "").localeCompare(String(b[key] || ""), "zh");
    switch (mode) {
      case "name":
        return arr.sort((a, b) => byStr(a, b, "name"));
      case "handle":
        return arr.sort((a, b) => byStr(a, b, "screen_name"));
      case "clicks":
        return arr.sort((a, b) => (b.total_clicks || 0) - (a.total_clicks || 0));
      case "synced":
        return arr.sort((a, b) =>
          String(b.last_synced_at || "").localeCompare(String(a.last_synced_at || ""))
        );
      case "fav":
        return arr.sort((a, b) => {
          const fa = store.isFavorite(mgr, a.screen_name) ? 1 : 0;
          const fb = store.isFavorite(mgr, b.screen_name) ? 1 : 0;
          if (fb !== fa) return fb - fa;
          return (b.followers_count || 0) - (a.followers_count || 0);
        });
      case "followers":
      default:
        return arr.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));
    }
  }

  function filtered() {
    const q = ($("q").value || "").trim().toLowerCase();
    const onlyVerified = $("onlyVerified").checked;
    const hideBlocked = $("hideBlocked").checked;
    const onlyFav = $("onlyFav").checked;
    let list = all.filter((it) => {
      if (!matches(it, q)) return false;
      if (onlyVerified && !it.verified) return false;
      if (hideBlocked && (it.is_blocked || it.is_suspended)) return false;
      if (onlyFav && !store.isFavorite(mgr, it.screen_name)) return false;
      return true;
    });
    return sortItems(list, $("sort").value);
  }

  function render() {
    const list = filtered();
    $("countLine").textContent = `${list.length} / ${all.length}`;
    refreshMgrStats();
    grid.replaceChildren();
    empty.hidden = list.length > 0;

    const frag = document.createDocumentFragment();
    for (const it of list) {
      const node = tpl.content.cloneNode(true);
      const card = node.querySelector(".card");
      const handle = cleanHandle(it.screen_name);
      const avatar = it.avatar_resolved || it.avatar_url || "";
      const fav = store.isFavorite(mgr, handle);

      const img = node.querySelector(".avatar");
      img.src = avatar;
      img.alt = it.name || handle;
      img.onerror = () => {
        img.onerror = null;
        img.src =
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect fill="#1e2a35" width="100%" height="100%"/><text x="50%" y="54%" text-anchor="middle" fill="#8fa3b5" font-size="12" font-family="sans-serif">N/A</text></svg>`
          );
      };

      node.querySelector(".avatar-link").href = xUrl(handle);
      node.querySelector(".name").textContent = it.name || handle || "(无昵称)";
      node.querySelector(".handle").textContent = handle ? "@" + handle : "";

      const badges = node.querySelector(".badges");
      if (fav) {
        const b = document.createElement("span");
        b.className = "badge fav";
        b.textContent = "收藏";
        badges.appendChild(b);
      }
      if (it.verified) {
        const b = document.createElement("span");
        b.className = "badge ok";
        b.textContent = "认证";
        badges.appendChild(b);
      }
      if (it.is_suspended) {
        const b = document.createElement("span");
        b.className = "badge warn";
        b.textContent = "停用";
        badges.appendChild(b);
      }
      if (it.is_blocked) {
        const b = document.createElement("span");
        b.className = "badge warn";
        b.textContent = "封禁";
        badges.appendChild(b);
      }

      node.querySelector(".bio").textContent = (it.description || "").trim() || "（无简介）";

      const note = store.getNote(mgr, handle);
      const noteLine = node.querySelector(".note-line");
      if (note) {
        noteLine.hidden = false;
        noteLine.textContent = "备注：" + note;
      }

      const tags = store.getTags(mgr, handle);
      const tagLine = node.querySelector(".tag-line");
      if (tags.length) {
        tagLine.hidden = false;
        tags.forEach((t) => {
          const chip = document.createElement("span");
          chip.className = "tag-chip";
          chip.textContent = t;
          tagLine.appendChild(chip);
        });
      }

      node.querySelector(".stats").innerHTML = [
        `粉丝 ${fmtNum(it.followers_count)}`,
        `点击 ${fmtNum(it.total_clicks)}`,
        it.last_synced_at ? `同步 ${String(it.last_synced_at).slice(0, 10)}` : null,
      ]
        .filter(Boolean)
        .map((s) => `<span>${s}</span>`)
        .join("");

      if (fav) card.classList.add("is-fav");

      const favBtn = node.querySelector(".fav-btn");
      favBtn.textContent = fav ? "★ 已收藏" : "☆ 收藏";
      if (fav) favBtn.classList.add("on-fav");
      favBtn.addEventListener("click", () => {
        mgr = store.toggleFavorite(mgr, handle);
        render();
      });

      node.querySelector(".note-btn").addEventListener("click", () => openNote(handle, it.name));

      const hub = node.querySelector(".hub-new");
      hub.href = hubNewUrl(handle);
      hub.title = hub.href;
      node.querySelector(".x-link").href = xUrl(handle);

      const copyBtn = node.querySelector(".copy-handle");
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(handle);
          copyBtn.textContent = "已复制";
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.textContent = "复制";
            copyBtn.classList.remove("copied");
          }, 1200);
        } catch (_) {
          copyBtn.textContent = "失败";
        }
      });

      card.dataset.handle = handle;
      frag.appendChild(node);
    }
    grid.appendChild(frag);
  }

  function openNote(handle, name) {
    $("noteHandle").value = handle;
    $("noteTitle").textContent = `备注 / 标签 · @${handle}`;
    $("noteText").value = store.getNote(mgr, handle);
    $("noteTags").value = store.getTags(mgr, handle).join(", ");
    $("noteDialog").showModal();
  }

  function bindManage() {
    $("btnManage").addEventListener("click", () => {
      $("hubBaseUrl").value = hubBase();
      $("exportBox").hidden = true;
      $("manageHint").textContent = mgr.updatedAt
        ? "上次更新：" + mgr.updatedAt
        : "尚未写入管理数据";
      $("manageDialog").showModal();
    });

    $("btnSaveHub").addEventListener("click", () => {
      mgr = store.setHubBaseUrl(mgr, $("hubBaseUrl").value);
      $("manageHint").textContent = "已保存 Hub：" + hubBase();
      render();
    });

    $("btnExport").addEventListener("click", () => {
      const text = store.exportJSON(mgr);
      $("exportBox").hidden = false;
      $("exportBox").textContent = text;
      const blob = new Blob([text], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nv-pu-sa-manager.json";
      a.click();
      URL.revokeObjectURL(a.href);
      $("manageHint").textContent = "已导出管理数据";
    });

    $("btnImport").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        mgr = store.importJSON(text);
        $("hubBaseUrl").value = hubBase();
        $("manageHint").textContent = "导入成功";
        render();
      } catch (err) {
        $("manageHint").textContent = "导入失败：" + (err.message || err);
      }
      e.target.value = "";
    });

    $("btnClearMgr").addEventListener("click", () => {
      if (!confirm("清空本机全部收藏 / 备注 / 标签？")) return;
      mgr = store.clearAll();
      $("hubBaseUrl").value = hubBase();
      $("manageHint").textContent = "已清空";
      render();
    });

    $("btnSaveNote").addEventListener("click", () => {
      const handle = $("noteHandle").value;
      mgr = store.setNote(mgr, handle, $("noteText").value);
      mgr = store.setTags(mgr, handle, $("noteTags").value);
      $("noteDialog").close();
      render();
    });
  }

  function bind() {
    ["q", "sort", "onlyVerified", "hideBlocked", "onlyFav"].forEach((id) => {
      const el = $(id);
      const evt = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";
      el.addEventListener(evt, render);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== $("q") && !e.metaKey && !e.ctrlKey) {
        const tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        $("q").focus();
      }
      if (e.key === "Escape" && document.activeElement === $("q")) {
        $("q").value = "";
        render();
        $("q").blur();
      }
    });
    bindManage();
  }

  async function boot() {
    bind();
    try {
      const [dataRes, metaRes, cfgRes] = await Promise.all([
        fetch(DATA_URL),
        fetch(META_URL).catch(() => null),
        fetch(CONFIG_URL).catch(() => null),
      ]);
      if (!dataRes.ok) throw new Error("无法读取 " + DATA_URL + " (" + dataRes.status + ")");
      all = await dataRes.json();
      if (!Array.isArray(all)) throw new Error("archive 数据不是数组");
      if (metaRes && metaRes.ok) meta = await metaRes.json();
      if (cfgRes && cfgRes.ok) config = await cfgRes.json();
      if (!mgr.hubBaseUrl && config.hubBaseUrl) {
        mgr = store.setHubBaseUrl(mgr, config.hubBaseUrl);
      }
      const when = (meta && meta.fetched_at) || "";
      $("metaLine").textContent =
        `${all.length} 条 · R2 全量` + (when ? ` · 抓取 ${String(when).slice(0, 19)}` : "");
      showError("");
      render();
    } catch (err) {
      $("metaLine").textContent = "加载失败";
      showError(String(err.message || err) + " — 请用本地静态服务打开（不要 file://）。");
      empty.hidden = false;
    }
  }

  boot();
})();
