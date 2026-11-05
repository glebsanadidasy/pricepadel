#!/bin/bash
# Keeps the overnight catalogue run going on its own: restarts it after a crash, resumes where it stopped.
# Start (keeps the Mac awake while it runs; independent of any terminal or editor session):
#   nohup caffeinate -ims scripts/overnight/run.sh >/dev/null 2>&1 &
# Stop:  kill "$(cat .overnight/run.pid)"   (progress is kept; start again to continue)
cd "$(dirname "$0")/../.." || exit 1
mkdir -p .overnight
echo $$ > .overnight/run.pid
while true; do
  node scripts/overnight/overnight.mjs >> .overnight/overnight.log 2>&1
  code=$?
  if [ "$code" -eq 0 ]; then echo "$(date -u +%FT%TZ) runner finished" >> .overnight/overnight.log; break; fi
  if [ "$code" -eq 3 ]; then echo "$(date -u +%FT%TZ) runner stopped (blocked twice)" >> .overnight/overnight.log; break; fi
  echo "$(date -u +%FT%TZ) runner crashed (exit $code); restarting in 60 s" >> .overnight/overnight.log
  sleep 60
done
rm -f .overnight/run.pid
