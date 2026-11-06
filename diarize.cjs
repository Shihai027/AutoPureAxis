/*
 * Offline speaker diarization worker.
 *
 * The parent process extracts 16 kHz mono PCM audio and passes the audio path,
 * two ONNX models, the expected speaker count (0 = automatic), and the
 * clustering threshold.
 *
 * The audio is processed in short chunks so the Host can show a real media
 * position while the job runs. Each chunk is diarized locally; local speakers
 * are matched to global speakers with CAM++ embeddings, so labels stay stable
 * across chunk boundaries. One JSON event is written per line:
 *
 *   {"type":"progress","currentTime":12.3,"duration":56.8,"percent":0.21,"segments":[...]}
 *   {"type":"result","segments":[...],"speakerCount":4}
 */
const path = require('node:path')
const sherpa = require('sherpa-onnx-node')

const SAMPLE_RATE = 16000
const MATCH_THRESHOLD = 0.55
const MAX_GLOBAL_SPEAKERS = 12
const CHUNK_SECONDS = Math.max(20, Number(process.env.SPEAKER_AXIS_CHUNK_SECONDS || 90))
const EMBEDDING_WINDOW_SECONDS = 3

function emit(event) {
  process.stdout.write(`${JSON.stringify(event)}\n`)
}

function fail(message) {
  emit({ type: 'error', error: message, segments: [] })
  process.exitCode = 1
}

function cosine(a, b) {
  let dot = 0
  let aa = 0
  let bb = 0
  const length = Math.min(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index]
    aa += a[index] * a[index]
    bb += b[index] * b[index]
  }
  if (aa === 0 || bb === 0) return 0
  return dot / Math.sqrt(aa * bb)
}

function averageVector(sum, weight) {
  const result = new Float32Array(sum.length)
  for (let index = 0; index < sum.length; index += 1) result[index] = sum[index] / weight
  return result
}

function findQuietCut(samples, startSample, targetSample, endSample) {
  const searchStart = Math.max(startSample, targetSample - SAMPLE_RATE * 4)
  const searchEnd = Math.min(endSample, targetSample + SAMPLE_RATE * 4)
  if (searchEnd - searchStart < SAMPLE_RATE * 2) return Math.min(endSample, targetSample)

  const windowSize = Math.round(SAMPLE_RATE * 0.05)
  const step = windowSize
  let bestSample = Math.min(endSample, targetSample)
  let bestEnergy = Number.POSITIVE_INFINITY
  for (let offset = searchStart; offset + windowSize <= searchEnd; offset += step) {
    let energy = 0
    for (let index = offset; index < offset + windowSize; index += 1) {
      const value = samples[index]
      energy += value * value
    }
    if (energy < bestEnergy) {
      bestEnergy = energy
      bestSample = offset + Math.round(windowSize / 2)
    }
  }
  return Math.min(endSample, Math.max(startSample + SAMPLE_RATE * 5, bestSample))
}

function buildChunks(totalSamples) {
  if (totalSamples <= SAMPLE_RATE * (CHUNK_SECONDS + 30)) {
    return [{ start: 0, end: totalSamples }]
  }
  const chunkSamples = Math.round(SAMPLE_RATE * CHUNK_SECONDS)
  const chunks = []
  let start = 0
  while (start < totalSamples) {
    if (totalSamples - start <= chunkSamples * 1.4) {
      chunks.push({ start, end: totalSamples })
      break
    }
    const end = findQuietCut(samplesGlobal, start, start + chunkSamples, totalSamples)
    chunks.push({ start, end })
    start = end
  }
  return chunks
}

// Set by main() before buildChunks; kept module-level to avoid threading the
// full sample buffer through the cut finder.
let samplesGlobal = null

function main() {
  const [audioPath, segmentationModel, embeddingModel, countArg, thresholdArg] =
    process.argv.slice(2)
  if (!audioPath || !segmentationModel || !embeddingModel) {
    fail('usage: diarize.cjs <audio.wav> <segmentation.onnx> <embedding.onnx> [speakerCount] [threshold]')
    return
  }

  const speakerCount = Math.max(0, Math.min(12, Number.parseInt(countArg || '0', 10) || 0))
  const threshold = Math.max(0.1, Math.min(0.99, Number.parseFloat(thresholdArg || '0.75') || 0.75))

  try {
    const wave = sherpa.readWave(audioPath)
    if (wave.sampleRate !== SAMPLE_RATE) {
      fail(`expected ${SAMPLE_RATE} Hz audio, got ${wave.sampleRate} Hz`)
      return
    }
    samplesGlobal = wave.samples
    const totalSamples = wave.samples.length
    const duration = totalSamples / SAMPLE_RATE

    const diarizer = new sherpa.OfflineSpeakerDiarization({
      segmentation: {
        pyannote: {
          model: segmentationModel,
          windowShiftRatio: 0.1,
        },
      },
      embedding: {
        model: embeddingModel,
      },
      clustering: {
        numClusters: -1,
        threshold,
      },
      minDurationOn: 0.22,
      minDurationOff: 0.48,
    })
    const extractor = new sherpa.SpeakerEmbeddingExtractor({ model: embeddingModel })

    function extractEmbedding(samples) {
      if (samples.length < SAMPLE_RATE * 0.25) return null
      const take = Math.min(samples.length, SAMPLE_RATE * EMBEDDING_WINDOW_SECONDS)
      const begin = Math.max(0, Math.floor((samples.length - take) / 2))
      const window = samples.subarray(begin, begin + take)
      const stream = extractor.createStream()
      stream.acceptWaveform({ sampleRate: SAMPLE_RATE, samples: window })
      stream.inputFinished()
      if (!extractor.isReady(stream)) return null
      return extractor.compute(stream)
    }

    const globals = []
    const segments = []
    const chunks = buildChunks(totalSamples)
    emit({ type: 'progress', currentTime: 0, duration, percent: 0, segments: [] })

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunk = chunks[chunkIndex]
      const chunkStartSeconds = chunk.start / SAMPLE_RATE
      const chunkEndSeconds = chunk.end / SAMPLE_RATE
      emit({
        type: 'progress',
        currentTime: chunkStartSeconds,
        chunkStart: chunkStartSeconds,
        chunkEnd: chunkEndSeconds,
        duration,
        percent: Math.min(1, chunk.start / totalSamples),
        segments,
      })
      const chunkSamples = wave.samples.subarray(chunk.start, chunk.end)
      const localSegments = diarizer.process(chunkSamples)
      const localAccumulators = new Map()

      for (const segment of localSegments) {
        const start = Math.max(chunkStartSeconds, segment.start + chunkStartSeconds)
        const end = Math.min(chunk.end / SAMPLE_RATE, segment.end + chunkStartSeconds)
        if (end - start < 0.18) continue
        const sampleStart = Math.max(chunk.start, Math.floor(start * SAMPLE_RATE))
        const sampleEnd = Math.min(chunk.end, Math.ceil(end * SAMPLE_RATE))
        const embedding = extractEmbedding(wave.samples.subarray(sampleStart, sampleEnd))
        if (!embedding) continue
        const weight = end - start
        if (!localAccumulators.has(segment.speaker)) {
          localAccumulators.set(segment.speaker, {
            sum: new Float32Array(embedding.length),
            weight: 0,
          })
        }
        const accumulator = localAccumulators.get(segment.speaker)
        for (let index = 0; index < embedding.length; index += 1) {
          accumulator.sum[index] += embedding[index] * weight
        }
        accumulator.weight += weight
      }

      const localToGlobal = new Map()
      for (const [localSpeaker, accumulator] of localAccumulators) {
        const centroid = averageVector(accumulator.sum, accumulator.weight)
        let bestIndex = -1
        let bestScore = -1
        for (let index = 0; index < globals.length; index += 1) {
          const score = cosine(centroid, globals[index].vector)
          if (score > bestScore) {
            bestScore = score
            bestIndex = index
          }
        }
        let globalIndex
        if (bestIndex >= 0 && (bestScore >= MATCH_THRESHOLD || (speakerCount > 0 && globals.length >= speakerCount))) {
          globalIndex = bestIndex
          const global = globals[globalIndex]
          const totalWeight = global.weight + accumulator.weight
          for (let index = 0; index < centroid.length; index += 1) {
            global.vector[index] = (global.vector[index] * global.weight + centroid[index] * accumulator.weight) / totalWeight
          }
          global.weight = totalWeight
        } else if (globals.length < (speakerCount > 0 ? speakerCount : MAX_GLOBAL_SPEAKERS)) {
          globalIndex = globals.length
          globals.push({ vector: centroid, weight: accumulator.weight })
        } else if (bestIndex >= 0) {
          globalIndex = bestIndex
        } else {
          globalIndex = 0
        }
        localToGlobal.set(localSpeaker, globalIndex)
      }

      for (const segment of localSegments) {
        const globalSpeaker = localToGlobal.get(segment.speaker)
        if (globalSpeaker === undefined) continue
        const start = Math.max(chunkStartSeconds, segment.start + chunkStartSeconds)
        const end = Math.min(chunk.end / SAMPLE_RATE, segment.end + chunkStartSeconds)
        if (end - start < 0.18) continue
        segments.push({
          start: Number(start.toFixed(3)),
          end: Number(end.toFixed(3)),
          speaker: globalSpeaker,
        })
      }

      emit({
        type: 'progress',
        currentTime: Math.min(duration, chunk.end / SAMPLE_RATE),
        chunkStart: chunkStartSeconds,
        chunkEnd: chunkEndSeconds,
        duration,
        percent: Math.min(1, chunk.end / totalSamples),
        segments,
      })
    }

    const targetCount = speakerCount > 0 ? speakerCount : Math.min(MAX_GLOBAL_SPEAKERS, globals.length)
    while (globals.length > targetCount && globals.length > 1) {
      let mergeA = 0
      let mergeB = 1
      let bestScore = -1
      for (let a = 0; a < globals.length; a += 1) {
        for (let b = a + 1; b < globals.length; b += 1) {
          const score = cosine(globals[a].vector, globals[b].vector)
          if (score > bestScore) {
            bestScore = score
            mergeA = a
            mergeB = b
          }
        }
      }
      const source = globals[mergeB]
      const target = globals[mergeA]
      const totalWeight = target.weight + source.weight
      for (let index = 0; index < target.vector.length; index += 1) {
        target.vector[index] = (target.vector[index] * target.weight + source.vector[index] * source.weight) / totalWeight
      }
      target.weight = totalWeight
      globals.splice(mergeB, 1)
      for (const segment of segments) {
        if (segment.speaker === mergeB) segment.speaker = mergeA
        else if (segment.speaker > mergeB) segment.speaker -= 1
      }
    }

    segments.sort((a, b) => a.start - b.start || a.end - b.end)
    emit({
      type: 'result',
      segments,
      speakerCount: globals.length,
      duration,
    })
  } catch (error) {
    fail(String(error && error.stack ? error.stack : error))
  }
}

main()
