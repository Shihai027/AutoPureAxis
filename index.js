import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const PLUGIN_ROOT = path.dirname(fileURLToPath(import.meta.url))
const DIARIZE_RUNNER = path.join(PLUGIN_ROOT, 'diarize.cjs')
const PLUGIN_VERSION = '1.0.0'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const DATA_ROOT = process.env.SPEAKER_AXIS_DATA_DIR
  ? path.resolve(process.env.SPEAKER_AXIS_DATA_DIR)
  : path.join(DSH_HOME, 'speaker-axis')
const JOB_ROOT = path.join(DATA_ROOT, 'jobs')
const MODEL_ROOT = path.join(DATA_ROOT, 'models')
const SEGMENTATION_URL =
  'https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-segmentation-models/sherpa-onnx-pyannote-segmentation-3-0.tar.bz2'
const SEGMENTATION_DIR = path.join(MODEL_ROOT, 'sherpa-onnx-pyannote-segmentation-3-0')
const SEGMENTATION_MODEL = path.join(SEGMENTATION_DIR, 'model.onnx')
const EMBEDDING_URL =
  'https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx'
const EMBEDDING_MODEL = path.join(MODEL_ROOT, 'campplus_zh_en.onnx')

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe'
const MAX_UPLOAD_BYTES = Number(process.env.SPEAKER_AXIS_MAX_UPLOAD_BYTES || 4 * 1024 * 1024 * 1024)
const MAX_MEDIA_SECONDS = Number(process.env.SPEAKER_AXIS_MAX_SECONDS || 5 * 60 * 60)
let nodeExecutablePromise = null

const STYLE_PRESETS = {
  neon: {
    name: 'neon',
    palette: ['#4DE8FF', '#FF76BD', '#FFD166', '#8CFF7A', '#C79BFF', '#FF9A62', '#6FB6FF', '#F38BFF', '#7EF0D0', '#FFE38A'],
    font: 'Microsoft YaHei',
    size: 58,
    bold: 1,
    outline: 3,
    shadow: 1,
    borderStyle: 1,
    outlineColor: '#111019',
    backColor: '#000000',
  },
  candy: {
    name: 'candy',
    palette: ['#FFD6E7', '#CBEFFF', '#D8F7C8', '#FFECA8', '#E6D8FF', '#FFCFBC', '#C8F4EC', '#F6D7F3', '#DDE3FF', '#FFE0C2'],
    font: 'Microsoft YaHei',
    size: 56,
    bold: 1,
    outline: 4,
    shadow: 0,
    borderStyle: 1,
    outlineColor: '#392E47',
    backColor: '#000000',
  },
  broadcast: {
    name: 'broadcast',
    palette: ['#FFFFFF', '#FFE066', '#93E79A', '#7BC4FF', '#FFADAD', '#CDB6FF', '#FFD3A1', '#B6F0C0', '#D6E4FF', '#FFE9A8'],
    font: 'Microsoft YaHei',
    size: 52,
    bold: 1,
    outline: 2,
    shadow: 0,
    borderStyle: 3,
    outlineColor: '#0B0B0B',
    backColor: '#000000',
    backAlpha: 96,
  },
  mono: {
    name: 'mono',
    palette: ['#FFFFFF', '#D9D9D9', '#BDBDBD', '#A6A6A6', '#8F8F8F', '#F2F2F2', '#C9C9C9', '#E6E6E6', '#B3B3B3', '#F7F7F7'],
    font: 'Microsoft YaHei',
    size: 54,
    bold: 0,
    outline: 3,
    shadow: 1,
    borderStyle: 1,
    outlineColor: '#111111',
    backColor: '#000000',
  },
}

const POSITION_VALUES = new Set(['bottom', 'top', 'alternate'])
const PRESET_VALUES = new Set(Object.keys(STYLE_PRESETS))
const DEFAULT_ASS_FONT =
  process.platform === 'win32' ? 'Microsoft YaHei' : process.platform === 'darwin' ? 'PingFang SC' : 'Noto Sans CJK SC'

let modelSetupPromise = null
let modelProgressListeners = new Set()

function clampNumber(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function sanitizeOptions(input = {}) {
  const stylePreset = PRESET_VALUES.has(input.stylePreset) ? input.stylePreset : 'neon'
  const position = POSITION_VALUES.has(input.position) ? input.position : 'bottom'
  const speakerCount = Math.round(clampNumber(input.speakerCount, 0, 12, 0))
  const maxSegmentSeconds = clampNumber(input.maxSegmentSeconds, 0, 60, 8)
  const clusterThreshold = clampNumber(input.clusterThreshold, 0.1, 0.99, 0.75)
  const placeholder =
    typeof input.placeholder === 'string' && input.placeholder.length <= 80
      ? input.placeholder
      : '{name}'
  const labels = Array.isArray(input.labels)
    ? input.labels.slice(0, 12).map((label) => String(label).slice(0, 40))
    : []
  const fontFamily =
    typeof input.fontFamily === 'string' && input.fontFamily.trim()
      ? input.fontFamily.trim().slice(0, 80)
      : ''
  return { speakerCount, stylePreset, position, maxSegmentSeconds, clusterThreshold, placeholder, labels, fontFamily }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds * 100))
  const cs = total % 100
  const s = Math.floor(total / 100) % 60
  const m = Math.floor(total / 6000) % 60
  const h = Math.floor(total / 360000)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

function formatMediaClock(seconds) {
  const total = Math.max(0, Math.round(seconds))
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function assColor(hex, alpha = 0) {
  const value = String(hex || '#FFFFFF').replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.padEnd(6, 'F').slice(0, 6)
  const rr = normalized.slice(0, 2)
  const gg = normalized.slice(2, 4)
  const bb = normalized.slice(4, 6)
  const aa = Math.round(clampNumber(alpha, 0, 255, 0)).toString(16).padStart(2, '0').toUpperCase()
  return `&H${aa}${bb}${gg}${rr}`.toUpperCase()
}

function sanitizeBaseName(filename) {
  const base = path.basename(String(filename || 'video')).replace(/\.[^.]+$/, '')
  const safe = base
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 72)
  return safe || 'video'
}

function sanitizeStyleName(label, index) {
  return `S${index + 1}`
}

function assEscape(text) {
  return String(text)
    .replace(/\\/g, '／')
    .replace(/\{/g, '（')
    .replace(/\}/g, '）')
    .replace(/\r?\n/g, '\\N')
}

function defaultLabel(index) {
  return `说话人 ${index + 1}`
}

function buildSpeakers(segments, options) {
  const preset = STYLE_PRESETS[options.stylePreset] || STYLE_PRESETS.neon
  const counts = new Map()
  const talk = new Map()
  for (const segment of segments) {
    counts.set(segment.speaker, (counts.get(segment.speaker) || 0) + 1)
    talk.set(segment.speaker, (talk.get(segment.speaker) || 0) + (segment.end - segment.start))
  }
  const total = new Set(segments.map((segment) => segment.speaker)).size
  return Array.from({ length: total }, (_, index) => {
    const supplied = options.labels[index]
    return {
      index,
      label: typeof supplied === 'string' && supplied.trim() ? supplied.trim() : defaultLabel(index),
      styleName: sanitizeStyleName(null, index),
      color: preset.palette[index % preset.palette.length],
      segments: counts.get(index) || 0,
      talkTime: Math.round((talk.get(index) || 0) * 100) / 100,
    }
  })
}

function mergeAndSplitSegments(rawSegments, maxSegmentSeconds, mediaDuration) {
  const sorted = rawSegments
    .map((segment) => ({
      start: Math.max(0, Number(segment.start) || 0),
      end: Math.max(0, Number(segment.end) || 0),
      speaker: Math.max(0, Math.round(Number(segment.speaker) || 0)),
    }))
    .filter((segment) => segment.end - segment.start >= 0.12)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const speakerOrder = new Map()
  const normalized = sorted.map((segment) => {
    if (!speakerOrder.has(segment.speaker)) speakerOrder.set(segment.speaker, speakerOrder.size)
    return {
      start: segment.start,
      end: Math.min(mediaDuration > 0 ? mediaDuration : segment.end, segment.end),
      speaker: speakerOrder.get(segment.speaker),
    }
  })

  const merged = []
  for (const segment of normalized) {
    const previous = merged[merged.length - 1]
    if (previous && previous.speaker === segment.speaker && segment.start - previous.end <= 0.22) {
      previous.end = Math.max(previous.end, segment.end)
    } else {
      merged.push({ ...segment })
    }
  }

  if (!maxSegmentSeconds || maxSegmentSeconds <= 0) return merged

  const split = []
  for (const segment of merged) {
    const duration = segment.end - segment.start
    if (duration <= maxSegmentSeconds + 0.4) {
      split.push(segment)
      continue
    }
    const count = Math.ceil(duration / maxSegmentSeconds)
    const chunk = duration / count
    for (let index = 0; index < count; index += 1) {
      const start = segment.start + chunk * index
      const end = index === count - 1 ? segment.end : segment.start + chunk * (index + 1)
      if (end - start >= 0.12) split.push({ start, end, speaker: segment.speaker })
    }
  }
  return split
}

function renderAss({ segments, speakers, options, title }) {
  const preset = STYLE_PRESETS[options.stylePreset] || STYLE_PRESETS.neon
  const font = options.fontFamily || (preset.font === 'Microsoft YaHei' ? DEFAULT_ASS_FONT : preset.font)
  const alignmentFor = (index) => {
    if (options.position === 'top') return 8
    if (options.position === 'alternate') return index % 2 === 0 ? 2 : 8
    return 2
  }
  const marginVFor = (index, alignment) => {
    if (alignment === 8) return 62
    if (options.position === 'alternate' && index % 2 === 1) return 62
    return 68
  }

  const lines = [
    '[Script Info]',
    `Title: ${assEscape(title || 'Speaker axis')}`,
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    'YCbCr Matrix: TV.709',
    'PlayResX: 1920',
    'PlayResY: 1080',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  ]

  for (const speaker of speakers) {
    const alignment = alignmentFor(speaker.index)
    const marginV = marginVFor(speaker.index, alignment)
    lines.push(
      [
        `Style: ${speaker.styleName}`,
        font,
        preset.size,
        assColor(speaker.color),
        assColor(speaker.color),
        assColor(preset.outlineColor, 0),
        assColor(preset.backColor, preset.backAlpha ?? 128),
        preset.bold,
        0,
        0,
        0,
        100,
        100,
        0,
        0,
        preset.borderStyle,
        preset.outline,
        preset.shadow,
        alignment,
        90,
        90,
        marginV,
        1,
      ].join(','),
    )
  }

  lines.push('', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text')

  for (const segment of segments) {
    const speaker = speakers[segment.speaker]
    if (!speaker) continue
    const start = formatClock(segment.start)
    const end = formatClock(Math.max(segment.start + 0.05, segment.end))
    const text = String(options.placeholder ?? '{name}')
      .replace(/\{name\}/g, speaker.label)
      .replace(/\{index\}/g, speaker.styleName)
      .replace(/\{time\}/g, start.replace(/^0:/, ''))
    lines.push(
      `Dialogue: 0,${start},${end},${speaker.styleName},${assEscape(speaker.label)},0,0,0,,${assEscape(text)}`,
    )
  }

  return `${lines.join('\r\n')}\r\n`
}

async function runCommand(command, args, options = {}) {
  const { signal, timeoutMs = 6 * 60 * 60 * 1000, maxBuffer = 16 * 1024 * 1024, env } = options
  return new Promise((resolve, reject) => {
    let settled = false
    let stdout = ''
    let stderr = ''
    let timer = null
    let child
    const finish = (error, value) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      if (error) reject(error)
      else resolve(value)
    }
    const kill = () => {
      try {
        child?.kill()
      } catch {
        // The child may already have exited.
      }
    }
    const onAbort = () => {
      kill()
      const error = new Error('任务已取消')
      error.code = 'ABORT_ERR'
      finish(error)
    }

    try {
      child = spawn(command, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: env || process.env,
      })
    } catch (error) {
      finish(error)
      return
    }

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
      if (stdout.length > maxBuffer) {
        kill()
        finish(new Error('命令输出超过限制'))
      }
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      if (stderr.length > maxBuffer) stderr = stderr.slice(-maxBuffer)
    })
    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        error.message =
          command === FFMPEG || command === FFPROBE
            ? `找不到 ${command}。请安装 ffmpeg 并确保 ffmpeg 与 ffprobe 在 PATH 中。`
            : `找不到可执行文件：${command}`
      }
      finish(error)
    })
    child.on('close', (code, childSignal) => {
      if (signal?.aborted) return
      if (code === 0) {
        finish(null, { stdout, stderr })
      } else {
        const detail = stderr.trim().split(/\r?\n/).slice(-8).join('\n')
        finish(new Error(`${path.basename(command)} 退出码 ${code}${childSignal ? ` (${childSignal})` : ''}${detail ? `：${detail}` : ''}`))
      }
    })

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }
    timer = setTimeout(() => {
      kill()
      finish(new Error('处理超时，请换用更短的视频后重试'))
    }, timeoutMs)
  })
}

async function fileExists(file, minBytes = 1) {
  try {
    const info = await stat(file)
    return info.isFile() && info.size >= minBytes
  } catch {
    return false
  }
}

async function findRuntimeNode() {
  if (nodeExecutablePromise) return nodeExecutablePromise
  nodeExecutablePromise = (async () => {
    const direct = [
      process.env.SPEAKER_AXIS_NODE_PATH,
      process.env.DSH_NODE_PATH,
      process.env.NODE_BINARY,
      path.join(DSH_HOME, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'node', 'bin', 'node.exe'),
      path.join(DSH_HOME, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'node', 'bin', 'node'),
      'C:\\Program Files\\nodejs\\node.exe',
      'C:\\Program Files (x86)\\nodejs\\node.exe',
    ].filter(Boolean)
    for (const candidate of direct) {
      if (await fileExists(candidate, 1024)) return candidate
    }

    const runtimes = path.join(DSH_HOME, 'dsh-runtimes')
    try {
      for (const entry of await readdir(runtimes, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        for (const relative of [
          path.join(entry.name, 'dependencies', 'node', 'bin', 'node.exe'),
          path.join(entry.name, 'dependencies', 'node', 'bin', 'node'),
          path.join(entry.name, 'node', 'node.exe'),
        ]) {
          const candidate = path.join(runtimes, relative)
          if (await fileExists(candidate, 1024)) return candidate
        }
      }
    } catch {
      // DSH_HOME may not contain runtimes in every installation.
    }

    try {
      const { stdout } = await runCommand('node', ['-e', 'process.stdout.write(process.version)'], {
        timeoutMs: 10_000,
        maxBuffer: 64 * 1024,
      })
      if (/^v\d+\./.test(stdout.trim())) return 'node'
    } catch {
      // No Node on PATH.
    }

    if (!process.versions.electron) return process.execPath
    throw new Error(
      '找不到独立 Node.js 运行时，无法加载离线说话人模型。请安装 Node.js 22+，或在插件环境变量 SPEAKER_AXIS_NODE_PATH 中指定 node.exe。',
    )
  })()
  return nodeExecutablePromise
}

function notifyModelProgress(percent, message) {
  for (const listener of modelProgressListeners) {
    try {
      listener(percent, message)
    } catch {
      // A closed job must not break the shared setup.
    }
  }
}

async function downloadFile(url, target, onProgress) {
  const partial = `${target}.part`
  await rm(partial, { force: true })
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(45 * 60 * 1000),
    headers: { 'user-agent': 'dsh-speaker-axis/1.0.0' },
  })
  if (!response.ok || !response.body) {
    throw new Error(`模型下载失败（HTTP ${response.status}）。请检查网络后重试，或手动把模型放到 ${MODEL_ROOT}。`)
  }
  const total = Number(response.headers.get('content-length') || 0)
  let received = 0
  let lastReport = 0
  const counter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length
      const now = Date.now()
      if (now - lastReport > 400) {
        lastReport = now
        onProgress?.(total ? received / total : 0, total ? `${formatBytes(received)} / ${formatBytes(total)}` : formatBytes(received))
      }
      callback(null, chunk)
    },
  })
  await pipeline(Readable.fromWeb(response.body), counter, createWriteStream(partial))
  await rm(target, { force: true })
  await rename(partial, target)
  if (!(await fileExists(target, 1024 * 1024))) {
    throw new Error('模型文件不完整，请重试。')
  }
}

async function ensureModels(onProgress) {
  if (await fileExists(SEGMENTATION_MODEL, 1024 * 1024) && await fileExists(EMBEDDING_MODEL, 1024 * 1024)) {
    onProgress?.(1, '离线模型已就绪')
    return
  }
  if (modelSetupPromise) {
    if (onProgress) modelProgressListeners.add(onProgress)
    try {
      await modelSetupPromise
    } finally {
      modelProgressListeners.delete(onProgress)
    }
    return
  }

  if (onProgress) modelProgressListeners.add(onProgress)
  modelSetupPromise = (async () => {
    await mkdir(MODEL_ROOT, { recursive: true })
    if (!(await fileExists(SEGMENTATION_MODEL, 1024 * 1024))) {
      const archive = path.join(MODEL_ROOT, 'segmentation.tar.bz2')
      notifyModelProgress(0.02, '下载说话人分割模型（约 6.6 MB）')
      await downloadFile(SEGMENTATION_URL, archive, (ratio, detail) => {
        notifyModelProgress(0.02 + ratio * 0.22, `下载说话人分割模型 ${detail || ''}`.trim())
      })
      notifyModelProgress(0.26, '解压说话人分割模型')
      await runCommand('tar', ['-xjf', archive, '-C', MODEL_ROOT], { timeoutMs: 5 * 60 * 1000 })
      await rm(archive, { force: true })
      if (!(await fileExists(SEGMENTATION_MODEL, 1024 * 1024))) {
        throw new Error(`说话人分割模型解压失败，请手动检查 ${SEGMENTATION_DIR}。`)
      }
    }
    if (!(await fileExists(EMBEDDING_MODEL, 1024 * 1024))) {
      notifyModelProgress(0.3, '下载声纹模型（约 27 MB）')
      await downloadFile(EMBEDDING_URL, EMBEDDING_MODEL, (ratio, detail) => {
        notifyModelProgress(0.3 + ratio * 0.68, `下载声纹模型 ${detail || ''}`.trim())
      })
    }
    notifyModelProgress(1, '离线模型已就绪')
  })()

  try {
    await modelSetupPromise
  } finally {
    modelSetupPromise = null
    modelProgressListeners.clear()
  }
}

async function probeDuration(inputPath, signal) {
  const { stdout } = await runCommand(
    FFPROBE,
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', inputPath],
    { signal, timeoutMs: 2 * 60 * 1000 },
  )
  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    return 0
  }
  const duration = Number(parsed?.format?.duration)
  if (Number.isFinite(duration) && duration > 0) return duration
  for (const stream of parsed?.streams || []) {
    const value = Number(stream.duration)
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

async function extractAudio(inputPath, outputPath, signal) {
  await runCommand(
    FFMPEG,
    [
      '-hide_banner',
      '-nostdin',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inputPath,
      '-map',
      '0:a:0',
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'pcm_s16le',
      outputPath,
    ],
    { signal, timeoutMs: 3 * 60 * 60 * 1000 },
  )
  if (!(await fileExists(outputPath, 1024))) {
    throw new Error('视频里没有可用的音轨，或音轨无法解码。')
  }
}

async function runDiarization(audioPath, options, signal, onProgress) {
  const speakerCount = Number(options.speakerCount) || 0
  const nodeExecutable = await findRuntimeNode()
  const env = { ...process.env }
  if (process.versions.electron) env.ELECTRON_RUN_AS_NODE = '1'

  return new Promise((resolve, reject) => {
    let settled = false
    let result = null
    let stderr = ''
    let lastError = ''
    let timer = null
    let child
    const finish = (error, value) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      if (error) reject(error)
      else resolve(value)
    }
    const kill = () => {
      try {
        child?.kill()
      } catch {
        // The child may already have exited.
      }
    }
    const onAbort = () => {
      kill()
      const error = new Error('任务已取消')
      error.code = 'ABORT_ERR'
      finish(error)
    }

    try {
      child = spawn(
        nodeExecutable,
        [
          DIARIZE_RUNNER,
          audioPath,
          SEGMENTATION_MODEL,
          EMBEDDING_MODEL,
          String(speakerCount),
          String(options.clusterThreshold),
        ],
        {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env,
        },
      )
    } catch (error) {
      finish(error)
      return
    }

    const reader = createInterface({ input: child.stdout, crlfDelay: Infinity })
    reader.on('line', (line) => {
      const text = line.trim()
      if (!text) return
      let event
      try {
        event = JSON.parse(text)
      } catch {
        stderr += `${text}\n`
        if (stderr.length > 128 * 1024) stderr = stderr.slice(-128 * 1024)
        return
      }
      if (event.type === 'progress') {
        try {
          onProgress?.(event)
        } catch {
          // A UI callback must not break the inference process.
        }
        return
      }
      if (event.type === 'result') {
        result = event
        return
      }
      if (event.type === 'error') {
        lastError = String(event.error || '')
      }
    })
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      if (stderr.length > 128 * 1024) stderr = stderr.slice(-128 * 1024)
    })
    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        error.message = `找不到可执行文件：${nodeExecutable}`
      }
      finish(error)
    })
    child.on('close', (code) => {
      if (settled) return
      reader.close()
      if (code === 0 && result) {
        finish(null, result)
      } else {
        const detail = lastError || stderr.trim().split(/\r?\n/).slice(-8).join('\n')
        finish(new Error(`说话人识别失败（退出码 ${code}）${detail ? `：${detail}` : ''}`))
      }
    })

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }
    timer = setTimeout(() => {
      kill()
      finish(new Error('说话人识别超时，请换用更短的视频后重试'))
    }, 6 * 60 * 60 * 1000)
  })
}

function createJob({ inputPath, originalName, options, outputDir, externalSignal, id, directory, ownsInput = false }) {
  id = id || randomUUID()
  directory = directory || path.join(JOB_ROOT, id)
  const job = {
    id,
    directory,
    inputPath,
    originalName,
    ownsInput,
    filename: path.basename(originalName || inputPath),
    options,
    outputDir,
    status: 'queued',
    phase: 'queued',
    progress: 0,
    message: '等待开始',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    duration: 0,
    currentTime: 0,
    chunkStart: 0,
    chunkEnd: 0,
    etaSeconds: 0,
    diarizeStartedAt: 0,
    segments: [],
    previewSegments: [],
    speakers: [],
    outputPath: '',
    error: '',
    abort: new AbortController(),
  }
  if (externalSignal) {
    if (externalSignal.aborted) job.abort.abort()
    else externalSignal.addEventListener('abort', () => job.abort.abort(), { once: true })
  }
  job.done = processJob(job)
    .catch((error) => {
      const aborted = job.abort.signal.aborted || error?.code === 'ABORT_ERR'
      job.status = aborted ? 'canceled' : 'error'
      job.phase = job.status
      job.message = aborted ? '任务已取消' : '处理失败'
      job.error = aborted ? '任务已取消' : String(error?.message || error)
      job.updatedAt = Date.now()
      return job
    })
  return job
}

function setProgress(job, phase, progress, message) {
  job.phase = phase
  job.progress = Math.max(job.progress, Math.min(99, Math.round(progress)))
  job.message = message
  job.updatedAt = Date.now()
}

async function processJob(job) {
  await mkdir(job.directory, { recursive: true })
  job.status = 'processing'
  job.updatedAt = Date.now()
  const signal = job.abort.signal
  try {
    setProgress(job, 'probe', 3, '读取视频信息')
    const duration = await probeDuration(job.inputPath, signal)
    job.duration = duration
    if (duration > MAX_MEDIA_SECONDS) {
      throw new Error(`视频超过 ${Math.round(MAX_MEDIA_SECONDS / 60)} 分钟，暂不支持。`)
    }

    const audioPath = path.join(job.directory, 'audio.wav')
    setProgress(job, 'audio', 8, '提取音轨')
    await extractAudio(job.inputPath, audioPath, signal)

    setProgress(job, 'models', 26, '准备离线说话人模型')
    await ensureModels((ratio, message) => {
      setProgress(job, 'models', 26 + ratio * 30, message || '准备离线说话人模型')
    })

    setProgress(job, 'diarize', 58, '识别说话人并切分时间轴')
    job.diarizeStartedAt = Date.now()
    const diarized = await runDiarization(audioPath, job.options, signal, (event) => {
      const mediaDuration = Number(event.duration) || job.duration || duration
      const currentTime = Math.max(0, Math.min(mediaDuration, Number(event.currentTime) || 0))
      job.currentTime = currentTime
      job.chunkStart = Math.max(0, Math.min(mediaDuration, Number(event.chunkStart) || 0))
      job.chunkEnd = Math.max(job.chunkStart, Math.min(mediaDuration, Number(event.chunkEnd) || 0))
      if (mediaDuration > 0) job.duration = mediaDuration
      if (Array.isArray(event.segments)) {
        job.previewSegments = event.segments.map((segment) => ({
          start: Math.round(segment.start * 100) / 100,
          end: Math.round(segment.end * 100) / 100,
          speaker: segment.speaker,
        }))
      }
      const ratio = Math.max(0, Math.min(1, Number(event.percent) || 0))
      const mediaRatio = mediaDuration > 0 ? currentTime / mediaDuration : 0
      if (job.diarizeStartedAt > 0 && mediaRatio > 0.015 && mediaRatio < 1) {
        const elapsed = (Date.now() - job.diarizeStartedAt) / 1000
        job.etaSeconds = Math.max(0, Math.round((elapsed / mediaRatio) * (1 - mediaRatio)))
      } else if (mediaRatio >= 1) {
        job.etaSeconds = 0
      }
      const range = job.chunkEnd > job.chunkStart
        ? `${formatMediaClock(job.chunkStart)}–${formatMediaClock(job.chunkEnd)}`
        : formatMediaClock(currentTime)
      setProgress(
        job,
        'diarize',
        58 + ratio * 34,
        `正在打轴 ${range} / ${formatMediaClock(mediaDuration)}`,
      )
    })
    const segments = mergeAndSplitSegments(
      diarized.segments,
      job.options.maxSegmentSeconds,
      duration,
    )
    if (!segments.length) {
      throw new Error('没有检测到清晰的人声片段。请确认视频包含对话，或尝试更长的素材。')
    }
    job.segments = segments.map((segment) => ({
      start: Math.round(segment.start * 100) / 100,
      end: Math.round(segment.end * 100) / 100,
      speaker: segment.speaker,
    }))
    job.currentTime = job.duration
    job.previewSegments = job.segments
    job.etaSeconds = 0
    job.diarizeStartedAt = 0
    job.speakers = buildSpeakers(job.segments, job.options)

    setProgress(job, 'render', 92, '生成 ASS 打轴文件')
    await renderJobOutput(job, true)
    job.progress = 100
    setProgress(job, 'done', 100, '完成')
    job.status = 'done'
    job.updatedAt = Date.now()
    await rm(audioPath, { force: true })
    if (job.ownsInput) await rm(job.inputPath, { force: true })
  } catch (error) {
    job.etaSeconds = 0
    job.diarizeStartedAt = 0
    if (signal.aborted) {
      job.status = 'canceled'
      job.phase = 'canceled'
      job.message = '任务已取消'
      job.error = '任务已取消'
    } else {
      job.status = 'error'
      job.phase = 'error'
      job.message = '处理失败'
      job.error = String(error?.message || error)
    }
    job.updatedAt = Date.now()
    if (job.ownsInput) await rm(job.inputPath, { force: true })
  }
  return job
}

async function renderJobOutput(job, firstRender) {
  const options = sanitizeOptions(job.options)
  job.options = options
  const speakers = buildSpeakers(job.segments, options)
  job.speakers = speakers
  const ass = renderAss({
    segments: job.segments,
    speakers,
    options,
    title: `${job.filename} · speaker axis`,
  })

  await mkdir(job.directory, { recursive: true })
  await writeFile(path.join(job.directory, 'out.ass'), ass, 'utf8')

  if (firstRender || !job.outputPath) {
    const requestedDir = job.outputDir || process.cwd()
    let targetDir = path.resolve(requestedDir, 'speaker-axis-output')
    try {
      await mkdir(targetDir, { recursive: true })
    } catch {
      targetDir = job.directory
    }
    const base = sanitizeBaseName(job.filename)
    let outputPath = path.join(targetDir, `${base}.speaker.ass`)
    let suffix = 2
    while (await fileExists(outputPath)) {
      outputPath = path.join(targetDir, `${base} (${suffix}).speaker.ass`)
      suffix += 1
    }
    job.outputPath = outputPath
  }

  try {
    await writeFile(job.outputPath, ass, 'utf8')
  } catch {
    job.outputPath = path.join(job.directory, 'out.ass')
    await writeFile(job.outputPath, ass, 'utf8')
  }
  job.updatedAt = Date.now()
  return ass
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    phase: job.phase,
    progress: job.progress,
    message: job.message,
    filename: job.filename,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    duration: job.duration,
    currentTime: job.currentTime,
    chunkStart: job.chunkStart,
    chunkEnd: job.chunkEnd,
    etaSeconds: job.etaSeconds,
    options: job.options,
    segments: job.status === 'done' ? job.segments : [],
    previewSegments: job.previewSegments || [],
    speakers: job.status === 'done' ? job.speakers : [],
    outputPath: job.outputPath,
    error: job.error,
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function parseQueryOptions(request, url) {
  const raw = request.headers.get('x-speaker-axis-options')
  let parsed = {}
  if (raw) {
    try {
      parsed = JSON.parse(decodeURIComponent(raw))
    } catch {
      parsed = {}
    }
  }
  const filename = url.searchParams.get('filename') || 'video.mp4'
  return {
    filename: path.basename(filename),
    options: sanitizeOptions(parsed),
  }
}

async function saveUpload(request, target, maxBytes) {
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > maxBytes) {
    const error = new Error(`文件超过上限（${formatBytes(maxBytes)}）`)
    error.status = 413
    throw error
  }
  if (!request.body) {
    const error = new Error('请求里没有文件内容')
    error.status = 400
    throw error
  }
  let size = 0
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      size += chunk.length
      if (size > maxBytes) {
        const error = new Error(`文件超过上限（${formatBytes(maxBytes)}）`)
        error.status = 413
        callback(error)
        return
      }
      callback(null, chunk)
    },
  })
  await pipeline(Readable.fromWeb(request.body), limiter, createWriteStream(target))
  return size
}

function createRouteHandler(ctx, jobs) {
  return async function handleSpeakerAxisRequest(request) {
    const url = new URL(request.url, 'http://localhost')
    if (!url.pathname.startsWith('/api/speaker-axis')) return new Response('Not found', { status: 404 })
    const origin = request.headers.get('origin')
    if (origin && origin !== url.origin) {
      return json({ ok: false, error: 'Forbidden' }, 403)
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/speaker-axis/health') {
        const modelsReady =
          (await fileExists(SEGMENTATION_MODEL, 1024 * 1024)) &&
          (await fileExists(EMBEDDING_MODEL, 1024 * 1024))
        return json({
          ok: true,
          version: PLUGIN_VERSION,
          modelsReady,
          modelDir: MODEL_ROOT,
          jobs: jobs.size,
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/speaker-axis/jobs') {
        const { filename, options } = parseQueryOptions(request, url)
        const originalName = filename
        const jobId = randomUUID()
        const directory = path.join(JOB_ROOT, jobId)
        await mkdir(directory, { recursive: true })
        const extension = path.extname(originalName).slice(0, 16) || '.bin'
        const inputPath = path.join(directory, `source${extension}`)
        try {
          await saveUpload(request, inputPath, MAX_UPLOAD_BYTES)
        } catch (error) {
          await rm(directory, { recursive: true, force: true })
          throw error
        }

        const defaultDirectory = ctx.get('workingDirectory')?.defaultDirectory
        const sessionId = url.searchParams.get('sessionId') || ''
        let targetDir = ''
        if (/^session-[a-z0-9-]+$/i.test(sessionId)) {
          try {
            const agent = ctx.get('agents')?.get(sessionId)
            if (agent && ctx.get('workingDirectory')) {
              targetDir = await ctx.get('workingDirectory').ensure(agent)
            }
          } catch {
            // Fall back to the default workspace below.
          }
        }
        if (!targetDir) targetDir = defaultDirectory || process.cwd()
        const job = createJob({
          inputPath,
          originalName,
          options,
          outputDir: targetDir,
          id: jobId,
          directory,
          ownsInput: true,
        })
        jobs.set(jobId, job)
        return json({ ok: true, job: publicJob(job) }, 201)
      }

      const match = url.pathname.match(/^\/api\/speaker-axis\/jobs\/([a-f0-9-]+)(?:\/(render|ass|cancel))?$/)
      if (match) {
        const job = jobs.get(match[1])
        if (!job) return json({ ok: false, error: '任务不存在或已过期' }, 404)
        const action = match[2]

        if (request.method === 'GET' && !action) {
          return json({ ok: true, job: publicJob(job) })
        }

        if (request.method === 'POST' && action === 'cancel') {
          job.abort.abort()
          return json({ ok: true, job: publicJob(job) })
        }

        if (request.method === 'POST' && action === 'render') {
          if (job.status !== 'done') return json({ ok: false, error: '任务尚未完成' }, 409)
          let body = {}
          try {
            body = await request.json()
          } catch {
            return json({ ok: false, error: '请求格式错误' }, 400)
          }
          job.options = sanitizeOptions({ ...job.options, ...body })
          await renderJobOutput(job, false)
          return json({ ok: true, job: publicJob(job) })
        }

        if (request.method === 'GET' && action === 'ass') {
          if (job.status !== 'done') return json({ ok: false, error: '任务尚未完成' }, 409)
          let file = job.outputPath
          if (!file || !(await fileExists(file))) file = path.join(job.directory, 'out.ass')
          if (!(await fileExists(file))) return json({ ok: false, error: 'ASS 文件不存在' }, 404)
          const base = path.basename(file)
          const ascii = base.replace(/[^\x20-\x7e]/g, '_')
          const headers = {
            'content-type': 'text/x-ssa; charset=utf-8',
            'content-disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(base)}`,
            'cache-control': 'no-store',
          }
          return new Response(Readable.toWeb(createReadStream(file)), { headers })
        }
      }

      return json({ ok: false, error: '未知接口' }, 404)
    } catch (error) {
      return json({ ok: false, error: String(error?.message || error) }, error?.status || 500)
    }
  }
}

function nodeHandlerFor(route) {
  return async function handleNodeRequest(req, res) {
    try {
      const host = req.headers.host || '127.0.0.1'
      const method = req.method || 'GET'
      const headers = new Headers()
      for (const [name, value] of Object.entries(req.headers)) {
        if (value === undefined) continue
        headers.set(name, Array.isArray(value) ? value.join(', ') : value)
      }
      const hasBody = method !== 'GET' && method !== 'HEAD'
      const request = new Request(`http://${host}${req.url || '/'}`, {
        method,
        headers,
        body: hasBody ? Readable.toWeb(req) : undefined,
        duplex: hasBody ? 'half' : undefined,
      })
      const response = await route(request)
      res.statusCode = response.status
      for (const [name, value] of response.headers) {
        res.setHeader(name, value)
      }
      if (!response.body || method === 'HEAD') {
        res.end()
        return
      }
      await pipeline(Readable.fromWeb(response.body), res)
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: String(error?.message || error) }))
      } else {
        res.destroy(error)
      }
    }
  }
}

function launchExternalUrl(url) {
  let command
  let args
  if (process.platform === 'win32') {
    const chromeCandidates = [
      process.env.CHROME_PATH,
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ].filter(Boolean)
    const chrome = chromeCandidates.find((candidate) => existsSync(candidate))
    if (chrome) {
      command = chrome
      args = ['--new-window', url]
    } else {
      command = 'cmd.exe'
      args = ['/c', 'start', '', url]
    }
  } else if (process.platform === 'darwin') {
    command = 'open'
    args = [url]
  } else {
    command = 'xdg-open'
    args = [url]
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  child.unref()
}

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
}

export const inject = ['tools']

export function apply(ctx) {
  const jobs = new Map()
  const route = createRouteHandler(ctx, jobs)
  const webServer = ctx.get('webServer')
  if (webServer) {
    ctx.effect(() =>
      webServer.register({
        kind: 'prefix',
        path: '/api/speaker-axis',
        handler: nodeHandlerFor(route),
      }),
    )
  }

  ctx.effect(() =>
    ctx.tools.register({
      name: 'speaker_axis',
      description:
        'Generate a speaker-colored ASS timing file from a local video or audio file. Detects speech turns and clusters speakers, then writes styled ASS events with editable speaker placeholders. It does not transcribe speech or translate anything. Use this when the user supplies a video/audio path and asks for a speaker-differentiated subtitle axis.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or workspace-relative path to a video or audio file.',
          },
          speakerCount: {
            type: 'integer',
            minimum: 0,
            maximum: 12,
            description: 'Expected number of speakers. Use 0 for automatic detection.',
          },
          stylePreset: {
            type: 'string',
            enum: ['neon', 'candy', 'broadcast', 'mono'],
            description: 'ASS color/style preset. Default neon.',
          },
          placeholder: {
            type: 'string',
            description:
              'Text template for each event. Supports {name}, {index}, and {time}. Default {name}. Use an empty string for invisible timing events.',
          },
          position: {
            type: 'string',
            enum: ['bottom', 'top', 'alternate'],
            description: 'Screen position. Default bottom.',
          },
          maxSegmentSeconds: {
            type: 'number',
            minimum: 0,
            maximum: 60,
            description: 'Split long turns into at most this many seconds. Use 0 to keep whole speaker turns. Default 8.',
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional display names for speaker 1, 2, ... in first-appearance order.',
          },
        },
        required: ['path'],
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            path: { type: 'string' },
            speakerCount: { type: 'integer' },
            segmentCount: { type: 'integer' },
            duration: { type: 'number' },
            speakers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  color: { type: 'string' },
                  segments: { type: 'integer' },
                  talkTime: { type: 'number' },
                },
                additionalProperties: false,
              },
            },
            summary: { type: 'string' },
          },
          required: ['path', 'speakerCount', 'segmentCount', 'duration', 'speakers', 'summary'],
        },
        render(_args, value) {
          return [{ type: 'text', text: value.summary }]
        },
      },
      timeoutMs: 45 * 60 * 1000,
      isConcurrencySafe() {
        return false
      },
      async execute(args, exec) {
        const inputArg = typeof args?.path === 'string' ? args.path : ''
        if (!inputArg) throw new Error('缺少视频路径（path）。')
        let cwd = process.cwd()
        try {
          if (exec.agent && ctx.get('workingDirectory')) {
            cwd = await ctx.workingDirectory.ensure(exec.agent)
          } else {
            cwd = ctx.get('workingDirectory')?.defaultDirectory || cwd
          }
        } catch {
          // Fall back to the Host process directory.
        }
        const inputPath = path.isAbsolute(inputArg) ? inputArg : path.resolve(cwd, inputArg)
        if (!(await fileExists(inputPath))) throw new Error(`找不到文件：${inputPath}`)
        const options = sanitizeOptions({
          speakerCount: args.speakerCount,
          stylePreset: args.stylePreset,
          placeholder: args.placeholder,
          position: args.position,
          maxSegmentSeconds: args.maxSegmentSeconds,
          labels: args.labels,
        })
        const info = await stat(inputPath)
        const job = createJob({
          inputPath,
          originalName: path.basename(inputPath),
          options,
          outputDir: path.dirname(inputPath),
          externalSignal: exec.signal,
        })
        jobs.set(job.id, job)
        await job.done
        if (job.status !== 'done') throw new Error(job.error || '打轴失败')
        const speakerCount = job.speakers.length
        const lines = job.speakers
          .map(
            (speaker) =>
              `${speaker.label}（${speaker.color}）：${speaker.segments} 段，约 ${speaker.talkTime.toFixed(1)} 秒`,
          )
          .join('\n')
        return {
          path: job.outputPath,
          speakerCount,
          segmentCount: job.segments.length,
          duration: Math.round(job.duration * 100) / 100,
          speakers: job.speakers.map((speaker) => ({
            label: speaker.label,
            color: speaker.color,
            segments: speaker.segments,
            talkTime: speaker.talkTime,
          })),
          summary: `已生成说话人打轴 ASS：${job.outputPath}\n输入文件：${path.basename(inputPath)}（${formatBytes(info.size)}，${formatClock(job.duration)}）\n发言人 ${speakerCount} 位，共 ${job.segments.length} 个时间片段。\n${lines}`,
        }
      },
    }),
  )

  ctx.effect(() =>
    ctx.tools.register({
      name: 'open_harness_webui',
      description:
        'Open the current DeepSeek Harness Web UI in the system browser with a valid process launch token. Use when the user asks to open, show, or bring up the WebUI.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            opened: { type: 'boolean' },
            url: { type: 'string' },
          },
          required: ['opened', 'url'],
        },
        render(_args, value) {
          return [{ type: 'text', text: `已在系统浏览器中打开 Harness WebUI：${value.url}` }]
        },
      },
      async execute() {
        const connection = ctx.get('connection')
        const webApp = ctx.get('webApp')
        const webServer = ctx.get('webServer')
        if (!connection || typeof connection.authenticatedUrl !== 'function') {
          throw new Error('当前 Host 没有提供浏览器认证入口，无法生成带登录令牌的 URL。')
        }
        const base = webApp?.getAdvertisedUrl?.() || (webServer ? `${webServer.getOrigin()}/` : '')
        if (!base) throw new Error('无法读取 WebUI 地址。')
        const authenticated = connection.authenticatedUrl(base)
        launchExternalUrl(authenticated)
        return { opened: true, url: base }
      },
    }),
  )

  ctx.effect(() => () => {
    for (const job of jobs.values()) {
      if (job.status === 'processing' || job.status === 'queued') job.abort.abort()
    }
  })
}
