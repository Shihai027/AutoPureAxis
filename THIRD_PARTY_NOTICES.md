# Third-party notices

This plugin uses the following open-source components at runtime.

## sherpa-onnx

- Project: https://github.com/k2-fsa/sherpa-onnx
- License: Apache License 2.0
- Use: offline speaker segmentation, speaker embeddings, and clustering.

## 3D-Speaker CAM++ speaker embedding model

- Source: https://github.com/modelscope/3D-Speaker
- Model file: `3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx`
- License: Apache License 2.0
- Use: computes speaker embeddings for clustering.

## pyannote segmentation 3.0 (converted for sherpa-onnx)

- Source: https://github.com/pyannote/pyannote-audio
- Converted model: `sherpa-onnx-pyannote-segmentation-3-0`
- License: MIT
- Use: voice activity and speaker-change segmentation.

The model files are not redistributed in this package. They are downloaded on first use from the official sherpa-onnx GitHub release pages into `%DSH_HOME%/speaker-axis/models` (or the equivalent DSH home directory).
