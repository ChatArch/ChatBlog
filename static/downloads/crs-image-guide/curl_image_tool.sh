#!/usr/bin/env bash
# Pure curl HTTP request; jq/base64 only decode the returned image.
set -euo pipefail
: "${CRS_API_KEY:?Set CRS_API_KEY to your CRS caller API key first}"
: "${CRS_API_BASE:?Set CRS_API_BASE to your HTTPS CRS OpenAI-compatible base}"
REQUEST_JSON="${1:?Usage: bash curl_image_tool.sh request.json output.png}"
OUTPUT="${2:-quicksort.png}"
RESPONSE="${OUTPUT%.png}.sse"
[[ -f "$REQUEST_JSON" ]] || { printf 'Request JSON does not exist\n' >&2; exit 2; }
[[ ! -e "$OUTPUT" && ! -e "$RESPONSE" ]] || { printf 'Choose a fresh output name\n' >&2; exit 2; }
mkdir -p "$(dirname "$OUTPUT")"
# Send the header on stdin, so the actual key does not enter curl argv.
printf '%s: %s %s\n' Authorization Bearer "$CRS_API_KEY" |
  curl --fail-with-body --silent --show-error \
    --connect-timeout 10 --max-time 300 \
    --header @- --header 'Content-Type: application/json' --header 'Accept: text/event-stream' --data-binary "@$REQUEST_JSON" \
    "$CRS_API_BASE/responses" --output "$RESPONSE"

jq -rRn '
  [inputs | select(startswith("data: ")) | .[6:] | fromjson?] as $events
  | if any($events[];
           .type == "error" or .type == "response.failed"
           or .type == "response.incomplete")
       or ([$events[] | select(.type == "response.completed")
            | .response.status] | last) != "completed"
    then error("No successfully completed response")
    else
      [$events[]
       | if .type == "response.output_item.done" then .item
         elif .type == "response.completed" then .response.output[]?
         else empty end
       | select(.type == "image_generation_call")
       | .result | select(type == "string" and length > 0)]
      | last // error("No final image in the stream")
    end
' "$RESPONSE" | base64 --decode > "$OUTPUT"
[[ -s "$OUTPUT" ]]
printf 'Image saved to %s\n' "$OUTPUT"
