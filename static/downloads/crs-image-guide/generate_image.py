"""Generate a PNG with a CRS caller key from ChatEnv, or decode a saved SSE file."""
from __future__ import annotations
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
from urllib.parse import urlsplit


def image_from_sse(text: str) -> tuple[bytes, dict]:
    encoded = None
    completed = False
    returned_model = None
    for line in text.splitlines():
        if not line.startswith('data: '):
            continue
        try:
            event = json.loads(line[6:])
        except ValueError:
            continue
        kind = event.get('type')
        if kind in {'error', 'response.failed', 'response.incomplete'}:
            raise ValueError('The response did not complete successfully')
        items = []
        if kind == 'response.output_item.done':
            items = [event.get('item', {})]
        elif kind == 'response.completed':
            response = event.get('response', {})
            completed = response.get('status') == 'completed'
            returned_model = response.get('model')
            items = response.get('output', [])
        for item in items:
            if item.get('type') == 'image_generation_call' and item.get('result'):
                encoded = item['result']
    if not completed or not encoded:
        raise ValueError('No completed image result in the saved response')
    data = base64.b64decode(encoded, validate=True)
    if len(data) < 24 or not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('The returned image is not PNG')
    width, height = struct.unpack('>II', data[16:24])
    return data, {'returned_host_model': returned_model, 'format': 'PNG', 'width': width, 'height': height, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def payload_for(prompt: str, host: str, image: str, size: str, quality: str) -> dict:
    return {
        'model': host,
        'instructions': 'Use the image_generation tool to create the requested teaching infographic. Output a real image, not code or a textual substitute.',
        'input': [{'role': 'user', 'content': [{'type': 'input_text', 'text': prompt}]}],
        'tools': [{'type': 'image_generation', 'model': image, 'action': 'generate', 'quality': quality, 'size': size, 'partial_images': 1}],
        'tool_choice': {'type': 'image_generation'}, 'stream': True, 'store': False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', default='crs')
    parser.add_argument('--host-model')
    parser.add_argument('--image-model', default='gpt-image-2')
    parser.add_argument('--size', default='1536x1024', choices=['1024x1024', '1536x1024', '1024x1536'])
    parser.add_argument('--quality', default='medium', choices=['low', 'medium', 'high', 'auto'])
    parser.add_argument('--prompt-file', type=Path, default=Path('prompt.txt'))
    parser.add_argument('--output', type=Path, default=Path('quicksort.png'))
    parser.add_argument('--timeout', type=int, default=300)
    parser.add_argument('--decode', type=Path, help='Decode an existing SSE file without making an API request')
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('Choose a fresh output filename')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.decode:
        response_path = args.decode
    else:
        from chatenv.configs import OpenAIConfig
        from chatenv.store import EnvStore
        home = Path(os.environ.get('CHATARCH_HOME') or Path.home() / '.chatarch')
        values = EnvStore(home / 'envs').load_profile(OpenAIConfig, args.profile)
        key = values.get('OPENAI_API_KEY', '')
        base = values.get('OPENAI_API_BASE', '').rstrip('/')
        if not key or not base:
            raise SystemExit('Set OPENAI_API_KEY and OPENAI_API_BASE in the selected ChatEnv profile')
        if urlsplit(base).scheme != 'https':
            raise SystemExit('Use an HTTPS CRS API base')
        host = args.host_model or values.get('OPENAI_API_MODEL')
        if not host:
            raise SystemExit('Set OPENAI_API_MODEL or pass --host-model')
        request = payload_for(args.prompt_file.read_text(encoding='utf-8'), host, args.image_model, args.size, args.quality)
        request_path = args.output.with_suffix('.request.json')
        response_path = args.output.with_suffix('.sse')
        if request_path.exists() or response_path.exists():
            raise SystemExit('Choose a fresh output basename to preserve existing request/response files')
        request_path.write_text(json.dumps(request, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        # The key is passed on stdin, not in curl argv or the request JSON.
        header = 'Authorization: Bearer ' + key + '\n'
        result = subprocess.run([
            'curl', '--fail-with-body', '--silent', '--show-error',
            '--connect-timeout', '10', '--max-time', str(args.timeout),
            '--header', '@-', '--header', 'Content-Type: application/json',
            '--header', 'Accept: text/event-stream',
            '--data-binary', '@' + str(request_path), '--output', str(response_path),
            '--write-out', '%{http_code}', base + '/responses',
        ], input=header, text=True, capture_output=True)
        if result.returncode != 0 or result.stdout.strip() != '200':
            raise SystemExit(f'HTTP {result.stdout.strip() or "unavailable"}; curl exit {result.returncode}. Response saved at {response_path}')
    data, metadata = image_from_sse(response_path.read_text(encoding='utf-8'))
    args.output.write_bytes(data)
    print(json.dumps({'output': str(args.output.resolve()), **metadata}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
