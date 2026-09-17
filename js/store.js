/** 本机管理态：收藏 / 备注 / 标签 / Hub 配置。全部存在 localStorage。 */
(function (global) {
  const STORAGE_KEY = "nv-pu-sa:manager:v1";

  const defaultState = () => ({
    hubBaseUrl: "http://127.0.0.1:8770",
    favorites: {}, // handle -> true
    notes: {}, // handle -> string
    tags: {}, // handle -> string[]
    updatedAt: null,
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed, favorites: parsed.favorites || {}, notes: parsed.notes || {}, tags: parsed.tags || {} };
    } catch (_) {
      return defaultState();
    }
  }

  function save(state) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function cleanHandle(raw) {
    return String(raw || "").trim().replace(/^@+/, "");
  }

  const api = {
    load,
    save,
    cleanHandle,
    isFavorite(state, handle) {
      return !!state.favorites[cleanHandle(handle)];
    },
    toggleFavorite(state, handle) {
      const h = cleanHandle(handle);
      if (state.favorites[h]) delete state.favorites[h];
      else state.favorites[h] = true;
      return save(state);
    },
    getNote(state, handle) {
      return state.notes[cleanHandle(handle)] || "";
    },
    setNote(state, handle, note) {
      const h = cleanHandle(handle);
      const v = String(note || "").trim();
      if (v) state.notes[h] = v;
      else delete state.notes[h];
      return save(state);
    },
    getTags(state, handle) {
      return Array.isArray(state.tags[cleanHandle(handle)])
        ? state.tags[cleanHandle(handle)].slice()
        : [];
    },
    setTags(state, handle, tags) {
      const h = cleanHandle(handle);
      const list = (Array.isArray(tags) ? tags : String(tags || "").split(/[,，\s]+/))
        .map((t) => String(t).trim())
        .filter(Boolean);
      const uniq = [...new Set(list)];
      if (uniq.length) state.tags[h] = uniq;
      else delete state.tags[h];
      return save(state);
    },
    setHubBaseUrl(state, url) {
      state.hubBaseUrl = String(url || "").trim().replace(/\/$/, "") || "http://127.0.0.1:8770";
      return save(state);
    },
    stats(state) {
      return {
        favorites: Object.keys(state.favorites).length,
        notes: Object.keys(state.notes).length,
        tagged: Object.keys(state.tags).length,
      };
    },
    exportJSON(state) {
      return JSON.stringify(state, null, 2);
    },
    importJSON(raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== "object") throw new Error("无效的管理数据");
      const next = {
        ...defaultState(),
        hubBaseUrl: parsed.hubBaseUrl || defaultState().hubBaseUrl,
        favorites: parsed.favorites || {},
        notes: parsed.notes || {},
        tags: parsed.tags || {},
      };
      return save(next);
    },
    clearAll() {
      localStorage.removeItem(STORAGE_KEY);
      return defaultState();
    },
  };

  global.NvPuSaStore = api;
})(window);
