"""Generate the two bundled cues using official VOICEVOX CORE 0.17.0.

See docs/AUDIO.md for setup, attribution and redistribution conditions.
Run with VOICEVOX_CORE_DIR pointing to the downloader output.
"""

import io
import json
import os
import wave
from dataclasses import asdict
from pathlib import Path

# On older Windows installations, point this to an installed, current MSVC runtime.
# Loading it is process-local; no system DLLs are replaced.
if os.environ.get("VOICEVOX_MSVC_DIR"):
    import ctypes

    runtime = Path(os.environ["VOICEVOX_MSVC_DIR"])
    for dll in ("vcruntime140.dll", "vcruntime140_1.dll", "msvcp140.dll"):
        if (runtime / dll).exists():
            ctypes.WinDLL(str(runtime / dll))

from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile

root = Path(__file__).resolve().parents[1]
core = Path(os.environ["VOICEVOX_CORE_DIR"])
out = root / "public/audio"
out.mkdir(parents=True, exist_ok=True)
synth = Synthesizer(
    Onnxruntime.load_once(filename=str(core / "onnxruntime/lib/voicevox_onnxruntime.dll")),
    OpenJtalk(str(core / "dict/open_jtalk_dic_utf_8-1.11")),
    acceleration_mode="CPU",
    cpu_num_threads=2,
)
with VoiceModelFile.open(str(core / "models/vvms/0.vvm")) as model:
    synth.load_voice_model(model)

import numpy as np

report = []
for name, text, speed, pitch, intonation in [
    ("inai-inai", "いない、いなーい。", 0.92, 0.035, 1.18),
    ("baa", "ばあー！", 1.12, 0.055, 1.3),
]:
    query = synth.create_audio_query(text, 0)  # 四国めたん・あまあま
    query.speed_scale = speed
    query.pitch_scale = pitch
    query.intonation_scale = intonation
    query.pre_phoneme_length = 0.015
    query.post_phoneme_length = 0.08
    query.output_sampling_rate = 24000
    (root / "docs" / f"{name}.query.json").write_text(
        json.dumps(asdict(query), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    wav = synth.synthesis(query, 0)
    with wave.open(io.BytesIO(wav), "rb") as source:
        samples = np.frombuffer(source.readframes(source.getnframes()), dtype="<i2").astype(float)
    # Trim silence, retaining a short lead-in and consonant detail.
    active = np.flatnonzero(np.abs(samples) > 100)
    samples = samples[max(0, active[0] - 240): min(len(samples), active[-1] + 1920)]
    samples *= (32767 * 0.72) / max(1, np.max(np.abs(samples)))
    fade = min(120, len(samples) // 2)
    samples[:fade] *= np.linspace(0, 1, fade)
    samples[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(str(out / f"{name}.wav"), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(24000)
        target.writeframes(samples.astype("<i2").tobytes())
    report.append({"file": f"{name}.wav", "text": text, "duration": len(samples) / 24000})
print(json.dumps(report, ensure_ascii=False, indent=2))
