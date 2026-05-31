export function createCaptureRenderers(deps) {
  const {
    addDaysIso,
    candidateDatePickerStateRef,
    allDayReminderOffsetLabels,
    categoryLabels,
    cropAspectStyle,
    customOffsetUnitLabels,
    escapeHtml,
    dateToIso,
    formatDate,
    formatReminderOffset,
    formatReminderRepeat,
    getActiveCandidates,
    getAdjacentCandidateId,
    getCandidateIndex,
    getCapturePlace,
    getCaptureRoom,
    getDeletedCandidates,
    getFallbackActiveCandidateId,
    getReminderOffsetLabels,
    getRequestedRecognitionProvider,
    getSelectedCandidateCount,
    icons,
    imageAspectStyle,
    makeVirtualPlace,
    monthKeyFromIso,
    moveMonthKey,
    normalizeReminder,
    normalizeReminderList,
    nextMondayIso,
    platform,
    providerLabel,
    repeatLabels,
    stateRef,
    getCalendarDays,
    today,
    styleActiveCandidateLabel,
    styleBox,
    styleCandidatePin,
    timedReminderOffsetLabels,
    visionConfig,
  } = deps;

  const getState = () => stateRef.current;

  function getRecognitionStatusMeta() {
    const status = getState().capture.recognitionStatus || "idle";
    const candidates = getState().capture.candidates || [];
    const activeCandidates = getActiveCandidates(candidates);
    const hasImage = Boolean(getState().capture.image);
    if (status === "detecting") return { label: "识别主体", cls: "warn", body: "正在检测照片里的主体区域" };
    if (status === "naming") return { label: "命名中", cls: "warn", body: "主体框已生成，正在匹配物品名称" };
    if (status === "loading") return { label: hasImage ? "分析中" : "处理照片", cls: "warn", body: hasImage ? "正在本地分析上传照片" : "正在解码并压缩上传照片" };
    if (status === "done") return { label: "已生成候选", cls: "good", body: `${activeCandidates.length} 个候选，${getSelectedCandidateCount(candidates)} 个待入库` };
    if (status === "empty") return { label: "未发现候选", cls: "warn", body: "没有识别到可入库物品" };
    if (status === "error") return { label: "分析失败", cls: "danger", body: getState().capture.recognitionError || "请稍后重试" };
    return {
      label: hasImage ? "等待分析" : "等待照片",
      cls: "",
      body: hasImage ? "上传照片已载入，等待本地图片分析" : "选择一张空间照片",
    };
  }

  function renderRecognitionDiagnostics() {
    const diagnostics = getState().capture.recognitionDiagnostics;
    if (!diagnostics) return "";
    const total = Math.round(diagnostics.totalMs || 0);
    const detection = Math.round(diagnostics.detectionMs || 0);
    const naming = Math.round(diagnostics.namingMs || 0);
    const dimensions = diagnostics.imageDimensions
      ? `${diagnostics.imageDimensions.width}x${diagnostics.imageDimensions.height}`
      : "未知尺寸";
    const threadText = diagnostics.wasmThreads ? ` · WASM ${diagnostics.wasmThreads}线程` : "";
    const detectorLoadText = Number.isFinite(diagnostics.detectorLoadMs) ? ` · 加载 ${Math.round(diagnostics.detectorLoadMs)}ms` : "";
    const roomPromptText = diagnostics.promptRoomType ? ` · ${diagnostics.promptRoomType}包` : "";
    const shardText = diagnostics.promptShardNames ? ` · ${diagnostics.promptShardNames}` : "";
    const promptText = diagnostics.promptCount
      ? `${roomPromptText} · prompts ${diagnostics.promptCount}/${diagnostics.promptBatches || 1}批${shardText}`
      : "";
    const embeddingText = Number.isFinite(diagnostics.embeddingMs) ? ` · embedding累计 ${Math.round(diagnostics.embeddingMs)}ms` : "";
    return `<p class="panel-subtitle diagnostic-line">${escapeHtml(`${providerLabel(diagnostics.provider)} · ${dimensions}${threadText}${detectorLoadText}${promptText} · 主体 ${detection}ms · 命名 ${naming}ms${embeddingText} · 总计 ${total}ms · ${diagnostics.resultCount} 个`)}</p>`;
  }

  function renderCaptureControls() {
    return `
      <div class="capture-controls">
        ${platform.photos.canUseNativePhotoLibrary()
          ? `<button class="secondary-btn" data-native-photo-library>${icons.box}<span>上传照片</span></button>`
          : `<button class="secondary-btn file-input">${icons.box}<span>上传照片</span><input type="file" accept="image/*" data-file-input /></button>`}
        <button class="secondary-btn" data-camera-start>${icons.camera}<span>摄像头</span></button>
      </div>
    `;
  }

  function renderCaptureView() {
    const room = getCaptureRoom();
    const place = getCapturePlace() || makeVirtualPlace(room);
    const candidates = getState().capture.candidates || [];
    const activeCandidates = getActiveCandidates(candidates);
    const deletedCandidates = getDeletedCandidates(candidates);
    const selectedCount = getSelectedCandidateCount(candidates);
    return `
      <section class="panel">
        <div class="capture-grid">
          <div class="capture-workspace">
            ${renderCaptureControls()}
            ${renderCaptureStage()}
          </div>
          <div class="panel">
            <div class="panel-head">
              <div>
                <h3 class="panel-title">候选物品</h3>
                <p class="panel-subtitle">${escapeHtml(place.shortName)} · ${escapeHtml(providerLabel(getState().capture.provider))}</p>
                ${renderRecognitionDiagnostics()}
              </div>
              <span class="count-pill">${selectedCount}/${activeCandidates.length}${deletedCandidates.length ? ` · 回收站 ${deletedCandidates.length}` : ""}</span>
            </div>
            ${renderCandidateReviewPanel(candidates)}
          </div>
        </div>
      </section>
    `;
  }

  function renderCaptureStage() {
    const candidates = getActiveCandidates(getState().capture.candidates || []);
    const activeId = getFallbackActiveCandidateId(getState().capture.activeCandidateId);
    const activeCandidate = candidates.find((candidate) => candidate.id === activeId);
    const hasImage = Boolean(getState().capture.image) && !getState().cameraOn;
    return `
      <div class="capture-stage ${hasImage ? "has-image" : ""}" data-capture-stage ${hasImage ? imageAspectStyle(getState().capture.imageMeta) : ""}>
        ${getState().cameraOn ? `<video id="cameraVideo" autoplay playsinline muted></video>` : getState().capture.image ? `<img alt="上传的储物点照片" src="${getState().capture.image}" />` : renderCapturePlaceholder()}
        ${getState().cameraOn ? `<button class="primary-btn" data-camera-shot style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:3">${icons.camera}<span>拍照</span></button>` : ""}
        ${activeCandidate ? `
          <span
            class="candidate-active-frame ${activeCandidate.selected ? "selected" : "unselected"}"
            style="${styleBox(activeCandidate.box)}"
            data-candidate-drag="${activeCandidate.id}"
            data-drag-mode="move"
            role="button"
            aria-label="拖拽调整 ${escapeHtml(activeCandidate.name)} 主体框"
          >
            <span class="candidate-active-highlight"></span>
            ${[
              ["tl", "nw"],
              ["tr", "ne"],
              ["bl", "sw"],
              ["br", "se"],
            ].map(([corner, handle]) => `
              <span class="frame-corner ${corner}" data-candidate-resize="${activeCandidate.id}" data-resize-handle="${handle}" aria-hidden="true"></span>
            `).join("")}
          </span>
          <span class="candidate-active-label" style="${styleActiveCandidateLabel(activeCandidate.box)}">
            ${escapeHtml(activeCandidate.namingStatus === "loading" ? "识别中" : activeCandidate.name)} <b>›</b>
          </span>
        ` : ""}
        ${candidates.map((candidate) => {
          const isActive = activeId === candidate.id;
          const isNaming = candidate.namingStatus === "loading";
          return `
          <button
            class="candidate-pin ${candidate.selected ? "selected" : "unselected"} ${isActive ? "active" : ""} ${isNaming ? "naming" : ""}"
            style="${styleCandidatePin(candidate.box)}"
            data-candidate-select="${candidate.id}"
            aria-label="查看 ${escapeHtml(candidate.name)} 的主体框"
          >
            <span class="pin-dot"></span>
          </button>
        `;
        }).join("")}
      </div>
    `;
  }

  function renderCapturePlaceholder() {
    return `
      <div class="capture-placeholder">
        <div class="placeholder-panel">
          <strong>等待照片</strong>
          <span>上传或拍摄储物点</span>
        </div>
      </div>
    `;
  }

  function hasCandidateOptionalDetails(candidate) {
    return Boolean(candidate.expireAt || normalizeReminderList(candidate).length || candidate.container);
  }

  function renderCandidateMetaChips(candidate) {
    const chips = [];
    if (candidate.expireAt) chips.push(`保质期 ${formatDate(candidate.expireAt)}`);
    for (const reminder of normalizeReminderList(candidate).slice(0, 2)) {
      chips.push(`${reminder.title} ${formatReminderSchedule(reminder)}`);
    }
    if (candidate.container) chips.push(`位置 ${candidate.container}`);
    if (candidate.namingRejectionReason && candidate.catalogCandidates?.length) {
      const names = candidate.catalogCandidates.slice(0, 3).map((entry) => entry.displayName).filter(Boolean).join(" / ");
      chips.push(`低置信候选 ${names}`);
    } else if (candidate.catalogCandidates?.length) {
      const best = candidate.catalogCandidates[0];
      if (best?.displayName && Number.isFinite(Number(best.score))) {
        chips.push(`命名匹配 ${best.displayName} ${Math.round(Number(best.score) * 100)}%`);
      }
    }
    if (!chips.length) return "";
    return `<div class="candidate-meta-chips">${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}</div>`;
  }

  function renderCandidateDatePicker(candidate, field, label) {
    const value = candidate[field] || "";
    return `
      <div class="date-picker-block">
        <span>${escapeHtml(label)}</span>
        <button class="secondary-btn compact-btn date-choice" type="button" data-open-date-picker="${candidate.id}" data-field="${field}">
          <strong>${value ? escapeHtml(formatDate(value)) : "选择日期"}</strong>
        </button>
        ${value ? `<button class="ghost-btn compact-btn" type="button" data-clear-candidate-date="${candidate.id}" data-field="${field}">清除</button>` : ""}
      </div>
    `;
  }

  function renderCandidateReviewPanel(candidates) {
    const activeCandidates = getActiveCandidates(candidates);
    const deletedCandidates = getDeletedCandidates(candidates);
    const activeId = getFallbackActiveCandidateId(getState().capture.activeCandidateId);
    const activeCandidate = activeCandidates.find((candidate) => candidate.id === activeId);
    const activeIndex = activeCandidate ? getCandidateIndex(activeCandidates, activeCandidate.id) : -1;
    const status = getState().capture.recognitionStatus;
    const emptyText = status === "empty"
      ? "没有候选区域"
      : status === "error" ? "分析失败" : getState().capture.image ? "正在分析照片" : "等待照片";
    return `
      <div class="candidate-list candidate-card-stack">
        ${getState().capture.recognitionError ? `<p class="capture-message danger">${escapeHtml(getState().capture.recognitionError)}</p>` : ""}
        ${activeCandidate
          ? renderCandidate(activeCandidate, activeIndex, activeCandidates.length)
          : `<p class="empty-state">${emptyText}</p>`}
        ${renderCandidateTrash(deletedCandidates)}
      </div>
    `;
  }

  function renderCandidateTrash(deletedCandidates) {
    if (!deletedCandidates.length) return "";
    return `
      <section class="candidate-trash">
        <div class="candidate-trash-head">
          <strong>垃圾箱</strong>
          <span>${deletedCandidates.length} 个可恢复</span>
        </div>
        <div class="candidate-trash-list">
          ${deletedCandidates.map((candidate) => `
            <article class="trash-candidate">
              ${renderCandidateCrop(candidate)}
              <div>
                <strong>${escapeHtml(candidate.name)}</strong>
                <span>置信度 ${Math.round(candidate.confidence * 100)}%</span>
              </div>
              <button class="secondary-btn compact-btn" type="button" data-restore-candidate="${candidate.id}">恢复</button>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderCandidateReminders(candidate) {
    const reminders = normalizeReminderList(candidate);
    return `
      <section class="reminder-task-panel">
        <div class="reminder-task-head">
          <div>
            <strong>提醒</strong>
            <span>${reminders.length ? `${reminders.length} 个提醒事项` : "未设置"}</span>
          </div>
          <button class="secondary-btn compact-btn" type="button" data-add-candidate-reminder="${candidate.id}">${icons.plus}<span>添加提醒</span></button>
        </div>
        ${reminders.length ? `
          <div class="reminder-task-list">
            ${reminders.map((reminder) => `
              <article class="reminder-task-row">
                <div>
                  <strong>${escapeHtml(reminder.title)}</strong>
                  <span>${escapeHtml(formatReminderSchedule(reminder))} · ${escapeHtml(formatReminderOffset(reminder))}</span>
                </div>
                <div class="candidate-actions">
                  <button class="ghost-btn compact-btn" type="button" data-edit-candidate-reminder="${candidate.id}" data-reminder-id="${reminder.id}">编辑</button>
                  <button class="icon-btn" type="button" data-delete-candidate-reminder="${candidate.id}" data-reminder-id="${reminder.id}" title="删除提醒" aria-label="删除提醒">${icons.trash}</button>
                </div>
              </article>
            `).join("")}
          </div>
        ` : `<p class="empty-state compact">提醒不是必填；需要时可以添加多个提醒事项。</p>`}
      </section>
    `;
  }

  function renderCandidateDateModal() {
    if (!candidateDatePickerStateRef.current) return "";
    const candidate = (getState().capture.candidates || []).find((entry) => entry.id === candidateDatePickerStateRef.current.candidateId);
    if (!candidate) return "";
    const isReminder = candidateDatePickerStateRef.current.mode === "reminder";
    const reminder = isReminder ? normalizeReminder(candidateDatePickerStateRef.current.reminder) : null;
    const title = isReminder ? "提醒" : "保质期";
    const selected = isReminder
      ? reminder.date
      : (candidateDatePickerStateRef.current.date || dateToIso(today));
    const monthKey = candidateDatePickerStateRef.current.month || monthKeyFromIso(selected);
    const [year, month] = monthKey.split("-").map(Number);
    const monthTitle = `${year}年${month}月`;
    const quickOptions = isReminder
      ? [
        ["今天", addDaysIso(0)],
        ["明天", addDaysIso(1)],
        ["下周一", nextMondayIso()],
        ["明天上午", addDaysIso(1), "09:00", true],
      ]
      : [
        ["今天", addDaysIso(0)],
        ["1个月", addDaysIso(30)],
        ["3个月", addDaysIso(90)],
        ["半年", addDaysIso(180)],
      ];
    const [hour, minute] = isReminder ? formatReminderTime(reminder.time).split(":") : ["09", "00"];
    const offsetLabels = isReminder ? getReminderOffsetLabels(reminder.hasTime) : {};
    return `
      <div class="date-modal-backdrop" data-date-modal-dismiss>
        <section class="date-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" data-date-modal>
          <div class="date-modal-head">
            <button class="round-btn" type="button" data-close-date-modal aria-label="关闭">×</button>
            <div class="date-mode-tabs">
              <span class="active">${escapeHtml(title)}</span>
            </div>
            <button class="round-btn confirm" type="button" data-confirm-date-modal aria-label="确认">✓</button>
          </div>
          ${isReminder ? `
            <label class="modal-field">
              <span>提醒事项</span>
              <input class="field" value="${escapeHtml(reminder.title)}" data-date-reminder-title placeholder="例如：换滤芯、补货、复查" />
            </label>
          ` : ""}
          <div class="date-quick-grid">
            ${quickOptions.map(([label, date, time, hasTime]) => `
              <button type="button" data-date-quick="${date}" ${time ? `data-time-quick="${time}"` : ""} ${hasTime ? "data-time-enabled=\"true\"" : ""}>
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(formatDate(date))}</span>
              </button>
            `).join("")}
          </div>
          <div class="calendar-title-row">
            <button type="button" data-calendar-month="-1" aria-label="上个月">‹</button>
            <strong>${escapeHtml(monthTitle)}</strong>
            <button type="button" data-calendar-month="1" aria-label="下个月">›</button>
          </div>
          <div class="calendar-grid" aria-label="选择日期">
            ${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>${day}</span>`).join("")}
            ${getCalendarDays(monthKey).map((day) => `
              <button
                type="button"
                class="${day.inMonth ? "" : "muted"} ${day.iso === selected ? "selected" : ""} ${day.iso === dateToIso(today) ? "today" : ""}"
                data-calendar-day="${day.iso}"
              >${day.day}</button>
            `).join("")}
          </div>
          ${isReminder ? `
            <div class="reminder-options">
              <label class="reminder-time-toggle">
                <span>时间</span>
                <span class="switch-row">
                  <input type="checkbox" data-date-has-time ${reminder.hasTime ? "checked" : ""} />
                  <b>${reminder.hasTime ? "精确到分钟" : "不选时间"}</b>
                </span>
              </label>
              ${reminder.hasTime ? `
                <label>
                  <span>具体时间</span>
                  <div class="time-select-row">
                  <select class="select-field" data-date-time-hour>
                    ${Array.from({ length: 24 }, (_, value) => String(value).padStart(2, "0")).map((value) => `<option value="${value}" ${hour === value ? "selected" : ""}>${value}</option>`).join("")}
                  </select>
                  <b>:</b>
                  <select class="select-field" data-date-time-minute>
                    ${Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0")).map((value) => `<option value="${value}" ${minute === value ? "selected" : ""}>${value}</option>`).join("")}
                  </select>
                  </div>
                </label>
              ` : ""}
              <label>
                <span>提醒</span>
                <select class="select-field" data-date-offset>
                  ${Object.entries(offsetLabels).map(([key, label]) => `<option value="${key}" ${reminder.offset === key ? "selected" : ""}>${label}</option>`).join("")}
                </select>
              </label>
              ${reminder.offset === "custom" ? `
                <label>
                  <span>自定义</span>
                  <div class="custom-offset-row">
                    <input class="field" type="number" min="1" value="${reminder.customOffset.amount}" data-date-custom-offset-amount />
                    <select class="select-field" data-date-custom-offset-unit>
                      ${Object.entries(customOffsetUnitLabels).map(([key, label]) => `<option value="${key}" ${reminder.customOffset.unit === key ? "selected" : ""}>${label}</option>`).join("")}
                    </select>
                  </div>
                </label>
              ` : ""}
              <label>
                <span>重复</span>
                <select class="select-field" data-date-repeat>
                  ${Object.entries(repeatLabels).map(([key, label]) => `<option value="${key}" ${reminder.repeat === key ? "selected" : ""}>${label}</option>`).join("")}
                </select>
              </label>
            </div>
          ` : ""}
        </section>
      </div>
    `;
  }

  function renderCandidateCrop(candidate) {
    const label = candidate.cropImage ? "主体裁切图" : "裁切图生成中";
    return `
      <div class="candidate-crop ${candidate.cropImage ? "" : "empty"}" aria-label="${escapeHtml(label)}" ${cropAspectStyle(candidate.cropMeta)}>
        ${candidate.cropImage
          ? `<img src="${candidate.cropImage}" alt="${escapeHtml(candidate.name)}主体裁切图" />`
          : `<span>${escapeHtml(label)}</span>`}
      </div>
    `;
  }

  function catalogCandidateImageSrc(candidate) {
    const image = candidate?.representativeImages?.[0] || {};
    const imagePath = image.normalizedImagePath || "";
    if (!imagePath || !imagePath.startsWith("data/")) return "";
    return `/${imagePath}`;
  }

  function renderCatalogCandidatePanel(candidate) {
    const candidates = Array.isArray(candidate.catalogCandidates) ? candidate.catalogCandidates.slice(0, 3) : [];
    if (!candidates.length) return "";
    const title = candidate.namingRejectionReason ? "可能是这些物品" : "相似命名候选";
    return `
      <div class="catalog-candidate-panel">
        <div class="catalog-candidate-head">
          <strong>${escapeHtml(title)}</strong>
          ${candidate.namingRejectionReason ? `<span>低置信 · 请确认</span>` : `<span>按相似度排序</span>`}
        </div>
        <div class="catalog-candidate-list">
          ${candidates.map((entry, index) => {
            const src = catalogCandidateImageSrc(entry);
            const score = Number(entry.score) || 0;
            const hitCount = Number(entry.hitCount) || 1;
            return `
              <button class="catalog-candidate-option" type="button" data-apply-catalog-candidate="${candidate.id}" data-candidate-rank="${index}">
                <span class="catalog-candidate-thumb">
                  ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(entry.displayName || "候选")}" loading="lazy" />` : `<b>${index + 1}</b>`}
                </span>
                <span class="catalog-candidate-copy">
                  <strong>${escapeHtml(entry.displayName || entry.categoryId || "候选物品")}</strong>
                  <small>${Math.round(score * 100)}% · ${hitCount} 个相似样本</small>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderCandidate(candidate, activeIndex = 0, total = 1) {
    const isActive = getFallbackActiveCandidateId(getState().capture.activeCandidateId) === candidate.id;
    const isNaming = candidate.namingStatus === "loading";
    const isLoading = ["loading", "detecting", "naming"].includes(getState().capture.recognitionStatus);
    const selectedCount = getSelectedCandidateCount();
    const showDetails = candidate.detailsOpen || hasCandidateOptionalDetails(candidate);
    const showBox = candidate.boxOpen;
    const previousId = getAdjacentCandidateId(candidate.id, -1);
    const nextId = getAdjacentCandidateId(candidate.id, 1);
    return `
      <article class="candidate-card ${candidate.selected ? "" : "muted"} ${isActive ? "active" : ""} ${isNaming ? "naming" : ""}" data-candidate-select="${candidate.id}">
        <div class="candidate-card-nav">
          <button class="icon-btn" type="button" data-candidate-prev="${candidate.id}" ${previousId === candidate.id ? "disabled" : ""} aria-label="上一个候选">‹</button>
          <span>第 ${activeIndex + 1} / ${total} 个候选</span>
          <button class="icon-btn" type="button" data-candidate-next="${candidate.id}" ${nextId === candidate.id ? "disabled" : ""} aria-label="下一个候选">›</button>
          <button class="icon-btn danger" type="button" data-delete-candidate="${candidate.id}" title="删除候选" aria-label="删除候选">${icons.trash}</button>
        </div>
        <div class="candidate-head">
          <label class="checkbox">
            <input type="checkbox" ${candidate.selected ? "checked" : ""} data-candidate-toggle="${candidate.id}" />
            <strong>${isNaming ? `${escapeHtml(candidate.name)} · 识别中` : escapeHtml(candidate.name)}</strong>
          </label>
          <div class="candidate-actions">
            <span class="status-pill good">置信度 ${Math.round(candidate.confidence * 100)}%</span>
            <button class="primary-btn compact-btn" type="button" data-confirm-all ${selectedCount && !isLoading ? "" : "disabled"}>${icons.check}<span>确认入库</span></button>
          </div>
        </div>
        ${renderCandidateMetaChips(candidate)}
        <div class="candidate-body">
          ${renderCandidateCrop(candidate)}
          <div class="candidate-info">
            <div class="candidate-form">
              <label class="candidate-field">
                <span>物品名</span>
                <input class="field" value="${escapeHtml(candidate.name)}" data-candidate-field="${candidate.id}" data-field="name" aria-label="物品名称" />
              </label>
              <label class="candidate-field">
                <span>分类</span>
                <select class="select-field" data-candidate-field="${candidate.id}" data-field="category" aria-label="分类">
                  ${Object.entries(categoryLabels).map(([key, label]) => `<option value="${key}" ${candidate.category === key ? "selected" : ""}>${label}</option>`).join("")}
                </select>
              </label>
              <label class="candidate-field">
                <span>数量（件）</span>
                <input class="field" type="number" min="1" value="${escapeHtml(candidate.qty || 1)}" data-candidate-field="${candidate.id}" data-field="qty" aria-label="数量，按件数统计" />
                <small>默认按 1 件入库</small>
              </label>
            </div>
            <div class="candidate-option-bar">
              <button class="secondary-btn compact-btn" data-scan-candidate-inside="${candidate.id}">${icons.camera}<span>拍内部</span></button>
              <button class="ghost-btn compact-btn" type="button" data-toggle-candidate-details="${candidate.id}">
                ${icons.bell}<span>${showDetails ? "收起提醒" : "保质期/提醒"}</span>
              </button>
              <button class="ghost-btn compact-btn" type="button" data-toggle-candidate-box="${candidate.id}">
                ${icons.scan}<span>${showBox ? "收起定位" : "调整定位"}</span>
              </button>
            </div>
            ${renderCatalogCandidatePanel(candidate)}
          </div>
        </div>
        ${showDetails ? `
          <div class="candidate-extra-panel">
            <div class="date-picker-grid">
              ${renderCandidateDatePicker(candidate, "expireAt", "保质期")}
            </div>
            ${renderCandidateReminders(candidate)}
            <label class="candidate-field">
              <span>具体位置</span>
              <input class="field" value="${escapeHtml(candidate.container || "")}" data-candidate-field="${candidate.id}" data-field="container" aria-label="具体位置" placeholder="例如：左侧抽屉、白色药箱" />
            </label>
          </div>
        ` : ""}
        ${showBox ? `
          <div class="box-control-grid" aria-label="定位框数值">
            ${["x", "y", "w", "h"].map((field) => `
              <label>
                <span>${field.toUpperCase()}</span>
                <input class="field" type="number" min="0" max="100" step="1" value="${Math.round(candidate.box[field])}" data-candidate-box-field="${candidate.id}" data-field="${field}" aria-label="${field.toUpperCase()} 坐标" />
              </label>
            `).join("")}
          </div>
        ` : ""}
      </article>
    `;
  }

  return {
    getRecognitionStatusMeta,
    renderCandidate,
    renderCandidateCrop,
    renderCandidateDateModal,
    renderCandidateDatePicker,
    renderCandidateMetaChips,
    renderCandidateReminders,
    renderCandidateReviewPanel,
    renderCandidateTrash,
    renderCaptureControls,
    renderCapturePlaceholder,
    renderCaptureStage,
    renderCaptureView,
    renderCatalogCandidatePanel,
    renderRecognitionDiagnostics,
  };
}
