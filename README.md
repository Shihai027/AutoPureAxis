# 说话人轴工作室 / Speaker axis studio

DeepSeek Harness 插件：输入一段视频或音频，识别其中的语音片段与说话人，输出一个**按说话人区分样式**的 ASS 打轴文件。

它**不转写台词，也不翻译**。每个 ASS 事件只有时间、说话人样式和可自定义的占位文字（默认 `说话人 1` 等），适合后续填入人工听写、翻译或台本。

![说话人分色时间轴预览](docs/preview.png)

## 安装

### 从 GitHub 克隆后安装到 Harness

```bash
git clone https://github.com/Shihai027/AutoPureAxis.git
cd AutoPureAxis
npm install --omit=dev
```

然后在 DeepSeek Harness 的「插件」设置里，把克隆后的目录作为本地 bundle 安装。插件会作为当前 profile 的本地 bundle 生效。

### 只使用 CLI

```bash
git clone https://github.com/Shihai027/AutoPureAxis.git
cd AutoPureAxis
npm install
node bin/speaker-axis.mjs --help
```

## 使用方式

### 在 Web 界面中使用

1. 在任意会话的输入框左侧点击「打轴」按钮。
2. 拖入或选择视频/音频文件。
3. 选择说话人数（推荐已知人数时直接指定；未知时用「自动识别」）、样式和位置。
4. 点击「开始打轴」。
5. 完成后可以：
   - 直接下载 `.ass`；
   - 修改每位说话人的显示名称与配色预设，再重新生成；
   - 复制输出路径。

处理过程中会显示：

- 当前阶段（提取音轨 / 模型准备 / 识别说话人 / 生成 ASS）；
- 当前正在处理到的时间位置，例如 `已处理 8:42 / 27:36`；
- 当前分块的媒体区间（如 `8:00–9:30`）和预计剩余时间；
- 一条已经识别出的片段预览轴，随着处理进度增长。

长音频会按约 90 秒切块处理，每完成一块就更新一次真实媒体位置；说话人编号通过声纹嵌入跨块对齐，不会因为分块而重新编号。

输出会写入当前会话工作区的 `speaker-axis-output/` 目录，例如：

```text
<workspace>/speaker-axis-output/<原文件名>.speaker.ass
```

### 让 Agent 调用

工具名：`speaker_axis`

```json
{
  "path": "C:/path/to/video.mp4",
  "speakerCount": 4,
  "stylePreset": "neon",
  "placeholder": "{name}",
  "position": "bottom",
  "maxSegmentSeconds": 8,
  "labels": ["主持人", "嘉宾 A"]
}
```

输出写到源文件所在目录的 `speaker-axis-output/` 下。

### 独立 CLI（可移植核心）

核心不依赖 DSH、Cordis 或 Web UI。同一个引擎可以脱离 Harness 单独运行：

```bash
node bin/speaker-axis.mjs input.mp4 \
  --speakers 4 \
  --style neon \
  --position alternate \
  --labels "主持人,嘉宾 A,嘉宾 B,旁白" \
  --out output.speaker.ass
```

也可以作为普通 npm bin 使用：

```bash
speaker-axis input.mp4 --speakers 0
```

CLI 输出的 `stdout` 是最终 JSON 摘要，`stderr` 是实时进度；适合被 Python、FFmpeg 工作流、Premiere/DaVinci 脚本或其他编辑器调用。移植时只需要：

1. 一个 `ffmpeg` / `ffprobe`；
2. Node.js 22+ 和对应平台的 `sherpa-onnx-node`；
3. 两个 ONNX 模型（首次运行自动下载）。

因此适配层很小：DSH 只是其中一种 Host；CLI、HTTP API、其他桌面壳都复用同一套 `extract → diarize → normalize → renderAss` 核心。

也可以直接使用导出的核心：

```js
import {
  ensureModels,
  probeDuration,
  extractAudio,
  runDiarization,
  mergeAndSplitSegments,
  buildSpeakers,
  renderAss,
} from '@local/dsh-speaker-axis/core'
```

`core.js` 不依赖 Cordis、DSH 或 Web UI。

## 样式与占位文字

- 预设：`neon`（霓虹分色）、`candy`（柔光粉彩）、`broadcast`（大字底框）、`mono`（黑白极简）。
- 位置：`bottom`、`top`、`alternate`（按说话人上下交替）。
- 占位文字模板支持：
  - `{name}`：说话人名称；
  - `{index}`：`S1`、`S2` 等样式编号；
  - `{time}`：事件开始时间。
- 模板留空即生成「不可见」的纯时间轴事件。

## 技术实现

- `ffmpeg` / `ffprobe`：提取 16 kHz 单声道音轨和读取时长。
- `sherpa-onnx`：离线说话人分割（pyannote segmentation 3.0 转换模型）、CAM++ 声纹嵌入和聚类。
- `diarize.cjs`：在独立 Node 进程中运行原生推理，避免阻塞 Harness 主进程。
- `index.js`：提供 HTTP 接口（上传、进度、重新渲染、下载）和 `speaker_axis` Agent 工具。
- `client.js`：输入框入口、上传/设置/进度/说话人改名/时间轴预览界面。

## 模型与离线运行

模型在首次处理时自动下载到：

```text
%DSH_HOME%\speaker-axis\models
```

约 34 MB，之后完全离线运行。模型来源与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

如果所在网络无法访问 GitHub，可手动把以下文件放到上述目录：

- `sherpa-onnx-pyannote-segmentation-3-0/model.onnx`
- `campplus_zh_en.onnx`

## 运行要求

- `ffmpeg` 和 `ffprobe` 在 `PATH` 中（或设置 `FFMPEG_PATH` / `FFPROBE_PATH`）。
- 插件依赖 `sherpa-onnx-node`，安装插件时会一并安装。
- 独立 Node.js 运行时优先使用 DSH 自带的 `dsh-runtimes`；也可通过 `SPEAKER_AXIS_NODE_PATH` 指定 `node.exe`。
- 可选环境变量：`FFMPEG_PATH`、`FFPROBE_PATH`、`SPEAKER_AXIS_MAX_UPLOAD_BYTES`（默认 4 GB）、`SPEAKER_AXIS_MAX_SECONDS`（默认 5 小时）、`SPEAKER_AXIS_DATA_DIR`（模型缓存目录）、`SPEAKER_AXIS_CHUNK_SECONDS`（进度分块大小，默认 90 秒）。

## 已知限制

- 说话人识别是声学聚类，不是身份识别；它只能区分「第 1 位、第 2 位……」，不能知道真实姓名或职务。角色名可在生成后修改。
- 自动人数在噪声、背景音乐、多人抢话时可能偏差；已知人数时直接指定更稳。
- 重叠说话、音乐、变声、电话音质会降低分离质量。
- 没有 ASR，因此不能按句子切分；长独白会按「单条最长」参数切分。

## 文件

- `index.js`：Host 插件、HTTP API、Agent 工具、ASS 渲染。
- `client.js`：Web UI。
- `diarize.cjs`：离线说话人分离 worker。
- `cordis.patch.yml`：插件行。
- `locale/`：插件标题与描述。
- `icon.svg`：插件图标。
