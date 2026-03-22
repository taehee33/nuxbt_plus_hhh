# NUXBT 처음 실행 QUICKSTART

이 문서는 `처음 실행하는 사람`을 기준으로 가장 짧고 실용적인 순서만 정리한 빠른 시작 가이드입니다.

더 자세한 설명이 필요하면 아래 문서를 보세요.

1. [Usage-Guide-ko.md](./Usage-Guide-ko.md)
2. [Windows-and-macOS-Installation.md](./Windows-and-macOS-Installation.md)
3. [Improvement-Notes-ko.md](./Improvement-Notes-ko.md)

## 1. 무엇을 하는 프로그램인가

NUXBT는 Nintendo Switch에 블루투스 컨트롤러처럼 연결되는 프로그램입니다.

macOS에서는 직접 실행하지 않고, `VirtualBox + Vagrant`로 띄운 Linux VM 안에서 실행합니다.

즉 구조는 다음과 같습니다.

1. macOS 호스트
2. VirtualBox
3. Ubuntu VM
4. USB 블루투스 동글을 VM에 연결
5. VM 안에서 NUXBT 실행
6. macOS 브라우저로 웹 UI 접속

## 2. 준비물

필수:

1. macOS
2. VirtualBox
3. VirtualBox Extension Pack
4. Vagrant
5. Python 3
6. 외장 USB 블루투스 동글
7. Nintendo Switch

중요:

1. 내장 블루투스는 보통 사용하지 않습니다.
2. 외장 USB 블루투스 동글이 필요합니다.

## 3. 저장소 받기

```bash
git clone https://github.com/taehee33/nuxbt_plus_hhh.git
cd nuxbt_plus_hhh
```

## 4. 가장 쉬운 실행 방법

프로젝트 루트에서 아래 명령을 실행합니다.

```bash
zsh scripts/start_macos_vm_webapp.sh
```

이 스크립트가 하는 일:

1. `VBoxManage`가 있는지 확인
2. host USB bridge 시작
3. `vagrant up`
4. VM 안에서 `nuxbt webapp --ip 0.0.0.0 --port 8000` 실행
5. 접속 주소 출력

정상적으로 끝나면 접속 주소는 보통 아래입니다.

```text
http://192.168.56.10:8000
```

## 5. USB 블루투스 동글 연결

아래 중 한 시점에는 반드시 해야 합니다.

1. 스크립트 실행 전 동글 연결
2. 스크립트 실행 후 VirtualBox가 잡지 못하면 재삽입

호스트에서 확인:

```bash
VBoxManage list usbhost
```

여기서 블루투스 동글이 보이고 `Current State: Captured`이면 좋습니다.

예시:

```text
Manufacturer: Cambridge Silicon Radio, Ltd
Product: Bluetooth
VendorId: 0x0a12
ProductId: 0x0001
Current State: Captured
```

## 6. 웹 브라우저 접속

브라우저에서 열기:

```text
http://192.168.56.10:8000
```

캐시 문제나 흰 화면이 있으면:

```text
http://192.168.56.10:8000/?v=1
```

## 7. Switch 연결 순서

Switch에서 먼저 다음 메뉴로 갑니다.

```text
Controllers > Change Grip/Order
```

그 다음 웹 UI에서:

1. `Detected Adapters` 확인
2. 어댑터가 하나면 그대로 사용
3. `Create Pro Controller` 클릭
4. 상태가 `connected`가 되는지 확인

## 8. 화면에 보이는 패널 의미

### 8.1 Detected Adapters

이건 주변 블루투스 기기 목록이 아닙니다.

이건 `VM 내부 BlueZ가 실제로 사용할 수 있는 블루투스 어댑터 목록`입니다.

블루투스 동글이 1개면 여기에도 보통 1개만 보입니다.

### 8.2 Host USB Devices

이건 macOS 호스트에서 VirtualBox가 보고 있는 USB 장치 목록입니다.

용도:

1. 블루투스 동글이 정말 잡혔는지 확인
2. `Captured` 상태인지 확인
3. VM 안 어댑터와 호스트 USB 장치를 비교

## 9. 잘 안 될 때 가장 먼저 확인할 것

### 9.1 웹이 안 열림

```text
http://192.168.56.10:8000/?v=1
```

그 다음:

1. `Cmd + Shift + R`
2. Chrome DevTools에서 `Empty Cache and Hard Reload`

### 9.2 Create Pro Controller를 눌러도 변화 없음

VM 안에서 확인:

```bash
vagrant ssh
bluetoothctl list
hciconfig -a
nuxbt check
```

정상이라면:

1. `bluetoothctl list`에 컨트롤러가 보임
2. `hciconfig -a`에 `hci0`가 보임
3. `nuxbt check`가 정상 출력

### 9.3 No adapters available

다음 순서로 봅니다.

1. 호스트: `VBoxManage list usbhost`
2. VM: `lsusb`
3. VM: `bluetoothctl list`
4. VM: `hciconfig -a`

### 9.4 어댑터가 하나만 보임

정상일 수 있습니다.

블루투스 동글 하나면 BlueZ 어댑터도 하나만 뜨는 게 일반적입니다.

## 10. 수동 실행 방법

자동 스크립트를 쓰지 않고 직접 하려면:

### 10.1 VM 부팅

```bash
vagrant up
```

### 10.2 host USB bridge 실행

```bash
python3 scripts/host_usb_bridge.py
```

### 10.3 VM 안에서 웹앱 실행

```bash
vagrant ssh
nuxbt webapp --ip 0.0.0.0 --port 8000
```

### 10.4 브라우저 접속

```text
http://192.168.56.10:8000
```

## 11. 꼭 기억할 핵심

1. macOS에서 직접 실행하는 게 아니라 VM 안에서 실행한다
2. 블루투스 동글은 VM에 패스스루되어야 한다
3. `Detected Adapters`는 NUXBT가 사용할 어댑터 목록이다
4. 처음 연결은 Switch의 `Change Grip/Order` 화면에서 하는 것이 가장 안전하다
5. 흰 화면이면 대부분 캐시 문제다
