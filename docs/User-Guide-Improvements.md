# User Guide Improvements

This document captures practical documentation gaps discovered while bringing up the macOS + VirtualBox + Vagrant workflow.

## Recommended improvements

1. Add a concrete macOS host URL example
   - The documentation should explicitly mention the host-only network address used by the bundled Vagrant workflow, for example `http://192.168.56.10:8000`.

2. Distinguish adapter lists from nearby devices
   - Users regularly interpret "Bluetooth list" as nearby discoverable devices.
   - The webapp currently shows BlueZ adapter controllers, which is the correct list for NUXBT controller creation.

3. Document the host USB passthrough verification path
   - Host side: `VBoxManage list usbhost`
   - Guest side: `lsusb`, `bluetoothctl list`, `hciconfig -a`
   - The docs should explain that `Captured` on the host and `hci0` in the guest are the decisive checks.

4. Explain why only one adapter may appear
   - One USB dongle normally maps to one BlueZ adapter.
   - Seeing only one item in `Detected Adapters` is expected when only one dongle is attached.

5. Add a browser cache troubleshooting section
   - White-screen failures are easy to misdiagnose when an old `index.html` references removed JS bundles.
   - The docs should include force reload and cache-busting examples.

6. Mention the optional host USB bridge
   - The helper `scripts/host_usb_bridge.py` is useful during macOS troubleshooting because the guest cannot directly enumerate host USB devices.

7. Clarify packaging expectations on macOS
   - `deb` and PPA packaging scripts are Linux packaging workflows.
   - On macOS, the practical releasable artifact is a source tarball or a Git-hosted change set, not a native Debian package.
