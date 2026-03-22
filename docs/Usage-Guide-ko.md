# NUXBT 사용방법 가이드

이 문서는 `macOS + VirtualBox + Vagrant + 외장 USB 블루투스 동글` 조합을 기준으로 NUXBT를 실제로 실행하고 사용하는 방법을 단계별로 정리한 상세 가이드입니다.

## 1. 개요

NUXBT는 Nintendo Switch에 블루투스 컨트롤러로 동작하는 소프트웨어입니다.  
다만 macOS 자체 블루투스 스택으로는 NUXBT가 요구하는 `BlueZ + dbus` 환경을 직접 제공할 수 없기 때문에, macOS에서는 Linux VM 내부에서 실행해야 합니다.

권장 구조는 아래와 같습니다.

1. macOS 호스트
2. VirtualBox
3. Vagrant로 부팅한 Ubuntu VM
4. VM에 USB 블루투스 동글 패스스루
5. VM 내부 BlueZ가 어댑터를 인식
6. VM 내부에서 `nuxbt webapp` 실행
7. macOS 브라우저에서 웹 UI 접속

## 2. 준비물

필수 준비물:

1. macOS
2. VirtualBox
3. VirtualBox Extension Pack
4. Vagrant
5. Python 3
6. 외장 USB 블루투스 동글

중요:

1. 내장 블루투스는 일반적으로 VM으로 안정적으로 넘기기 어렵습니다.
2. NUXBT는 외장 USB 블루투스 동글을 권장합니다.
3. 동글이 VM에서 `Captured` 상태가 되어야 실제 사용 가능합니다.

## 3. 프로젝트 준비

프로젝트 루트로 이동합니다.

```bash
cd /Users/hantaehee/Desktop/파일/개발/닌텐도/2/nuxbt-main
```

Vagrantfile이 준비되어 있다면 바로 사용하면 됩니다.  
처음 구성할 경우:

```bash
python3 vagrant_setup.py
```

## 4. VM 부팅

```bash
vagrant up
```

부팅 후 VM 접속:

```bash
vagrant ssh
```

VM이 정상인지 기본 확인:

```bash
uname -a
python3 --version
```

## 5. USB 블루투스 동글 연결 확인

### 5.1 macOS 호스트에서 확인

호스트에서 VirtualBox가 어떤 USB 장치를 보고 있는지 확인:

```bash
VBoxManage list usbhost
```

여기서 확인할 항목:

1. `Manufacturer`
2. `Product`
3. `VendorId`
4. `ProductId`
5. `Current State`

예시:

```text
Manufacturer: Cambridge Silicon Radio, Ltd
Product: Bluetooth
VendorId: 0x0a12
ProductId: 0x0001
Current State: Captured
```

`Captured`라면 VirtualBox가 해당 동글을 VM에 넘긴 상태입니다.

### 5.2 VM 안에서 확인

VM에서 USB 장치 확인:

```bash
lsusb
```

예시:

```text
Bus 001 Device 005: ID 0a12:0001 Cambridge Silicon Radio, Ltd Bluetooth Dongle (HCI mode)
```

블루투스 컨트롤러 확인:

```bash
bluetoothctl list
hciconfig -a
```

정상 예시:

```text
Controller 00:15:83:CE:6C:29 Pro Controller [default]
```

`hciconfig`에서 `hci0`가 보여야 합니다.

## 6. NUXBT 상태 점검

BlueZ input plugin 상태 확인:

```bash
nuxbt check
```

정상 예시:

```text
NUXBT Plugin Enabled
```

문제가 있으면:

```bash
nuxbt toggle
```

주의:

1. 이 동작은 Bluetooth 설정을 바꾸므로 권한이 필요할 수 있습니다.
2. 토글 후에는 Bluetooth 서비스 재시작 또는 VM 재부팅이 필요할 수 있습니다.

## 7. 웹앱 실행

VM 안에서 웹앱 실행:

```bash
nuxbt webapp --ip 0.0.0.0 --port 8000
```

정상 로그 예시:

```text
Uvicorn running on http://0.0.0.0:8000
```

브라우저에서는 macOS 호스트에서 아래 주소로 접속:

```text
http://192.168.56.10:8000
```

캐시 문제가 의심되면:

```text
http://192.168.56.10:8000/?v=1
```

## 8. 웹 UI 구성 설명

현재 웹 UI에서 중요한 영역은 다음과 같습니다.

### 8.1 Create Pro Controller

다음 컨트롤러를 생성하는 버튼입니다.

이 버튼은 현재 선택된 블루투스 어댑터를 사용합니다.

### 8.2 Detected Adapters

이 패널은 `BlueZ가 VM 내부에서 실제 블루투스 어댑터로 인식한 목록`입니다.

표시 정보:

1. Alias
2. Address
3. Powered
4. Pairable
5. Discoverable/Hidden
6. Manufacturer
7. Product
8. USB ID
9. Recommendation
10. BlueZ path

중요:

1. 이 목록은 “주변 블루투스 기기 목록”이 아닙니다.
2. 이 목록은 “NUXBT가 실제로 사용할 수 있는 어댑터 목록”입니다.
3. 동글 하나면 보통 어댑터도 하나만 보입니다.

### 8.3 Host USB Devices

이 패널은 가능하면 macOS 호스트의 USB 장치 목록을 보여줍니다.

용도:

1. VirtualBox가 어떤 USB 장치를 보고 있는지 확인
2. 블루투스 동글이 `Captured` 상태인지 확인
3. VM 안 어댑터와 호스트 장치를 대조

## 9. macOS Host USB Bridge 사용

VM 내부 웹앱은 기본적으로 macOS 호스트의 USB 장치 목록을 직접 읽을 수 없습니다.  
그래서 host USB bridge를 별도 실행할 수 있습니다.

호스트에서 실행:

```bash
python3 scripts/host_usb_bridge.py
```

정상 실행 시:

```text
Host USB bridge listening on http://127.0.0.1:8765
```

브리지 endpoint:

```text
http://127.0.0.1:8765/api/usb-host
```

이 브리지가 켜져 있으면 웹앱은 브라우저에서 직접 호스트 USB 목록을 읽습니다.

## 10. Switch 연결 절차

Switch에서 다음 화면으로 이동합니다.

```text
Controllers > Change Grip/Order
```

이 상태에서 웹앱 사용 순서:

1. `Detected Adapters`에서 사용할 어댑터 선택
2. `Create Pro Controller` 클릭
3. 상태가 `connecting`에서 `connected`로 바뀌는지 확인
4. 연결 후 버튼 입력 테스트

연결 팁:

1. 처음 연결이면 반드시 `Change Grip/Order` 화면을 열어두는 편이 안전합니다.
2. Switch와 동글 거리가 너무 멀면 실패할 수 있습니다.
3. 동글을 다시 꽂은 직후에는 BlueZ가 안정화될 때까지 잠시 기다리는 것이 좋습니다.

## 11. TUI 사용

웹앱이 아니라 터미널 UI를 쓰고 싶다면:

```bash
nuxbt tui
```

이 경로는 브라우저/WebRTC 문제를 우회할 때 유용합니다.

## 12. 데모 실행

기본 동작 검증:

```bash
nuxbt demo
```

이 경로는 NUXBT 전체 동작이 정상인지 빠르게 확인할 때 가장 유용합니다.

## 13. 자주 겪는 문제

### 13.1 Detected Adapters에 하나만 보임

정상일 수 있습니다.

원인:

1. 현재 VM 내부 BlueZ가 인식한 어댑터가 하나뿐임
2. USB 블루투스 동글이 하나만 연결되어 있음

동시에 여러 컨트롤러를 만들고 싶다면 USB 블루투스 동글을 여러 개 연결해야 합니다.

### 13.2 Host USB Devices가 비어 있음

가능한 원인:

1. host USB bridge가 실행 중이 아님
2. 브라우저가 host bridge endpoint에 접근하지 못함
3. VM fallback만 동작 중임

먼저 호스트에서 확인:

```bash
curl http://127.0.0.1:8765/api/usb-host
```

### 13.3 화이트스크린 또는 빈 화면

대부분 프런트 정적 자산 캐시 문제입니다.

해결 순서:

1. `http://192.168.56.10:8000/?v=1`로 접속
2. `Cmd + Shift + R`
3. DevTools 열고 `Empty Cache and Hard Reload`
4. Network 탭에서 `/static/dist/assets/...js`가 `404`인지 확인

### 13.4 Create Pro Controller를 눌러도 변화 없음

확인 항목:

1. `nuxbt webapp` 로그 확인
2. `bluetoothctl list`
3. `hciconfig -a`
4. `nuxbt check`
5. Switch가 `Change Grip/Order` 화면에 있는지 확인

### 13.5 No adapters available

이 오류는 NUXBT가 실제 사용 가능한 BlueZ 어댑터를 찾지 못했다는 의미입니다.

확인 순서:

1. 호스트에서 `VBoxManage list usbhost`
2. VM에서 `lsusb`
3. VM에서 `bluetoothctl list`
4. VM에서 `hciconfig -a`
5. 필요 시 동글 재삽입
6. 필요 시 VM 재부팅

## 14. 권장 운영 순서

실사용 기준으로는 아래 순서가 가장 안정적입니다.

1. macOS에서 VirtualBox/Vagrant 준비
2. VM 부팅
3. USB 블루투스 동글 연결 또는 재연결
4. `VBoxManage list usbhost`로 `Captured` 확인
5. VM에서 `lsusb`, `bluetoothctl list`, `hciconfig -a` 확인
6. `nuxbt check`
7. `nuxbt webapp --ip 0.0.0.0 --port 8000`
8. 필요 시 `python3 scripts/host_usb_bridge.py`
9. 브라우저에서 `http://192.168.56.10:8000/?v=1`
10. Switch를 `Change Grip/Order` 화면으로 이동
11. 어댑터 선택 후 컨트롤러 생성

## 15. 관련 문서

함께 보면 좋은 문서:

1. [Windows-and-macOS-Installation.md](/Users/hantaehee/Desktop/파일/개발/닌텐도/2/nuxbt-main/docs/Windows-and-macOS-Installation.md)
2. [User-Guide-Improvements.md](/Users/hantaehee/Desktop/파일/개발/닌텐도/2/nuxbt-main/docs/User-Guide-Improvements.md)
3. [Macros.md](/Users/hantaehee/Desktop/파일/개발/닌텐도/2/nuxbt-main/docs/Macros.md)
