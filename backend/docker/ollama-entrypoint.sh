#!/bin/sh
set -e

echo "=== AgroCaribe Ollama Init ==="

ollama serve &
SERVER_PID=$!

echo "Waiting for Ollama API..."
MAX_ATTEMPTS=30
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if ollama list > /dev/null 2>&1; then
    echo "Ollama API ready (attempt $ATTEMPT)."
    break
  fi
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "ERROR: Ollama failed to start after ${MAX_ATTEMPTS}s"
    exit 1
  fi
  sleep 1
  ATTEMPT=$((ATTEMPT + 1))
done

if ollama list | grep -q "gemma2:2b"; then
  echo "Model gemma2:2b already cached."
else
  echo "Downloading gemma2:2b (~1.6 GB, may take a few minutes)..."
  ollama pull gemma2:2b
  echo "Model gemma2:2b ready."
fi

echo "=== Ollama ready ==="
wait $SERVER_PID
