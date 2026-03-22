# Windows and macOS Installation

To support the necessary Bluetooth APIs leveraged within NUXBT, installation within a Virtual Machine (VM) is necessary. To install on Windows or macOS using a VM, please follow the instructions below.

This guide assumes the recommended `VirtualBox + Vagrant` workflow and an external USB Bluetooth dongle.

## Prerequisites

Before continuing, please ensure you have the following:

- A **USB** Bluetooth Adapter
    - Internal Bluetooth adapters are incompatible (generally) with the process that allows a VM to use external resources.
- VirtualBox v6 or above
    - If you don't have this, you can install VirtualBox [here](https://www.virtualbox.org/wiki/Downloads)
- VirtualBox Extension Pack
    - The Extension Pack should be available to download on the [same page as VirtualBox.](https://www.virtualbox.org/wiki/Downloads)
- Vagrant
    - Available to download [here](https://www.vagrantup.com/downloads)
- Python 3

Additionally, please ensure that VBoxManage (a CLI that ships with VirtualBox) is available on your system path. Eg: A help message should be displayed if `VBoxManage` is entered into Terminal (macOS) or Command Prompt (Windows). If you don't see a help message, please add VirtualBox's installation directory to your system path.

## Installation

1. Clone the NUXBT repo to a location of your choosing:

    ```bash
    git clone https://github.com/hannahbee91/nuxbt
    ```

2. Navigate inside the cloned directory and run the Vagrant setup tool.

    ```bash
    cd nuxbt
    python3 vagrant_setup.py
    ```

3. Follow the tool's directions and choose the USB Bluetooth adapter you would like to use with NUXBT. Additionally, you'll be able to choose between intalling NUXBT from PyPi or from the cloned repository. Installing NUXBT from the cloned repository allows for use of development version (as well as editing NUXBT itself)

4. Once the Vagrant setup tool is finished, you should see a file called `Vagrantfile` located in the same directory as the setup tool. You should now be able to boot the VM with the following command:

    ```bash
    vagrant up
    ```

5. After the VM has fully completed its setup, you can SSH into the terminal. Please note that your terminal's current working directory must be in the same directory at the Vagrantfile you generated earlier.

    ```bash
    # SSHing into the VM
    vagrant ssh
    ```

6. Unplug the USB Bluetooth adapter from your machine and plug it back in. The allows for VirtualBox to properly claim and forward to the USB into the Vagrant VM.

7. Inside the VirtualBox, check that your Bluetooth Adapter is available with `lsusb`:

    ```bash
    > lsusb
    # Something like the following will be printed
    # if your USB Bluetooth adapter is available:
    Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
    Bus 002 Device 002: ID 0a5c:21e9 Broadcom Corp. BCM20702A0 Bluetooth 4.0
    Bus 002 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
    ```

    Next, use `bluetoothctl` to test if Bluetooth is functional with the adapter:

    ```bash
    > sudo bluetoothctl
    # bluetoothctl should print something like below
    # if the adapter is functional
    Agent registered
    [CHG] Controller XX:XX:XX:XX:XX:XX Pairable: yes
    # You can additionally run the `show` command in
    # bluetoothctl to list your adapters stats as a final check
    > [bluetooth]# show
    Controller XX:XX:XX:XX:XX:XX (public)
        Name: ubuntu2010.localdomain
        ...
    ```

    If you're not able to see your adapter within the VM or the adapter isn't functional, please refer to the troubleshooting section below.

8. If the above checks pass, NUXBT should be functional within your VM. You can run NUXBT commands as normal while SSHed into the VM:

    ```bash
    # Check BlueZ plugin status
    nuxbt check
    
    # Start the webapp
    nuxbt webapp --ip 0.0.0.0 --port 8000
    ```

9. Open the webapp from the host machine:

    ```bash
    http://192.168.56.10:8000
    ```

    If controller creation succeeds, the dashboard should show:

    - `Detected Adapters`: adapters BlueZ sees inside the VM
    - `Host USB Devices`: optional host-side USB list, if the host USB bridge is running

10. On macOS, if you want the webapp to show the host USB device list as well, run the helper on the host:

    ```bash
    python3 scripts/host_usb_bridge.py
    ```

    This exposes `http://127.0.0.1:8765/api/usb-host`, which the webapp will query directly from the browser.

11. Finally, Vagrant exposes the following other commands to halt the VM and completely destroy it:

    ```bash
    # Stop the VM but don't destroy it
    vagrant halt
    # Completely destroy the VM
    vagrant destroy
    ```

## Troubleshooting

### My USB Bluetooth adapter won't show up inside the VM

First, halt your VM (`vagrant halt`) and unplug your adapter. Next, restart the VM (`vagrant up`) and SSH into it (`vagrant ssh`). Plug the Bluetooth adapter in and check if it's listed with `lsusb`. If the adapter still isn't listed, unplug the adapter again and manually add a USB passthrough with the VirtualBox application. Instructions on this can be found [here](https://help.ubuntu.com/community/VirtualBox/USB) under the "For persistent device connection to VM" section.

You can also confirm on the host side that VirtualBox has claimed the dongle:

```bash
VBoxManage list usbhost
```

Look for the Bluetooth dongle with `Current State: Captured`.

### My adapter appears but Bluetooth isn't functional

Typically, restarting the VM resolves the issue. Make sure you unplug the adapter and plug it back in when the VM has fully booted (AKA when it's possible to SSH into it).

Also verify:

```bash
bluetoothctl list
hciconfig -a
nuxbt check
```

If `bluetoothctl list` does not show a controller, BlueZ still does not have a usable adapter even if `lsusb` can see the USB device.

### The webapp only shows one adapter

The `Detected Adapters` panel lists Bluetooth adapters exposed by BlueZ inside the VM, not every USB device attached to the host. If only one adapter is shown, BlueZ currently only has one usable controller, which is normal when a single USB Bluetooth dongle is attached.

If you need multiple controller instances at once, attach additional USB Bluetooth dongles to the VM.

### The webapp is blank or white

This usually means the browser cached an older `index.html` that points at a no longer existing JavaScript bundle.

Try:

```bash
http://192.168.56.10:8000/?v=1
```

Or force reload the page:

- macOS Chrome: `Cmd + Shift + R`
- Chrome DevTools: `Empty Cache and Hard Reload`

If the page still renders blank, open DevTools and check for `404` requests under `/static/dist/assets/`.
