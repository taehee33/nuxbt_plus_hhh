# GitHub Release 노트 초안

이 문서는 GitHub Release 본문에 바로 붙여 넣을 수 있도록 작성한 초안입니다.

사용 방법:

1. 아래 초안 중 하나를 선택해 GitHub Release 본문에 붙여 넣습니다.
2. 실제 태그 버전, 날짜, 포함 범위에 맞게 일부 문구만 다듬습니다.
3. 필요하면 `Known limitations`와 `Troubleshooting` 항목만 유지하고 나머지는 축약합니다.

---

## 1. 짧은 버전

```md
## 요약

이번 업데이트에서는 macOS + VirtualBox + Vagrant 환경에서 NUXBT를 더 쉽게 실행하고 진단할 수 있도록 웹 UI, 문서, 보조 스크립트를 개선했습니다.

## 주요 변경사항

- 웹 UI에 `Detected Adapters` 패널 추가
- 블루투스 어댑터의 `Manufacturer`, `Product`, `USB ID` 표시 강화
- 호스트 USB 장치 상태 확인을 위한 `Host USB Devices` 흐름 추가
- macOS 초보자용 `QUICKSTART-ko.md` 추가
- macOS 한방 실행 스크립트 `scripts/start_macos_vm_webapp.sh` 추가
- 웹앱 캐시 문제 대응 문서 보강
- GitHub Actions의 버전/릴리스 워크플로를 수동 실행 중심으로 정리

## macOS 빠른 시작

```bash
zsh scripts/start_macos_vm_webapp.sh
```

브라우저 접속 주소:

```text
http://192.168.56.10:8000
```

## 참고 문서

- `docs/QUICKSTART-ko.md`
- `docs/Usage-Guide-ko.md`
- `docs/Improvement-Notes-ko.md`
```

---

## 2. 표준 버전

```md
## 요약

이번 릴리스는 macOS + VirtualBox + Vagrant 환경에서의 사용성과 진단 흐름을 중심으로 정리한 업데이트입니다.

NUXBT를 macOS에서 직접 실행할 수는 없지만, Linux VM 내부에서 실행하는 경로를 더 명확하게 만들고, 블루투스 어댑터와 USB 패스스루 상태를 더 쉽게 확인할 수 있도록 개선했습니다.

## 주요 변경사항

### 웹 UI 개선

- `Detected Adapters` 패널 추가
- 블루투스 어댑터 상태 및 메타데이터 표시 강화
  - Alias
  - Address
  - Powered
  - Pairable
  - Discoverable / Hidden
  - Manufacturer
  - Product
  - USB ID
  - BlueZ path
- 다음 컨트롤러 생성에 사용할 어댑터 선택 기능 추가
- 추천 가능한 어댑터 표시 강화

### macOS / VM 진단 흐름 개선

- macOS 호스트 USB 장치 확인용 `host_usb_bridge.py` 추가
- 웹 UI에서 `Host USB Devices` 정보를 확인할 수 있는 흐름 추가
- VirtualBox USB 캡처 상태와 VM 내부 BlueZ 어댑터 상태를 더 쉽게 비교 가능

### 문서 개선

- `docs/QUICKSTART-ko.md` 추가
- `docs/Usage-Guide-ko.md` 보강
- `docs/Improvement-Notes-ko.md` 정리
- README에 macOS 빠른 시작 경로 및 관련 문서 링크 추가

### 실행 보조 스크립트

- `scripts/start_macos_vm_webapp.sh` 추가
- host USB bridge 시작
- `vagrant up` 실행
- VM 내부 웹앱 실행
- 접속 URL 안내까지 한 번에 처리 가능

### 운영 개선

- 웹앱 캐시 문제 완화
- GitHub Actions `bump_version` 수동 실행 전환
- GitHub Actions `release` 수동 실행 전환
- GitHub App token 의존성 제거

## macOS 빠른 시작

프로젝트 루트에서 아래 명령을 실행합니다.

```bash
zsh scripts/start_macos_vm_webapp.sh
```

브라우저 접속 주소:

```text
http://192.168.56.10:8000
```

처음 연결 시 Switch에서 다음 화면을 열어둡니다.

```text
Controllers > Change Grip/Order
```

## 포함 문서

- `docs/QUICKSTART-ko.md`
- `docs/Usage-Guide-ko.md`
- `docs/Improvement-Notes-ko.md`
- `docs/Windows-and-macOS-Installation.md`

## Known limitations

- macOS에서 NUXBT를 네이티브로 직접 실행하는 방식은 지원하지 않습니다.
- Linux VM + 외장 USB 블루투스 동글 경로를 권장합니다.
- 내장 블루투스는 VM 패스스루 환경에서 안정 경로가 아닙니다.
- 일부 문제는 WebRTC, 브라우저 캐시, USB 패스스루 상태에 영향을 받을 수 있습니다.

## Troubleshooting

문제가 있을 때는 아래 순서로 확인하는 것이 가장 빠릅니다.

1. 호스트: `VBoxManage list usbhost`
2. VM: `lsusb`
3. VM: `bluetoothctl list`
4. VM: `hciconfig -a`
5. VM: `nuxbt check`
6. 브라우저: `http://192.168.56.10:8000/?v=1`
```

---

## 3. 상세 버전

```md
## 개요

이번 릴리스는 macOS 환경에서 NUXBT를 직접 네이티브로 실행하는 방향이 아니라, `VirtualBox + Vagrant + Linux VM + USB 블루투스 동글` 구조를 더 실제 사용 가능하게 정리하는 데 초점을 맞췄습니다.

특히 다음 문제를 줄이는 데 집중했습니다.

- 어떤 블루투스 어댑터가 실제로 NUXBT에 잡혀 있는지 알기 어려운 문제
- 호스트 USB 캡처 상태와 VM 내부 BlueZ 상태를 따로 봐야 하는 문제
- 문서가 설치/실행/운영/트러블슈팅 흐름으로 분리돼 있지 않아 초보자가 막히는 문제
- 웹앱 캐시 문제로 인한 흰 화면 상황에서 원인 파악이 어려운 문제

## 주요 변경사항

### 1. 블루투스 어댑터 가시성 강화

웹 UI에 `Detected Adapters` 패널을 추가해 NUXBT가 실제로 사용할 수 있는 BlueZ 어댑터 목록을 확인할 수 있도록 했습니다.

표시 정보:
- Alias
- Address
- Powered
- Pairable
- Discoverable / Hidden
- Manufacturer
- Product
- USB ID
- BlueZ path

또한 다음 컨트롤러 생성에 사용할 어댑터를 선택할 수 있도록 했습니다.

### 2. 호스트 USB 진단 흐름 추가

macOS 호스트 USB 장치를 확인하기 위한 `scripts/host_usb_bridge.py`를 추가했습니다.

이 흐름을 통해:
- VirtualBox가 블루투스 동글을 잡았는지
- `Captured` 상태인지
- VM 내부 BlueZ 어댑터와 비교할 수 있는지
확인할 수 있습니다.

### 3. macOS 초보자용 빠른 시작 경로 추가

처음 사용하는 사용자를 위해 다음을 추가했습니다.

- `docs/QUICKSTART-ko.md`
- `scripts/start_macos_vm_webapp.sh`

이 스크립트는 다음 순서를 한 번에 처리합니다.

1. host USB bridge 확인 또는 시작
2. `vagrant up`
3. VM 내부 `nuxbt webapp --ip 0.0.0.0 --port 8000` 실행
4. 접속 URL 출력

### 4. 문서 구조 정리

다음 문서를 중심으로 문서 흐름을 정리했습니다.

- `docs/QUICKSTART-ko.md`
- `docs/Usage-Guide-ko.md`
- `docs/Improvement-Notes-ko.md`
- `docs/Windows-and-macOS-Installation.md`

각 문서는 역할을 다르게 가집니다.

- QUICKSTART: 처음 실행하는 사용자를 위한 빠른 시작
- Usage Guide: 실제 사용 절차와 점검 흐름
- Improvement Notes: 개선 배경, 공개용 문안, 내부 메모
- Installation Guide: OS별 설치 및 VM 구성 참고

### 5. 캐시 및 운영 흐름 개선

- 웹앱 캐시 문제 완화
- `?v=1` cache busting 안내 강화
- GitHub Actions의 버전/릴리스 워크플로를 수동 실행 중심으로 정리
- GitHub App token 의존성 제거

## macOS 빠른 시작

```bash
git clone https://github.com/taehee33/nuxbt_plus_hhh.git
cd nuxbt_plus_hhh
zsh scripts/start_macos_vm_webapp.sh
```

브라우저:

```text
http://192.168.56.10:8000
```

Switch:

```text
Controllers > Change Grip/Order
```

## 권장 점검 순서

문제가 생기면 아래 순서로 확인하는 것을 권장합니다.

1. `VBoxManage list usbhost`
2. `vagrant ssh`
3. `lsusb`
4. `bluetoothctl list`
5. `hciconfig -a`
6. `nuxbt check`
7. 웹 UI의 `Detected Adapters`
8. 필요 시 `Host USB Devices`

## 포함 파일 예시

- `scripts/host_usb_bridge.py`
- `scripts/start_macos_vm_webapp.sh`
- `docs/QUICKSTART-ko.md`
- `docs/Usage-Guide-ko.md`
- `docs/Improvement-Notes-ko.md`

## Known limitations

- macOS 직접 실행이 아니라 VM 기반 경로입니다.
- 외장 USB 블루투스 동글 사용을 권장합니다.
- 내장 블루투스는 안정적인 경로가 아닙니다.
- 일부 환경에서는 USB 패스스루나 WebRTC 상태에 따라 추가 점검이 필요할 수 있습니다.
```

---

## 4. 작성 팁

릴리스 노트를 실제 업로드할 때는 아래 기준으로 고르면 됩니다.

1. 짧은 공지:
   - `짧은 버전`
2. 일반 릴리스:
   - `표준 버전`
3. 변경 내용 설명이 중요한 경우:
   - `상세 버전`

가장 무난한 기본값은 `표준 버전`입니다.
