(function () {
  "use strict";

  const API_URL = "./intervals-api.php";
  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const state = {
    intervalsConfig: {},
    saving: false,
    loading: false
  };

  let root;
  let libsContainer;
  let messageEl;
  let loadBtn;
  let saveBtn;

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.className = "alert mt-3 " + (type === "error" ? "alert-danger" : "alert-success");
    messageEl.textContent = text;
    messageEl.style.display = "block";
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.style.display = "none";
    messageEl.textContent = "";
  }

  function setBusy() {
    if (loadBtn) loadBtn.disabled = state.loading || state.saving;
    if (saveBtn) saveBtn.disabled = state.loading || state.saving;
  }

  function ensureDayMap(libName) {
    if (!state.intervalsConfig[libName]) {
      state.intervalsConfig[libName] = {};
    }
    DAYS.forEach(function (day) {
      if (!Array.isArray(state.intervalsConfig[libName][day])) {
        state.intervalsConfig[libName][day] = [];
      }
    });
  }

  function normalizeData(data) {
    const normalized = {};

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return normalized;
    }

    Object.keys(data).forEach(function (libName) {
      const dayMap = data[libName];
      if (!dayMap || typeof dayMap !== "object" || Array.isArray(dayMap)) return;

      normalized[libName] = {};
      DAYS.forEach(function (day) {
        const intervals = Array.isArray(dayMap[day]) ? dayMap[day] : [];
        normalized[libName][day] = intervals
          .filter(function (x) {
            return x && typeof x.start === "string" && typeof x.end === "string";
          })
          .map(function (x) {
            return { start: x.start, end: x.end };
          });
      });
    });

    return normalized;
  }

  function isValidTime(value) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  function validateConfig() {
    const errors = [];

    Object.keys(state.intervalsConfig).forEach(function (libName) {
      DAYS.forEach(function (day) {
        const intervals = state.intervalsConfig[libName][day] || [];
        intervals.forEach(function (interval, index) {
          if (!isValidTime(interval.start) || !isValidTime(interval.end)) {
            errors.push(libName + " " + day + " #" + (index + 1) + ": invalid time format");
            return;
          }
          if (interval.start >= interval.end) {
            errors.push(libName + " " + day + " #" + (index + 1) + ": start must be before end");
          }
        });
      });
    });

    return errors;
  }

  function addLibrary() {
    const base = "NEW_LIBRARY";
    let idx = 1;
    let name = base;
    while (state.intervalsConfig[name]) {
      idx += 1;
      name = base + "_" + idx;
    }
    state.intervalsConfig[name] = {};
    ensureDayMap(name);
    renderLibraries();
    clearMessage();
  }

  function removeLibrary(libName) {
    delete state.intervalsConfig[libName];
    renderLibraries();
    clearMessage();
  }

  function renameLibrary(oldName, nextName) {
    if (!nextName || nextName === oldName) return;
    if (state.intervalsConfig[nextName]) {
      showMessage('Library "' + nextName + '" already exists.', "error");
      return;
    }
    state.intervalsConfig[nextName] = state.intervalsConfig[oldName];
    delete state.intervalsConfig[oldName];
    renderLibraries();
    clearMessage();
  }

  function addInterval(libName, day) {
    ensureDayMap(libName);
    state.intervalsConfig[libName][day].push({ start: "08:30", end: "09:00" });
    renderLibraries();
    clearMessage();
  }

  function removeInterval(libName, day, idx) {
    state.intervalsConfig[libName][day].splice(idx, 1);
    renderLibraries();
    clearMessage();
  }

  function buildIntervalRow(libName, day, interval, idx) {
    const row = createEl("div", "d-flex align-items-center gap-2 mb-2");

    const startInput = createEl("input", "form-control form-control-sm");
    startInput.type = "time";
    startInput.value = interval.start;
    startInput.addEventListener("change", function (event) {
      state.intervalsConfig[libName][day][idx].start = event.target.value;
      clearMessage();
    });

    const endInput = createEl("input", "form-control form-control-sm");
    endInput.type = "time";
    endInput.value = interval.end;
    endInput.addEventListener("change", function (event) {
      state.intervalsConfig[libName][day][idx].end = event.target.value;
      clearMessage();
    });

    const removeBtn = createEl("button", "btn btn-sm btn-outline-danger", "Remove");
    removeBtn.type = "button";
    removeBtn.addEventListener("click", function () {
      removeInterval(libName, day, idx);
    });

    row.appendChild(startInput);
    row.appendChild(endInput);
    row.appendChild(removeBtn);
    return row;
  }

  function buildDayCard(libName, day) {
    const card = createEl("div", "card mb-3");
    const body = createEl("div", "card-body");

    const title = createEl("h6", "card-title d-flex justify-content-between align-items-center");
    title.textContent = day;

    const addBtn = createEl("button", "btn btn-sm btn-outline-primary", "Add interval");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () {
      addInterval(libName, day);
    });
    title.appendChild(addBtn);

    body.appendChild(title);

    const intervals = state.intervalsConfig[libName][day] || [];
    if (!intervals.length) {
      body.appendChild(createEl("div", "text-muted small", "No intervals configured"));
    } else {
      intervals.forEach(function (interval, idx) {
        body.appendChild(buildIntervalRow(libName, day, interval, idx));
      });
    }

    card.appendChild(body);
    return card;
  }

  function buildLibraryBlock(libName) {
    const wrapper = createEl("div", "card mb-4");
    const body = createEl("div", "card-body");

    const header = createEl("div", "d-flex justify-content-between align-items-center mb-3");

    const nameInput = createEl("input", "form-control me-2");
    nameInput.value = libName;
    nameInput.addEventListener("blur", function (event) {
      const next = event.target.value.trim().toUpperCase();
      if (!next) {
        event.target.value = libName;
        return;
      }
      renameLibrary(libName, next);
    });

    const deleteBtn = createEl("button", "btn btn-outline-danger", "Delete library");
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", function () {
      removeLibrary(libName);
    });

    header.appendChild(nameInput);
    header.appendChild(deleteBtn);
    body.appendChild(header);

    const grid = createEl("div", "row");
    DAYS.forEach(function (day) {
      const col = createEl("div", "col-12 col-md-6 col-xl-4");
      col.appendChild(buildDayCard(libName, day));
      grid.appendChild(col);
    });

    body.appendChild(grid);
    wrapper.appendChild(body);
    return wrapper;
  }

  function renderLibraries() {
    libsContainer.innerHTML = "";

    const libraries = Object.keys(state.intervalsConfig);
    if (!libraries.length) {
      libsContainer.appendChild(createEl("p", "text-muted", "No libraries configured. Add one to start."));
      return;
    }

    libraries.forEach(function (libName) {
      ensureDayMap(libName);
      libsContainer.appendChild(buildLibraryBlock(libName));
    });
  }

  async function requestJson(url, options) {
    const requestOptions = Object.assign({ credentials: "same-origin" }, options || {});
    const response = await fetch(url, requestOptions);

    if (response.status === 401) {
      window.location.href = "config-login.php?next=" + encodeURIComponent("lib_config.php");
      throw new Error("Authentication required");
    }

    const rawText = await response.text();
    let payload = null;

    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      throw new Error("Invalid backend response. Ensure intervals-api.php is executed by PHP.");
    }

    if (!response.ok || !payload || payload.ok !== true) {
      const errorMessage = payload && payload.error ? payload.error : "HTTP " + response.status;
      throw new Error(errorMessage);
    }

    return payload;
  }

  async function loadFromServer(showSuccess) {
    state.loading = true;
    setBusy();
    try {
      const payload = await requestJson(API_URL, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });
      state.intervalsConfig = normalizeData(payload.data || {});
      renderLibraries();
      if (showSuccess) {
        showMessage("Loaded booking-intervals.json from server.", "success");
      } else {
        clearMessage();
      }
      return true;
    } catch (error) {
      state.intervalsConfig = {};
      renderLibraries();
      showMessage("Load failed: " + error.message, "error");
      return false;
    } finally {
      state.loading = false;
      setBusy();
    }
  }

  async function saveToServer() {
    const errors = validateConfig();
    if (errors.length) {
      showMessage("Fix validation errors first: " + errors[0], "error");
      return;
    }

    state.saving = true;
    setBusy();
    try {
      await requestJson(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(state.intervalsConfig, null, 2)
      });
      showMessage("Saved changes to booking-intervals.json on server.", "success");
    } catch (error) {
      showMessage("Save failed: " + error.message, "error");
    } finally {
      state.saving = false;
      setBusy();
    }
  }

  function ensureBootstrap() {
    if (document.querySelector('link[href*="bootstrap"]')) return;
    const link = createEl("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
    document.head.appendChild(link);
  }

  function buildLayout() {
    document.title = "Booking Intervals Editor";

    const container = createEl("div", "container py-4");
    container.style.maxWidth = "1400px";

    const title = createEl("h2", "mb-2", "Booking Intervals Editor");
    const desc = createEl("p", "text-muted", "Load and save booking-intervals.json directly on the server.");

    const toolbar = createEl("div", "d-flex flex-wrap gap-2 mb-3");

    const addLibBtn = createEl("button", "btn btn-primary", "Add library");
    addLibBtn.type = "button";
    addLibBtn.addEventListener("click", addLibrary);

    loadBtn = createEl("button", "btn btn-outline-secondary", "Reload from server");
    loadBtn.type = "button";
    loadBtn.addEventListener("click", function () {
      loadFromServer(true);
    });

    saveBtn = createEl("button", "btn btn-success", "Save changes");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", saveToServer);

    messageEl = createEl("div", "alert mt-3");
    messageEl.style.display = "none";

    libsContainer = createEl("div");

    toolbar.appendChild(addLibBtn);
    toolbar.appendChild(loadBtn);
    toolbar.appendChild(saveBtn);

    container.appendChild(title);
    container.appendChild(desc);
    container.appendChild(toolbar);
    container.appendChild(messageEl);
    container.appendChild(libsContainer);
    root.appendChild(container);
  }

  async function init() {
    if (window.location.protocol === "file:") {
      root = document.getElementById("app") || document.body;
      root.innerHTML = "";
      const warn = createEl(
        "div",
        "alert alert-danger m-3",
        "This page must run from a PHP web server (not file://) to load/save booking-intervals.json."
      );
      root.appendChild(warn);
      return;
    }

    ensureBootstrap();
    root = document.getElementById("app");
    if (!root) {
      root = createEl("div");
      root.id = "app";
      document.body.innerHTML = "";
      document.body.appendChild(root);
    }

    buildLayout();
    await loadFromServer(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
