"""Rebuild hosted media from the five verified owner-supplied originals."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
records = json.loads((root / 'research/video-library-2026-11-27/manifest.json').read_text())
for record in records:
    source = args.source_dir / record['name']
    if hashlib.sha256(source.read_bytes()).hexdigest() != record['sha256']:
        raise ValueError(f"Source does not match supplied original: {record['name']}")
    target = root / 'public' / record['src'].lstrip('/')
    target.parent.mkdir(parents=True, exist_ok=True)
    command = ['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-map', '0:v:0', '-map', '0:a:0', '-c', 'copy', '-map_metadata', '-1']
    if record['kind'] == 'hls':
        command += ['-hls_time', '10', '-hls_playlist_type', 'vod', '-hls_segment_type', 'fmp4', '-hls_fmp4_init_filename', 'init.mp4', '-hls_segment_filename', str(target.parent / 'segment-%03d.m4s')]
    else:
        command += ['-movflags', '+faststart']
    subprocess.run(command + [str(target)], check=True)
    for width in [320, 640]:
        poster = root / 'public' / record['poster'].lstrip('/').replace('-640.webp', f'-{width}.webp')
        poster.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(min(5, record['duration']/4)), '-i', str(source), '-frames:v', '1', '-vf', f'scale={width}:-2', '-c:v', 'libwebp', '-quality', '86', '-threads', '1', str(poster)], check=True)
    for asset in target.parent.iterdir():
        if asset.stat().st_size >= 25 * 1024 * 1024:
            raise ValueError(f'Asset exceeds Pages per-file limit: {asset}')
    print(record['slug'])
