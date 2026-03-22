#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOST_USB_BRIDGE_LOG="/tmp/nuxbt-host-usb-bridge.log"
VM_WEBAPP_LOG="/tmp/nuxbt-webapp.log"
HOST_USB_BRIDGE_URL="http://127.0.0.1:8765/api/usb-host"
WEBAPP_URL="http://192.168.56.10:8000"

print_step() {
  printf '\n[%s] %s\n' "NUXBT" "$1"
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd" >&2
    exit 1
  fi
}

ensure_host_usb_bridge() {
  if curl -fsS "$HOST_USB_BRIDGE_URL" >/dev/null 2>&1; then
    print_step "Host USB bridge already running"
    return
  fi

  print_step "Starting host USB bridge"
  nohup python3 "$ROOT_DIR/scripts/host_usb_bridge.py" >"$HOST_USB_BRIDGE_LOG" 2>&1 < /dev/null &
  sleep 2

  if ! curl -fsS "$HOST_USB_BRIDGE_URL" >/dev/null 2>&1; then
    echo "Failed to start host USB bridge. Check: $HOST_USB_BRIDGE_LOG" >&2
    exit 1
  fi
}

ensure_vm_running() {
  print_step "Booting Vagrant VM"
  (
    cd "$ROOT_DIR"
    vagrant up
  )
}

start_vm_webapp() {
  print_step "Starting NUXBT webapp in the VM"
  (
    cd "$ROOT_DIR"
    vagrant ssh -c "PIDS=\$(ps -eo pid,args | awk '\$0 ~ /^ *[0-9]+ .*\\/usr\\/local\\/bin\\/nuxbt webapp/ {print \$1}'); if [ -n \"\$PIDS\" ]; then kill \$PIDS; fi; sleep 2; nohup /usr/local/bin/nuxbt webapp --ip 0.0.0.0 --port 8000 > $VM_WEBAPP_LOG 2>&1 < /dev/null & sleep 3; sudo ss -ltnp | grep :8000 || true"
  )
}

show_next_steps() {
  cat <<EOF

[NUXBT] Setup complete

Next steps:
1. Ensure your USB Bluetooth dongle is attached to the VM.
2. On the host, check USB capture if needed:
   VBoxManage list usbhost
3. Open the web UI:
   $WEBAPP_URL
4. If the page looks blank, try:
   $WEBAPP_URL/?v=1
5. On the Switch, open:
   Controllers > Change Grip/Order

Useful commands:
- Host USB bridge test:
  curl $HOST_USB_BRIDGE_URL
- VM shell:
  cd "$ROOT_DIR" && vagrant ssh
- VM Bluetooth check:
  bluetoothctl list
  hciconfig -a
  nuxbt check
EOF
}

main() {
  require_command python3
  require_command VBoxManage
  require_command vagrant
  require_command curl

  ensure_host_usb_bridge
  ensure_vm_running
  start_vm_webapp
  show_next_steps
}

main "$@"
