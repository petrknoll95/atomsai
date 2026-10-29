"""Build the dialogue and full-timeline speaker envelopes from ElevenLabs takes.

Usage: python3 scripts/build-pyai-audio.py /path/to/takes
Input: script.json plus turn-0.mp3 … turn-5.mp3. Requires ffmpeg.
"""
import array
import json
import math
import pathlib
import subprocess
import sys

source = pathlib.Path(sys.argv[1])
root = pathlib.Path(__file__).resolve().parents[1]
rate = 44100
turns = json.loads((source / 'script.json').read_text())
mix = array.array('f')
channels = [array.array('f'), array.array('f')]
gap = array.array('f', [0]) * round(rate * .22)
for i, turn in enumerate(turns):
    raw = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(source / f'turn-{i}.mp3'),
        '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ar', str(rate), '-ac', '1', '-f', 'f32le', '-',
    ])
    samples = array.array('f', raw)
    # Trim only outer silence; keep breaths and pauses within the utterance.
    window = 441
    audible = [j for j in range(0, len(samples), window)
               if math.sqrt(sum(x*x for x in samples[j:j+window]) / window) > .003]
    if not audible:
        raise ValueError(f'Turn {i} is silent')
    samples = samples[max(0, audible[0] - round(rate*.05)):
                      min(len(samples), audible[-1] + window + round(rate*.08))]
    turn['start'] = round(len(mix) / rate, 4)
    mix.extend(samples)
    turn['end'] = round(len(mix) / rate, 4)
    for speaker, channel in enumerate(channels):
        channel.extend(samples if turn['speaker'] == speaker else array.array('f', [0])*len(samples))
    if i < len(turns)-1:
        mix.extend(gap)
        for channel in channels:
            channel.extend(gap)

duration = len(mix) / rate
speakers = []
for channel in channels:
    bins = [channel[round(i*len(channel)/106):round((i+1)*len(channel)/106)] for i in range(106)]
    rms = [math.sqrt(sum(x*x for x in chunk)/len(chunk)) for chunk in bins]
    peak = max(rms)
    speakers.append({'duration': round(duration, 4),
                     'heights': [round(3 + 37*(value/peak)**.65, 2) for value in rms]})
asset = root / 'public/assets/pyai/conversation.mp3'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(rate), '-ac', '1',
                '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '96k', str(asset)],
               input=mix.tobytes(), check=True)
(root / 'src/components/home/voice-audio.json').write_text(json.dumps({
    'src': '/assets/pyai/conversation.mp3', 'duration': round(duration, 4),
    'turns': turns, 'speakers': speakers,
}, indent=2) + '\n')
print(f'Built {duration:.2f}s dialogue with synchronized 106-bin speaker envelopes')
