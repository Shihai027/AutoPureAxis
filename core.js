/**
 * Portable core entry point.
 *
 * These exports do not depend on Cordis, the Harness Web UI, or the DSH
 * profile. A CLI, another desktop shell, a test harness, or an editor bridge
 * can import this module directly.
 */
export {
  STYLE_PRESETS,
  buildSpeakers,
  ensureModels,
  extractAudio,
  fileExists,
  findRuntimeNode,
  formatBytes,
  formatClock,
  formatMediaClock,
  mergeAndSplitSegments,
  probeDuration,
  renderAss,
  runDiarization,
  sanitizeOptions,
} from './index.js'
