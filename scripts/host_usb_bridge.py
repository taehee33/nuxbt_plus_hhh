#!/usr/bin/env python3
import json
import re
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


HOST = "127.0.0.1"
PORT = 8765


def list_host_usb_devices():
    try:
        result = subprocess.run(
            ["VBoxManage", "list", "usbhost"],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return {
            "devices": [],
            "error": "VBoxManage was not found on the host.",
        }
    except Exception as exc:
        return {"devices": [], "error": str(exc)}

    if result.returncode != 0:
        stderr = result.stderr.strip() or result.stdout.strip() or "Failed to enumerate host USB devices."
        return {"devices": [], "error": stderr}

    devices = []
    current = {}
    field_map = {
        "UUID": "uuid",
        "VendorId": "vendor_id",
        "ProductId": "product_id",
        "Manufacturer": "manufacturer_name",
        "Product": "product_name",
        "Current State": "current_state",
    }

    for raw_line in result.stdout.splitlines():
        line = raw_line.rstrip()
        if not line:
            if current:
                devices.append(current)
                current = {}
            continue

        if ":" not in line:
            continue

        key, value = line.split(":", 1)
        mapped_key = field_map.get(key.strip())
        if mapped_key is None:
            continue

        clean_value = value.strip()
        if mapped_key in {"vendor_id", "product_id"}:
            match = re.search(r"0x([0-9a-fA-F]+)", clean_value)
            current[mapped_key] = match.group(1).lower() if match else clean_value
        else:
            current[mapped_key] = clean_value

    if current:
        devices.append(current)

    return {"devices": devices, "error": None}


class HostUsbBridgeHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        if self.path != "/api/usb-host":
            self._send_json(404, {"devices": [], "error": "Not found"})
            return

        self._send_json(200, list_host_usb_devices())

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), HostUsbBridgeHandler)
    print(f"Host USB bridge listening on http://{HOST}:{PORT}")
    server.serve_forever()
