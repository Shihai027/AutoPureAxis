#!/usr/bin/env node
/**
 * Standalone speaker-axis CLI.
 *
 * The same media/diarization/ASS core used by the Harness plugin, without any
 * Cordis or Web UI dependency. This is the portable entry point for scripts,
 * other editors, or a future desktop wrapper.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import {
  buildSpeakers,
  ensureModels,
  extractAudio,
  fileExists,
  formatMediaClock,
  mergeAndSplitSegments,
  probeDuration,
  renderAss,
  runDiarization,
  sanitizeOptions,
} from '../core.js'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    speakers: { type: 'string', default: '0' },
    style: { type: 'string', default: 'neon' },
    position: { type: 'string', default: 'bottom' },
    'max-segment': { type: 'string', default: '8' },
    placeholder: { type: 'string', default: '{name}' },
    labels: { type: 'string' },
    out: { type: 'string' },
    quiet: { type: 'boolean', default: false },
    'keep-audio': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

function usage() {
  process.stderr.write(`Usage: speaker-axis <video-or-audio> [options]

Options:
  --speakers <n>        Expected speakers; 0 = auto (default: 0)
  --style <name>        neon | candy | broadcast | mono (default: neon)
  --position <name>     bottom | top | alternate (default: bottom)
  --max-segment <sec>   Split long turns; 0 = keep whole turns (default: 8)
  --placeholder <text>  {name}, {index}, {time}; empty for invisible events
  --labels <a,b,c>      Speaker display names in first-appearance order
  --out <file.ass>      Output path
  --quiet               Suppress progress on stderr
  --keep-audio          Keep the extracted 16 kHz WAV
  -h, --help

Environment:
  SPEAKER_AXIS_DATA_DIR  Model/cache directory (default: $DSH_HOME/speaker-axis)
  FFMPEG_PATH            ffmpeg executable
  FFPROBE_PATH           ffprobe executable
  SPEAKER_AXIS_NODE_PATH Node.js executable used for the diarization worker
`)
}

if (values.help || positionals.length === 0) {
  usage()
  process.exit(positionals.length === 0 && !values.help ? 1 : 0)
}

const inputPath = path.resolve(positionals[0])
if (!(await fileExists(inputPath))) {
  process.stderr.write(`File not found: ${inputPath}\n`)
  process.exit(1)
}

const labels = values.labels
  ? values.labels.split(',').map((label) => label.trim()).filter(Boolean)
  : []
const options = sanitizeOptions({
  speakerCount: Number(values.speakers) || 0,
  stylePreset: values.style,
  position: values.position,
  maxSegmentSeconds: Number(values['max-segment']) || 0,
  placeholder: values.placeholder,
  labels,
})
const abort = new AbortController()
process.once('SIGINT', () => abort.abort())

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'speaker-axis-'))
const audioPath = path.join(tempDir, 'audio.wav')
const progress = (message) => {
  if (!values.quiet) process.stderr.write(`\r${message.padEnd(72)}\r`)
}

try {
  progress('Reading media…')
  const duration = await probeDuration(inputPath, abort.signal)
  progress('Preparing offline models…')
  await ensureModels((ratio, message) => progress(message || `Preparing models ${Math.round(ratio * 100)}%`))

  progress('Extracting audio…')
  await extractAudio(inputPath, audioPath, abort.signal)

  progress('Diarizing…')
  const diarizeStartedAt = Date.now()
  const diarized = await runDiarization(audioPath, options, abort.signal, (event) => {
    const ratio = Math.max(0, Math.min(1, Number(event.percent) || 0))
    const elapsed = (Date.now() - diarizeStartedAt) / 1000
    const eta = ratio > 0.015 && ratio < 1 ? Math.max(0, Math.round((elapsed / ratio) * (1 - ratio))) : 0
    progress(
      `Diarizing ${formatMediaClock(event.currentTime || 0)} / ${formatMediaClock(event.duration || duration)} (${Math.round(ratio * 100)}%)${eta ? ` · ETA ${formatMediaClock(eta)}` : ''}`,
    )
  })
  const segments = mergeAndSplitSegments(diarized.segments, options.maxSegmentSeconds, duration)
  if (!segments.length) throw new Error('No speech segments were detected.')
  const speakers = buildSpeakers(segments, options)
  const ass = renderAss({
    segments,
    speakers,
    options,
    title: `${path.basename(inputPath)} · speaker axis`,
  })

  const outPath = values.out
    ? path.resolve(values.out)
    : path.join(path.dirname(inputPath), 'speaker-axis-output', `${path.basename(inputPath).replace(/\.[^.]+$/, '')}.speaker.ass`)
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, ass, 'utf8')
  if (!values.quiet) process.stderr.write('\n')

  process.stdout.write(
    `${JSON.stringify(
      {
        outputPath: outPath,
        duration: Math.round(duration * 100) / 100,
        segmentCount: segments.length,
        speakerCount: speakers.length,
        speakers: speakers.map((speaker) => ({
          label: speaker.label,
          color: speaker.color,
          segments: speaker.segments,
          talkTime: speaker.talkTime,
        })),
      },
      null,
      2,
    )}\n`,
  )
} catch (error) {
  process.stderr.write(`\n${String(error?.stack || error)}\n`)
  process.exitCode = 1
} finally {
  if (!values['keep-audio']) await rm(tempDir, { recursive: true, force: true })
  else process.stderr.write(`Audio kept at ${audioPath}\n`)
}
