window.__ModuleLoader__.load({
  id: '@local/dsh-speaker-axis',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useRef, useState } = React

    const NS = 'speaker-axis'
    const DICTS = {
      zh: {
        button: '打轴',
        title: '说话人轴工作室',
        subtitle: '只生成按说话人分色的时间轴，不转写、不翻译',
        close: '关闭',
        dropTitle: '拖入视频或音频，或点击选择',
        dropHint: '支持 MP4 / MKV / MOV / MP3 / WAV 等，文件只在本机处理',
        chooseFile: '选择文件',
        replace: '更换',
        fileMeta: '{name} · {size}',
        speakerCount: '说话人数',
        auto: '自动识别',
        people: '{n} 人',
        style: '样式',
        styleNeon: '霓虹分色',
        styleCandy: '柔光粉彩',
        styleBroadcast: '大字底框',
        styleMono: '黑白极简',
        position: '位置',
        bottom: '底部',
        top: '顶部',
        alternate: '上下交替',
        placeholder: '占位文字',
        placeholderHint: '可用 {name}、{index}、{time}；留空则事件不可见',
        maxLine: '单条最长',
        noSplit: '不拆分',
        seconds: '{n} 秒',
        start: '开始打轴',
        uploading: '上传文件',
        processing: '处理中',
        modelNote: '首次使用会下载约 34 MB 离线模型；之后完全本机运行。',
        modelReady: '离线说话人模型已就绪',
        modelMissing: '首次处理时会自动下载离线说话人模型',
        mediaProgress: '已处理 {current} / {total}',
        etaRemaining: '预计剩余 {time}',
        cancel: '取消',
        resultTitle: '打轴完成',
        resultSubtitle: '{name} · ASS 时间轴',
        summarySpeakers: '发言人',
        summarySegments: '片段',
        summaryDuration: '时长',
        outputPath: '输出文件',
        copyPath: '复制路径',
        copied: '已复制',
        download: '下载 ASS',
        regenerate: '应用样式并重新生成',
        regenerating: '正在重新生成…',
        speakerLabels: '说话人名称',
        speakerStats: '{n} 段 · {time}',
        timeline: '时间轴',
        segmentList: '片段明细',
        segmentRange: '{start} → {end}',
        segmentPreview: '显示前 {shown} / {total} 段',
        newTask: '新建任务',
        errorTitle: '出错了',
        retry: '重试',
        noFile: '请先选择一个视频或音频文件',
        uploadFailed: '上传失败',
        processingHint: '长视频可能需要几分钟。关闭窗口不会中断任务，再次打开可继续查看。',
        analyzing: '正在分析人声与说话人…',
        resultHint: '改名或调整样式只重新生成 ASS，不会重新识别说话人。',
        labelPlaceholder: '例如：主持人',
        styleSettings: '样式设置',
        sourceFile: '源文件',
        jobRestored: '已恢复上次任务',
        copyFailed: '复制失败',
        unknownError: '未知错误',
        speakerDefault: '说话人 {n}',
        showAll: '共 {n} 段',
        settingsTitle: '打轴设置',
        noTranscribe: '不生成字幕文本，不翻译',
      },
      en: {
        button: 'Axis',
        title: 'Speaker axis studio',
        subtitle: 'Speaker-colored timing only — no transcription, no translation',
        close: 'Close',
        dropTitle: 'Drop a video or audio file, or click to choose',
        dropHint: 'MP4 / MKV / MOV / MP3 / WAV and more. Processed locally.',
        chooseFile: 'Choose file',
        replace: 'Replace',
        fileMeta: '{name} · {size}',
        speakerCount: 'Speakers',
        auto: 'Auto detect',
        people: '{n} speakers',
        style: 'Style',
        styleNeon: 'Neon split',
        styleCandy: 'Soft pastel',
        styleBroadcast: 'Broadcast box',
        styleMono: 'Monochrome',
        position: 'Position',
        bottom: 'Bottom',
        top: 'Top',
        alternate: 'Alternate top/bottom',
        placeholder: 'Placeholder text',
        placeholderHint: 'Use {name}, {index}, {time}; leave empty for invisible events',
        maxLine: 'Max event length',
        noSplit: 'Do not split',
        seconds: '{n}s',
        start: 'Build speaker axis',
        uploading: 'Uploading',
        processing: 'Processing',
        modelNote: 'First use downloads about 34 MB of offline models; afterwards it runs fully locally.',
        modelReady: 'Offline speaker models are ready',
        modelMissing: 'Offline speaker models download automatically on first run',
        mediaProgress: 'Processed {current} / {total}',
        etaRemaining: 'About {time} left',
        cancel: 'Cancel',
        resultTitle: 'Axis ready',
        resultSubtitle: '{name} · ASS timing',
        summarySpeakers: 'Speakers',
        summarySegments: 'Segments',
        summaryDuration: 'Duration',
        outputPath: 'Output file',
        copyPath: 'Copy path',
        copied: 'Copied',
        download: 'Download ASS',
        regenerate: 'Apply style and regenerate',
        regenerating: 'Regenerating…',
        speakerLabels: 'Speaker names',
        speakerStats: '{n} segments · {time}',
        timeline: 'Timeline',
        segmentList: 'Segments',
        segmentRange: '{start} → {end}',
        segmentPreview: 'Showing {shown} of {total} segments',
        newTask: 'New task',
        errorTitle: 'Something went wrong',
        retry: 'Retry',
        noFile: 'Choose a video or audio file first',
        uploadFailed: 'Upload failed',
        processingHint: 'Long videos can take a few minutes. Closing this window does not stop the job; reopen it to check progress.',
        analyzing: 'Analyzing speech and speakers…',
        resultHint: 'Renaming or restyling only rewrites the ASS file; it does not re-run speaker detection.',
        labelPlaceholder: 'e.g. Host',
        styleSettings: 'Style settings',
        sourceFile: 'Source file',
        jobRestored: 'Restored the previous task',
        copyFailed: 'Copy failed',
        unknownError: 'Unknown error',
        speakerDefault: 'Speaker {n}',
        showAll: '{n} segments',
        settingsTitle: 'Axis settings',
        noTranscribe: 'No transcript, no translation',
      },
    }

    const DEFAULT_OPTIONS = {
      speakerCount: 0,
      stylePreset: 'neon',
      position: 'bottom',
      maxSegmentSeconds: 8,
      placeholder: '{name}',
    }

    const PREVIEW_PALETTES = {
      neon: ['#4DE8FF', '#FF76BD', '#FFD166', '#8CFF7A', '#C79BFF', '#FF9A62', '#6FB6FF', '#F38BFF'],
      candy: ['#FFD6E7', '#CBEFFF', '#D8F7C8', '#FFECA8', '#E6D8FF', '#FFCFBC', '#C8F4EC', '#F6D7F3'],
      broadcast: ['#FFFFFF', '#FFE066', '#93E79A', '#7BC4FF', '#FFADAD', '#CDB6FF', '#FFD3A1', '#B6F0C0'],
      mono: ['#FFFFFF', '#D9D9D9', '#BDBDBD', '#A6A6A6', '#8F8F8F', '#F2F2F2', '#C9C9C9', '#E6E6E6'],
    }

    const CSS = String.raw`
      .dsh-sa-style-anchor { display: none; }
      .dsh-sa-launcher {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        height: 28px; min-width: 28px; padding: 0 8px; border: 1px solid transparent;
        border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary, #9b99a8);
        font: inherit; font-size: 12px; line-height: 1; cursor: pointer; white-space: nowrap;
        transition: background .15s ease, color .15s ease, border-color .15s ease;
      }
      .dsh-sa-launcher:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.07));
        color: var(--dsw-alias-label-primary, #f2f1f6);
      }
      .dsh-sa-launcher:focus-visible, .dsh-sa-iconbtn:focus-visible,
      .dsh-sa-btn:focus-visible, .dsh-sa-select:focus-visible, .dsh-sa-input:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary, #6c8cff); outline-offset: 2px;
      }
      .dsh-sa-backdrop {
        position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center;
        justify-content: center; padding: 22px; pointer-events: auto;
        background: rgba(8, 8, 14, .58); backdrop-filter: blur(6px);
      }
      .dsh-sa-panel {
        width: min(830px, 100%); max-height: min(90vh, 920px); display: flex; flex-direction: column;
        overflow: hidden; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12));
        border-radius: 18px; color: var(--dsw-alias-label-primary, #f2f1f6);
        background: var(--dsw-alias-bg-overlay, #1c1b22);
        box-shadow: 0 28px 90px rgba(0,0,0,.46), 0 2px 10px rgba(0,0,0,.24);
      }
      .dsh-sa-head {
        display: flex; align-items: flex-start; gap: 12px; padding: 18px 20px 14px;
        border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1));
        background: linear-gradient(180deg, rgba(255,255,255,.035), transparent);
      }
      .dsh-sa-mark {
        width: 38px; height: 38px; flex: 0 0 38px; border-radius: 11px; display: flex;
        align-items: center; justify-content: center; color: #fff;
        background: linear-gradient(135deg, rgba(73,230,255,.26), rgba(255,120,189,.28));
        border: 1px solid rgba(255,255,255,.12);
      }
      .dsh-sa-headtext { min-width: 0; flex: 1; }
      .dsh-sa-title { margin: 1px 0 3px; font-size: 16px; line-height: 1.35; font-weight: 650; letter-spacing: -.01em; }
      .dsh-sa-subtitle { margin: 0; font-size: 12px; line-height: 1.45; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-iconbtn {
        width: 30px; height: 30px; flex: 0 0 30px; display: inline-flex; align-items: center; justify-content: center;
        border: 1px solid transparent; border-radius: 8px; background: transparent; cursor: pointer;
        color: var(--dsw-alias-label-secondary, #9b99a8);
      }
      .dsh-sa-iconbtn:hover { background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.07)); color: var(--dsw-alias-label-primary, #f2f1f6); }
      .dsh-sa-body { overflow: auto; padding: 16px 20px 20px; scrollbar-width: thin; }
      .dsh-sa-section { margin-bottom: 14px; }
      .dsh-sa-section:last-child { margin-bottom: 0; }
      .dsh-sa-drop {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
        min-height: 154px; padding: 20px; border: 1px dashed var(--dsw-alias-border-l2, rgba(255,255,255,.18));
        border-radius: 14px; background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035));
        cursor: pointer; text-align: center; transition: border-color .15s ease, background .15s ease;
      }
      .dsh-sa-drop:hover, .dsh-sa-drop.is-drag {
        border-color: var(--dsw-alias-brand-primary, #6c8cff);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary, #6c8cff) 7%, transparent);
      }
      .dsh-sa-dropicon {
        width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
        color: var(--dsw-alias-brand-primary, #6c8cff); background: color-mix(in srgb, var(--dsw-alias-brand-primary, #6c8cff) 13%, transparent);
      }
      .dsh-sa-droptitle { font-size: 14px; font-weight: 600; }
      .dsh-sa-drophint { font-size: 12px; color: var(--dsw-alias-label-secondary, #9b99a8); line-height: 1.5; }
      .dsh-sa-filecard {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 11px;
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1));
      }
      .dsh-sa-fileicon {
        width: 30px; height: 30px; flex: 0 0 30px; display: flex; align-items: center; justify-content: center;
        border-radius: 8px; color: var(--dsw-alias-brand-primary, #6c8cff);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary, #6c8cff) 12%, transparent);
      }
      .dsh-sa-filename { font-size: 13px; font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-sa-filemeta { margin-top: 2px; font-size: 11px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .dsh-sa-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .dsh-sa-field.is-wide { grid-column: 1 / -1; }
      .dsh-sa-label { font-size: 12px; font-weight: 550; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-select, .dsh-sa-input {
        width: 100%; box-sizing: border-box; height: 36px; padding: 0 10px; border-radius: 9px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.14));
        background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.05));
        color: var(--dsw-alias-label-primary, #f2f1f6); font: inherit; font-size: 12.5px;
      }
      .dsh-sa-select { appearance: auto; }
      .dsh-sa-input::placeholder { color: var(--dsw-alias-state-idle-primary, #777483); }
      .dsh-sa-hint { font-size: 11px; line-height: 1.45; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-note {
        display: flex; align-items: flex-start; gap: 7px; padding: 9px 11px; border-radius: 9px;
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035));
        color: var(--dsw-alias-label-secondary, #9b99a8); font-size: 11.5px; line-height: 1.5;
      }
      .dsh-sa-note svg { flex: 0 0 auto; margin-top: 1px; }
      .dsh-sa-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .dsh-sa-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px;
        padding: 0 13px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.14));
        background: transparent; color: var(--dsw-alias-label-primary, #f2f1f6); font: inherit;
        font-size: 12.5px; font-weight: 550; line-height: 1; cursor: pointer; white-space: nowrap;
      }
      .dsh-sa-btn:hover { background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.07)); }
      .dsh-sa-btn[disabled] { opacity: .45; cursor: not-allowed; }
      .dsh-sa-btn.is-primary {
        border-color: transparent; color: #fff;
        background: linear-gradient(135deg, var(--dsw-alias-brand-primary, #5d7dff), color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 58%, #ff78bd));
        box-shadow: 0 4px 14px color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 24%, transparent);
      }
      .dsh-sa-btn.is-primary:hover { filter: brightness(1.06); }
      .dsh-sa-btn.is-ghost { border-color: transparent; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-btn.is-danger { color: var(--dsw-alias-state-error-primary, #ff6b6b); }
      .dsh-sa-status {
        display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 13px;
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1));
      }
      .dsh-sa-statushead { display: flex; align-items: center; gap: 11px; min-width: 0; }
      .dsh-sa-spinner {
        width: 22px; height: 22px; flex: 0 0 22px; border-radius: 50%;
        border: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 25%, transparent);
        border-top-color: var(--dsw-alias-brand-primary, #5d7dff); animation: dsh-sa-spin .8s linear infinite;
      }
      @keyframes dsh-sa-spin { to { transform: rotate(360deg); } }
      .dsh-sa-statustitle { font-size: 13px; font-weight: 600; }
      .dsh-sa-statusmsg { margin-top: 2px; font-size: 11.5px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-progress { height: 6px; overflow: hidden; border-radius: 99px; background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.08)); }
      .dsh-sa-progress > span {
        display: block; height: 100%; border-radius: inherit; background: var(--dsw-alias-brand-primary, #5d7dff);
        transition: width .35s ease; box-shadow: 0 0 12px color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 50%, transparent);
      }
      .dsh-sa-media { display: flex; flex-direction: column; gap: 5px; }
      .dsh-sa-media-track {
        position: relative; height: 42px; overflow: hidden; border-radius: 8px;
        background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.06));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.08));
      }
      .dsh-sa-media-grid { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,.07); }
      .dsh-sa-media-chunk {
        position: absolute; top: 0; bottom: 0; pointer-events: none;
        background: color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 9%, transparent);
        border-left: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 55%, transparent);
        border-right: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 55%, transparent);
      }
      .dsh-sa-media-seg { position: absolute; height: 5px; border-radius: 2px; min-width: 2px; opacity: .8; transition: left .3s ease, width .3s ease; }
      .dsh-sa-media-cursor {
        position: absolute; top: 0; bottom: 0; width: 2px; border-radius: 2px;
        background: var(--dsw-alias-brand-primary, #5d7dff);
        box-shadow: 0 0 10px color-mix(in srgb, var(--dsw-alias-brand-primary, #5d7dff) 75%, transparent);
        transition: left .35s linear;
      }
      .dsh-sa-media-meta {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        font-size: 10.5px; color: var(--dsw-alias-label-secondary, #9b99a8); font-variant-numeric: tabular-nums;
      }
      .dsh-sa-media-percent { color: var(--dsw-alias-label-primary, #f2f1f6); font-weight: 600; }
      .dsh-sa-error {
        display: flex; align-items: flex-start; gap: 9px; padding: 11px 12px; border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ff6b6b) 35%, transparent);
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ff6b6b) 9%, transparent);
        color: var(--dsw-alias-label-primary, #f2f1f6); font-size: 12px; line-height: 1.5;
      }
      .dsh-sa-error svg { flex: 0 0 auto; margin-top: 1px; color: var(--dsw-alias-state-error-primary, #ff6b6b); }
      .dsh-sa-resulthead { display: flex; align-items: center; gap: 11px; margin-bottom: 12px; }
      .dsh-sa-resulticon {
        width: 34px; height: 34px; flex: 0 0 34px; display: flex; align-items: center; justify-content: center;
        border-radius: 10px; color: var(--dsw-alias-state-success-primary, #48d597);
        background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #48d597) 13%, transparent);
      }
      .dsh-sa-resulttitle { font-size: 14px; font-weight: 650; }
      .dsh-sa-resultsub { margin-top: 2px; font-size: 11.5px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
      .dsh-sa-stat { padding: 10px 12px; border-radius: 10px; background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035)); }
      .dsh-sa-statvalue { font-size: 17px; font-weight: 650; letter-spacing: -.02em; }
      .dsh-sa-statlabel { margin-top: 3px; font-size: 10.5px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-pathrow {
        display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 9px;
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035)); margin-bottom: 14px;
      }
      .dsh-sa-path { flex: 1; min-width: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary, #9b99a8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-sa-timeline-wrap { margin-top: 4px; margin-bottom: 14px; }
      .dsh-sa-timeline {
        position: relative; height: 52px; border-radius: 9px; overflow: hidden;
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1));
      }
      .dsh-sa-timeline-grid { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--dsw-alias-border-l1, rgba(255,255,255,.1)); }
      .dsh-sa-timeline-seg { position: absolute; height: 7px; border-radius: 3px; opacity: .82; min-width: 2px; }
      .dsh-sa-timeline-ticks { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-speakers { display: flex; flex-direction: column; gap: 7px; }
      .dsh-sa-speaker {
        display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 9px;
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.035));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.08));
      }
      .dsh-sa-dot { width: 10px; height: 10px; flex: 0 0 10px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.08); }
      .dsh-sa-speakerinput {
        flex: 1; min-width: 0; height: 28px; padding: 0 8px; border-radius: 6px; font: inherit; font-size: 12px;
        border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-primary, #f2f1f6);
      }
      .dsh-sa-speakerinput:hover { border-color: var(--dsw-alias-border-l1, rgba(255,255,255,.12)); }
      .dsh-sa-speakerinput:focus { border-color: var(--dsw-alias-brand-primary, #5d7dff); outline: none; background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.06)); }
      .dsh-sa-speakerstat { flex: 0 0 auto; font-size: 10.5px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      .dsh-sa-seglist {
        max-height: 190px; overflow: auto; border-radius: 9px; margin-top: 3px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1));
        background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,.028));
      }
      .dsh-sa-segrow { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.06)); }
      .dsh-sa-segrow:last-child { border-bottom: none; }
      .dsh-sa-segtime { width: 114px; flex: 0 0 114px; font-size: 10.5px; color: var(--dsw-alias-label-secondary, #9b99a8); font-variant-numeric: tabular-nums; }
      .dsh-sa-seglabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; }
      .dsh-sa-segdur { flex: 0 0 auto; font-size: 10.5px; color: var(--dsw-alias-label-secondary, #9b99a8); font-variant-numeric: tabular-nums; }
      .dsh-sa-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1)); }
      .dsh-sa-footernote { font-size: 11px; color: var(--dsw-alias-label-secondary, #9b99a8); }
      @media (max-width: 620px) {
        .dsh-sa-backdrop { padding: 0; align-items: flex-end; }
        .dsh-sa-panel { max-height: 94vh; border-radius: 16px 16px 0 0; }
        .dsh-sa-grid { grid-template-columns: 1fr; }
        .dsh-sa-stats { grid-template-columns: 1fr 1fr 1fr; }
        .dsh-sa-launcher span { display: none; }
        .dsh-sa-launcher { width: 28px; padding: 0; }
      }
    `

    const store = {
      open: false,
      job: null,
      sessionId: '',
      listeners: new Set(),
    }

    function emit() {
      for (const listener of store.listeners) listener()
    }

    function setOpen(open) {
      if (store.open === open) return
      store.open = open
      emit()
    }

    function openStudio(sessionId) {
      store.sessionId = sessionId || ''
      store.open = true
      emit()
    }

    function setJob(job) {
      const previous = store.job
      const receivedAt =
        previous && job && previous.id === job.id && previous.updatedAt === job.updatedAt
          ? previous.receivedAt || Date.now()
          : Date.now()
      store.job = job ? { ...job, receivedAt } : null
      emit()
    }

    function useStore() {
      const [, force] = useState(0)
      useEffect(() => {
        const listener = () => force((value) => value + 1)
        store.listeners.add(listener)
        return () => store.listeners.delete(listener)
      }, [])
      return store
    }

    function useT(ctx) {
      const [, force] = useState(0)
      useEffect(() => ctx.locale.subscribe(() => force((value) => value + 1)), [ctx])
      const bound = ctx.locale.bind(NS)
      return (key, vars) => {
        let value = bound(key)
        if (value === key) {
          value = DICTS.zh[key] || DICTS.en[key] || key
        }
        if (vars) {
          value = String(value).replace(/\{(\w+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
          )
        }
        return value
      }
    }

    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
      if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    function formatDuration(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
      const total = Math.round(seconds)
      const h = Math.floor(total / 3600)
      const m = Math.floor(total / 60) % 60
      const s = total % 60
      return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
    }

    function formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00.0'
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}:${s.toFixed(1).padStart(4, '0')}`
    }

    function formatProgressTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
      const total = Math.floor(seconds)
      const h = Math.floor(total / 3600)
      const m = Math.floor(total / 60) % 60
      const s = total % 60
      return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`
    }

    function IconWave({ size = 18 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M4 12h1.6M9 7.5v9M14 4.8v14.4M19 9v6', stroke: 'currentColor', strokeWidth: 2.1, strokeLinecap: 'round' }),
      )
    }

    function IconUpload({ size = 20 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M12 16V4m0 0 4 4m-4-4L8 8', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M4.5 15.5v2A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-2', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' }),
      )
    }

    function IconClose({ size = 17 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm6 6 12 12M18 6 6 18', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
      )
    }

    function IconDownload({ size = 15 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M12 4v11m0 0 4-4m-4 4-4-4', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M5 19h14', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
      )
    }

    function IconCopy({ size = 14 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 8, y: 8, width: 11, height: 11, rx: 2, stroke: 'currentColor', strokeWidth: 1.8 }),
        h('path', { d: 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
      )
    }

    function IconCheck({ size = 20 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm5 12.5 4.2 4.2L19 7', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      )
    }

    function IconAlert({ size = 16 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M12 8v5', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
        h('circle', { cx: 12, cy: 16.7, r: 1.1, fill: 'currentColor' }),
        h('path', { d: 'M10.3 4.2 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z', stroke: 'currentColor', strokeWidth: 1.7, strokeLinejoin: 'round' }),
      )
    }

    function IconSpark({ size = 14 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M12 3.5c.4 3.8 2.2 5.6 6 6-3.8.4-5.6 2.2-6 6-.4-3.8-2.2-5.6-6-6 3.8-.4 5.6-2.2 6-6Z', stroke: 'currentColor', strokeWidth: 1.7, strokeLinejoin: 'round' }),
        h('path', { d: 'M19 16.5c.2 1.7 1 2.5 2.7 2.7-1.7.2-2.5 1-2.7 2.7-.2-1.7-1-2.5-2.7-2.7 1.7-.2 2.5-1 2.7-2.7Z', fill: 'currentColor' }),
      )
    }

    function Field({ label, hint, wide, children }) {
      return h(
        'div',
        { className: `dsh-sa-field${wide ? ' is-wide' : ''}` },
        h('span', { className: 'dsh-sa-label' }, label),
        children,
        hint ? h('span', { className: 'dsh-sa-hint' }, hint) : null,
      )
    }

    function SettingsGrid({ t, options, setOptions, styleOnly = false }) {
      const update = (key, value) => setOptions((current) => ({ ...current, [key]: value }))
      const fields = []
      if (!styleOnly) {
        fields.push(
          h(
            Field,
            { key: 'speaker-count', label: t('speakerCount') },
            h(
              'select',
              {
                className: 'dsh-sa-select',
                value: String(options.speakerCount),
                onChange: (event) => update('speakerCount', Number(event.target.value)),
              },
              h('option', { value: '0' }, t('auto')),
              Array.from({ length: 8 }, (_, index) =>
                h('option', { key: index + 1, value: String(index + 1) }, t('people', { n: index + 1 })),
              ),
            ),
          ),
        )
      }
      fields.push(
        h(
          Field,
          { key: 'style', label: t('style') },
          h(
            'select',
            {
              className: 'dsh-sa-select',
              value: options.stylePreset,
              onChange: (event) => update('stylePreset', event.target.value),
            },
            h('option', { value: 'neon' }, t('styleNeon')),
            h('option', { value: 'candy' }, t('styleCandy')),
            h('option', { value: 'broadcast' }, t('styleBroadcast')),
            h('option', { value: 'mono' }, t('styleMono')),
          ),
        ),
        h(
          Field,
          { key: 'position', label: t('position') },
          h(
            'select',
            {
              className: 'dsh-sa-select',
              value: options.position,
              onChange: (event) => update('position', event.target.value),
            },
            h('option', { value: 'bottom' }, t('bottom')),
            h('option', { value: 'top' }, t('top')),
            h('option', { value: 'alternate' }, t('alternate')),
          ),
        ),
      )
      if (!styleOnly) {
        fields.push(
          h(
            Field,
            { key: 'max-line', label: t('maxLine') },
            h(
              'select',
              {
                className: 'dsh-sa-select',
                value: String(options.maxSegmentSeconds),
                onChange: (event) => update('maxSegmentSeconds', Number(event.target.value)),
              },
              h('option', { value: '0' }, t('noSplit')),
              h('option', { value: '6' }, t('seconds', { n: 6 })),
              h('option', { value: '8' }, t('seconds', { n: 8 })),
              h('option', { value: '10' }, t('seconds', { n: 10 })),
              h('option', { value: '15' }, t('seconds', { n: 15 })),
            ),
          ),
        )
      }
      fields.push(
        h(
          Field,
          { key: 'placeholder', label: t('placeholder'), hint: t('placeholderHint'), wide: true },
          h('input', {
            className: 'dsh-sa-input',
            value: options.placeholder,
            maxLength: 80,
            placeholder: '{name}',
            onChange: (event) => update('placeholder', event.target.value),
          }),
        ),
      )
      return h('div', { className: 'dsh-sa-grid' }, fields)
    }

    function DropZone({ t, file, onFile, busy }) {
      const [dragging, setDragging] = useState(false)
      const inputRef = useRef(null)
      const choose = (selected) => {
        if (selected) onFile(selected)
      }
      return h(
        'div',
        { className: 'dsh-sa-section' },
        h(
          'div',
          {
            className: `dsh-sa-drop${dragging ? ' is-drag' : ''}`,
            role: 'button',
            tabIndex: 0,
            onClick: () => inputRef.current?.click(),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                inputRef.current?.click()
              }
            },
            onDragOver: (event) => {
              event.preventDefault()
              setDragging(true)
            },
            onDragLeave: () => setDragging(false),
            onDrop: (event) => {
              event.preventDefault()
              setDragging(false)
              choose(event.dataTransfer?.files?.[0])
            },
          },
          h('input', {
            ref: inputRef,
            type: 'file',
            accept: 'video/*,audio/*,.mkv,.flac,.m4a,.aac,.wav,.mp3,.ogg,.opus,.webm',
            style: { display: 'none' },
            onChange: (event) => {
              choose(event.target.files?.[0])
              event.target.value = ''
            },
          }),
          h('div', { className: 'dsh-sa-dropicon' }, h(IconUpload)),
          h('div', { className: 'dsh-sa-droptitle' }, t('dropTitle')),
          h('div', { className: 'dsh-sa-drophint' }, t('dropHint')),
          file
            ? h(
                'div',
                { className: 'dsh-sa-filecard', style: { width: 'min(100%, 420px)', marginTop: 4, textAlign: 'left' } },
                h('div', { className: 'dsh-sa-fileicon' }, h(IconWave, { size: 16 })),
                h(
                  'div',
                  { style: { minWidth: 0, flex: 1 } },
                  h('div', { className: 'dsh-sa-filename' }, file.name),
                  h('div', { className: 'dsh-sa-filemeta' }, formatBytes(file.size)),
                ),
                h(
                  'span',
                  { className: 'dsh-sa-hint', style: { flex: '0 0 auto' } },
                  busy ? t('uploading') : t('replace'),
                ),
              )
            : null,
        ),
      )
    }

    function Timeline({ t, job }) {
      const duration = Math.max(0.1, Number(job.duration) || job.segments[job.segments.length - 1]?.end || 1)
      const maxDisplay = 1200
      const segments = job.segments.slice(0, maxDisplay)
      const lanes = Math.min(4, Math.max(1, job.speakers.length))
      return h(
        'div',
        { className: 'dsh-sa-timeline-wrap' },
        h(
          'div',
          { className: 'dsh-sa-timeline' },
          Array.from({ length: 9 }, (_, index) =>
            h('span', { key: index, className: 'dsh-sa-timeline-grid', style: { left: `${(index / 8) * 100}%` } }),
          ),
          segments.map((segment, index) => {
            const speaker = job.speakers[segment.speaker]
            const left = Math.max(0, Math.min(100, (segment.start / duration) * 100))
            const width = Math.max(0.12, Math.min(100 - left, ((segment.end - segment.start) / duration) * 100))
            return h('span', {
              key: index,
              className: 'dsh-sa-timeline-seg',
              title: `${speaker?.label || ''} ${formatTime(segment.start)} → ${formatTime(segment.end)}`,
              style: {
                left: `${left}%`,
                width: `${width}%`,
                top: `${6 + (segment.speaker % lanes) * 10}px`,
                background: speaker?.color || '#8c8c8c',
              },
            })
          }),
        ),
        h(
          'div',
          { className: 'dsh-sa-timeline-ticks' },
          h('span', null, '0:00'),
          h('span', null, formatTime(duration / 2)),
          h('span', null, formatTime(duration)),
        ),
      )
    }

    function ResultPanel({ t, job, options, setOptions, labels, setLabels, onRegenerate, rendering, error, onNewTask, onCopy, copied }) {
      const downloadUrl = `/api/speaker-axis/jobs/${job.id}/ass`
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dsh-sa-resulthead' },
          h('div', { className: 'dsh-sa-resulticon' }, h(IconCheck, { size: 18 })),
          h(
            'div',
            { style: { minWidth: 0, flex: 1 } },
            h('div', { className: 'dsh-sa-resulttitle' }, t('resultTitle')),
            h('div', { className: 'dsh-sa-resultsub' }, t('resultSubtitle', { name: job.filename })),
          ),
          h(
            'a',
            { className: 'dsh-sa-btn is-primary', href: downloadUrl, style: { textDecoration: 'none' } },
            h(IconDownload),
            t('download'),
          ),
        ),
        h(
          'div',
          { className: 'dsh-sa-stats' },
          h('div', { className: 'dsh-sa-stat' }, h('div', { className: 'dsh-sa-statvalue' }, String(job.speakers.length)), h('div', { className: 'dsh-sa-statlabel' }, t('summarySpeakers'))),
          h('div', { className: 'dsh-sa-stat' }, h('div', { className: 'dsh-sa-statvalue' }, String(job.segments.length)), h('div', { className: 'dsh-sa-statlabel' }, t('summarySegments'))),
          h('div', { className: 'dsh-sa-stat' }, h('div', { className: 'dsh-sa-statvalue' }, formatDuration(job.duration)), h('div', { className: 'dsh-sa-statlabel' }, t('summaryDuration'))),
        ),
        h(
          'div',
          { className: 'dsh-sa-pathrow' },
          h('span', { className: 'dsh-sa-path', title: job.outputPath }, job.outputPath),
          h(
            'button',
            { type: 'button', className: 'dsh-sa-btn is-ghost', style: { height: 28, padding: '0 8px', fontSize: 11 }, onClick: onCopy },
            h(IconCopy),
            copied ? t('copied') : t('copyPath'),
          ),
        ),
        h('div', { className: 'dsh-sa-section' }, h('div', { className: 'dsh-sa-label', style: { marginBottom: 7 } }, t('timeline')), h(Timeline, { t, job })),
        error ? h('div', { className: 'dsh-sa-error', style: { marginBottom: 12 } }, h(IconAlert), h('div', null, error)) : null,
        h(
          'div',
          { className: 'dsh-sa-section' },
          h('div', { className: 'dsh-sa-label', style: { marginBottom: 7 } }, t('speakerLabels')),
          h(
            'div',
            { className: 'dsh-sa-speakers' },
            job.speakers.map((speaker, index) =>
              h(
                'div',
                { className: 'dsh-sa-speaker', key: speaker.index },
                h('span', { className: 'dsh-sa-dot', style: { background: speaker.color } }),
                h(
                  'input',
                  {
                    className: 'dsh-sa-speakerinput',
                    'aria-label': t('speakerDefault', { n: index + 1 }),
                    value: labels[index] ?? speaker.label,
                    maxLength: 40,
                    placeholder: t('labelPlaceholder'),
                    onChange: (event) => {
                      const next = [...labels]
                      next[index] = event.target.value
                      setLabels(next)
                    },
                  },
                ),
                h('span', { className: 'dsh-sa-speakerstat' }, t('speakerStats', { n: speaker.segments, time: formatDuration(speaker.talkTime) })),
              ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsh-sa-section' },
          h('div', { className: 'dsh-sa-label', style: { marginBottom: 7 } }, t('styleSettings')),
          h(SettingsGrid, { t, options, setOptions, styleOnly: true }),
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, flexWrap: 'wrap' } },
            h('span', { className: 'dsh-sa-hint' }, t('resultHint')),
            h(
              'button',
              { type: 'button', className: 'dsh-sa-btn', disabled: rendering, onClick: onRegenerate },
              h(IconSpark),
              rendering ? t('regenerating') : t('regenerate'),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsh-sa-section' },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 7 } },
            h('div', { className: 'dsh-sa-label' }, t('segmentList')),
            h('div', { className: 'dsh-sa-hint' }, t('segmentPreview', { shown: Math.min(150, job.segments.length), total: job.segments.length })),
          ),
          h(
            'div',
            { className: 'dsh-sa-seglist' },
            job.segments.slice(0, 150).map((segment, index) => {
              const speaker = job.speakers[segment.speaker]
              return h(
                'div',
                { className: 'dsh-sa-segrow', key: index },
                h('span', { className: 'dsh-sa-dot', style: { width: 7, height: 7, flexBasis: 7, background: speaker?.color || '#888' } }),
                h('span', { className: 'dsh-sa-segtime' }, t('segmentRange', { start: formatTime(segment.start), end: formatTime(segment.end) })),
                h('span', { className: 'dsh-sa-seglabel' }, labels[segment.speaker] || speaker?.label || ''),
                h('span', { className: 'dsh-sa-segdur' }, `${(segment.end - segment.start).toFixed(1)}s`),
              )
            }),
          ),
        ),
        h(
          'div',
          { className: 'dsh-sa-footer' },
          h('span', { className: 'dsh-sa-footernote' }, t('noTranscribe')),
          h('button', { type: 'button', className: 'dsh-sa-btn is-ghost', onClick: onNewTask }, t('newTask')),
        ),
      )
    }

    function MediaProgress({ t, job, progress }) {
      const duration = Math.max(0.1, Number(job?.duration) || 0)
      const current = Math.max(0, Math.min(duration, Number(job?.currentTime) || 0))
      const segments = Array.isArray(job?.previewSegments) ? job.previewSegments : []
      const palette = PREVIEW_PALETTES[job?.options?.stylePreset] || PREVIEW_PALETTES.neon
      const cursorLeft = Math.max(0, Math.min(100, (current / duration) * 100))
      const chunkStart = Math.max(0, Math.min(duration, Number(job?.chunkStart) || 0))
      const chunkEnd = Math.max(chunkStart, Math.min(duration, Number(job?.chunkEnd) || 0))
      const chunkLeft = Math.max(0, Math.min(100, (chunkStart / duration) * 100))
      const chunkWidth = Math.max(0, Math.min(100 - chunkLeft, ((chunkEnd - chunkStart) / duration) * 100))
      const etaSeconds = Math.max(0, Number(job?.etaSeconds) || 0)
      const etaAge = job?.receivedAt ? Math.max(0, (Date.now() - job.receivedAt) / 1000) : 0
      const etaRemaining = Math.max(0, Math.ceil(etaSeconds - etaAge))
      const rightMeta = etaRemaining > 0
        ? `${t('etaRemaining', { time: formatProgressTime(etaRemaining) })} · ${Math.round(progress)}%`
        : `${Math.round(progress)}%`
      return h(
        'div',
        { className: 'dsh-sa-media' },
        h(
          'div',
          { className: 'dsh-sa-media-track' },
          [0, 25, 50, 75].map((percent) =>
            h('span', { key: percent, className: 'dsh-sa-media-grid', style: { left: `${percent}%` } }),
          ),
          chunkWidth > 0
            ? h('span', { className: 'dsh-sa-media-chunk', style: { left: `${chunkLeft}%`, width: `${chunkWidth}%` } })
            : null,
          segments.slice(0, 1200).map((segment, index) => {
            const left = Math.max(0, Math.min(100, (segment.start / duration) * 100))
            const width = Math.max(0.12, Math.min(100 - left, ((segment.end - segment.start) / duration) * 100))
            return h('span', {
              key: index,
              className: 'dsh-sa-media-seg',
              title: `${formatTime(segment.start)} → ${formatTime(segment.end)}`,
              style: {
                left: `${left}%`,
                width: `${width}%`,
                top: `${8 + (segment.speaker % 5) * 5}px`,
                background: palette[segment.speaker % palette.length],
              },
            })
          }),
          h('span', { className: 'dsh-sa-media-cursor', style: { left: `${cursorLeft}%` } }),
        ),
        h(
          'div',
          { className: 'dsh-sa-media-meta' },
          h('span', null, t('mediaProgress', { current: formatProgressTime(current), total: formatProgressTime(duration) })),
          h('span', { className: 'dsh-sa-media-percent' }, rightMeta),
        ),
      )
    }

    function StatusPanel({ t, job, uploadPct, busy }) {
      const isUpload = busy && !job
      const progress = isUpload ? Math.round(uploadPct * 0.3) : Math.max(2, Number(job?.progress) || 0)
      const title = isUpload ? `${t('uploading')} ${uploadPct}%` : t('processing')
      const message = isUpload ? t('uploading') : job?.message || t('analyzing')
      return h(
        'div',
        { className: 'dsh-sa-status', role: 'status', 'aria-live': 'polite' },
        h(
          'div',
          { className: 'dsh-sa-statushead' },
          h('span', { className: 'dsh-sa-spinner' }),
          h(
            'div',
            { style: { minWidth: 0, flex: 1 } },
            h('div', { className: 'dsh-sa-statustitle' }, title),
            h('div', { className: 'dsh-sa-statusmsg' }, job?.filename ? `${job.filename} · ${message}` : message),
          ),
        ),
        h('div', { className: 'dsh-sa-progress' }, h('span', { style: { width: `${Math.min(100, progress)}%` } })),
        job && job.duration > 0 ? h(MediaProgress, { t, job, progress }) : null,
        h('div', { className: 'dsh-sa-hint' }, t('processingHint')),
      )
    }

    function StudioModal({ t }) {
      const s = useStore()
      const [file, setFile] = useState(null)
      const [options, setOptions] = useState({ ...DEFAULT_OPTIONS })
      const [labels, setLabels] = useState([])
      const [busy, setBusy] = useState(false)
      const [uploadPct, setUploadPct] = useState(0)
      const [rendering, setRendering] = useState(false)
      const [error, setError] = useState('')
      const [copied, setCopied] = useState(false)
      const [health, setHealth] = useState(null)
      const dialogRef = useRef(null)
      const aliveRef = useRef(true)
      const syncedJobRef = useRef('')

      const job = s.job

      useEffect(() => {
        aliveRef.current = true
        return () => {
          aliveRef.current = false
        }
      }, [])

      useEffect(() => {
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialogRef.current?.focus()
        const onKey = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => {
          document.body.style.overflow = previous
          window.removeEventListener('keydown', onKey)
        }
      }, [])

      useEffect(() => {
        let alive = true
        fetch('/api/speaker-axis/health')
          .then((response) => response.json())
          .then((data) => {
            if (alive) setHealth(data)
          })
          .catch(() => {})
        return () => {
          alive = false
        }
      }, [])

      useEffect(() => {
        if (!job) return
        const key = `${job.id}:${job.status}:${job.updatedAt}`
        if (syncedJobRef.current === key) return
        if (job.status === 'done' && job.options) {
          const next = {
            speakerCount: job.options.speakerCount ?? 0,
            stylePreset: job.options.stylePreset || 'neon',
            position: job.options.position || 'bottom',
            maxSegmentSeconds: job.options.maxSegmentSeconds ?? 8,
            placeholder: job.options.placeholder ?? '{name}',
          }
          setOptions(next)
          setLabels(job.speakers.map((speaker) => speaker.label))
          syncedJobRef.current = key
        } else if (job.status === 'error' || job.status === 'canceled') {
          setError(job.error || '')
          syncedJobRef.current = key
        }
      }, [job, job?.id, job?.status, job?.updatedAt])

      useEffect(() => {
        if (!job || job.status === 'done' || job.status === 'error' || job.status === 'canceled') return
        let stopped = false
        let timer = null
        const tick = async () => {
          try {
            const response = await fetch(`/api/speaker-axis/jobs/${job.id}`)
            const data = await response.json()
            if (!stopped && data.job) setJob(data.job)
          } catch {
            // The next poll retries; transient network errors are not fatal.
          }
          if (!stopped) timer = window.setTimeout(tick, 1200)
        }
        timer = window.setTimeout(tick, 900)
        return () => {
          stopped = true
          if (timer) window.clearTimeout(timer)
        }
      }, [job?.id, job?.status])

      const start = () => {
        if (!file) {
          setError(t('noFile'))
          return
        }
        setBusy(true)
        setUploadPct(0)
        setError('')
        setCopied(false)
        setJob(null)
        const xhr = new XMLHttpRequest()
        const sessionId = s.sessionId ? `&sessionId=${encodeURIComponent(s.sessionId)}` : ''
        const url = `/api/speaker-axis/jobs?filename=${encodeURIComponent(file.name)}${sessionId}`
        xhr.open('POST', url, true)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.setRequestHeader('X-Speaker-Axis-Options', encodeURIComponent(JSON.stringify(options)))
        xhr.setRequestHeader('Accept', 'application/json')
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && aliveRef.current) {
            setUploadPct(Math.max(1, Math.round((event.loaded / event.total) * 100)))
          }
        }
        xhr.onload = () => {
          let data = null
          try {
            data = JSON.parse(xhr.responseText || '{}')
          } catch {
            data = null
          }
          if (xhr.status >= 200 && xhr.status < 300 && data?.job) {
            setJob(data.job)
            if (!aliveRef.current) return
            setBusy(false)
          } else {
            if (!aliveRef.current) return
            setBusy(false)
            setError(data?.error || `${t('uploadFailed')}（HTTP ${xhr.status}）`)
          }
        }
        xhr.onerror = () => {
          if (!aliveRef.current) return
          setBusy(false)
          setError(t('uploadFailed'))
        }
        xhr.onabort = () => {
          if (!aliveRef.current) return
          setBusy(false)
        }
        xhr.send(file)
      }

      const regenerate = async () => {
        if (!job) return
        setRendering(true)
        setError('')
        try {
          const response = await fetch(`/api/speaker-axis/jobs/${job.id}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...options, labels }),
          })
          const data = await response.json()
          if (!response.ok || !data.ok) throw new Error(data?.error || t('unknownError'))
          setJob(data.job)
          setLabels(data.job.speakers.map((speaker) => speaker.label))
        } catch (reason) {
          setError(String(reason?.message || reason))
        } finally {
          setRendering(false)
        }
      }

      const copyPath = async () => {
        if (!job?.outputPath) return
        try {
          await navigator.clipboard.writeText(job.outputPath)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        } catch {
          setError(t('copyFailed'))
        }
      }

      const newTask = () => {
        setJob(null)
        setFile(null)
        setLabels([])
        setOptions({ ...DEFAULT_OPTIONS })
        setError('')
        setCopied(false)
        syncedJobRef.current = ''
      }

      const isDone = job?.status === 'done'
      const isRunning = job && (job.status === 'processing' || job.status === 'queued')

      return h(
        'div',
        {
          className: 'dsh-sa-backdrop',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) setOpen(false)
          },
        },
        h(
          'section',
          {
            ref: dialogRef,
            className: 'dsh-sa-panel',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'dsh-sa-title',
            tabIndex: -1,
            onMouseDown: (event) => event.stopPropagation(),
          },
          h(
            'header',
            { className: 'dsh-sa-head' },
            h('div', { className: 'dsh-sa-mark' }, h(IconWave, { size: 21 })),
            h(
              'div',
              { className: 'dsh-sa-headtext' },
              h('h2', { className: 'dsh-sa-title', id: 'dsh-sa-title' }, t('title')),
              h('p', { className: 'dsh-sa-subtitle' }, t('subtitle')),
            ),
            h(
              'button',
              { type: 'button', className: 'dsh-sa-iconbtn', 'aria-label': t('close'), title: t('close'), onClick: () => setOpen(false) },
              h(IconClose),
            ),
          ),
          h(
            'div',
            { className: 'dsh-sa-body' },
            error && !isDone ? h('div', { className: 'dsh-sa-error', style: { marginBottom: 12 } }, h(IconAlert), h('div', null, error)) : null,
            isRunning || busy
              ? h(StatusPanel, { t, job, uploadPct, busy })
              : isDone
                ? h(ResultPanel, {
                    t,
                    job,
                    options,
                    setOptions,
                    labels,
                    setLabels,
                    onRegenerate: regenerate,
                    rendering,
                    error,
                    onNewTask: newTask,
                    onCopy: copyPath,
                    copied,
                  })
                : h(
                    React.Fragment,
                    null,
                    h(DropZone, { t, file, onFile: setFile, busy }),
                    h(
                      'div',
                      { className: 'dsh-sa-section' },
                      h('div', { className: 'dsh-sa-label', style: { marginBottom: 8 } }, t('settingsTitle')),
                      h(SettingsGrid, { t, options, setOptions }),
                    ),
                    h(
                      'div',
                      { className: 'dsh-sa-note', style: { marginTop: 2 } },
                      h(IconSpark),
                      h('span', null, health ? (health.modelsReady ? t('modelReady') : t('modelMissing')) : t('modelNote')),
                    ),
                    h(
                      'div',
                      { className: 'dsh-sa-actions' },
                      h('span', { className: 'dsh-sa-footernote', style: { marginRight: 'auto' } }, t('noTranscribe')),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-sa-btn is-primary',
                          disabled: busy || !file,
                          onClick: start,
                        },
                        h(IconWave),
                        t('start'),
                      ),
                    ),
                  ),
            job?.status === 'error' || job?.status === 'canceled'
              ? h(
                  'div',
                  { className: 'dsh-sa-actions' },
                  h('button', { type: 'button', className: 'dsh-sa-btn is-ghost', onClick: newTask }, t('newTask')),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-sa-btn',
                      onClick: () => {
                        if (!file) {
                          setError(t('noFile'))
                          return
                        }
                        setJob(null)
                        setError('')
                        start()
                      },
                    },
                    t('retry'),
                  ),
                )
              : null,
          ),
        ),
      )
    }

    function StudioLauncher({ t, sessionId }) {
      return h(
        React.Fragment,
        null,
        h('style', { className: 'dsh-sa-style-anchor' }, CSS),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-sa-launcher',
            title: t('title'),
            'aria-label': t('title'),
            onClick: () => openStudio(sessionId),
          },
          h(IconWave, { size: 15 }),
          h('span', null, t('button')),
        ),
      )
    }

    function StudioOverlay({ t }) {
      const s = useStore()
      if (!s.open) return null
      return h(
        React.Fragment,
        null,
        h('style', { className: 'dsh-sa-style-anchor' }, CSS),
        h(StudioModal, { t }),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTS))
        function LauncherSlot(props) {
          const t = useT(ctx)
          return h(StudioLauncher, { t, sessionId: props?.sessionId })
        }
        function OverlaySlot() {
          const t = useT(ctx)
          return h(StudioOverlay, { t })
        }
        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.left',
              id: 'speaker-axis',
              order: 35,
              label: () => ctx.locale.bind(NS)('button'),
            },
            LauncherSlot,
          ),
        )
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'speaker-axis-modal',
              order: 80,
            },
            OverlaySlot,
          ),
        )
      },
    }
  },
})
