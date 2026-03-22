# NUXBT 개선사항 정리

이 문서는 실제 macOS + VirtualBox + Vagrant 환경에서 NUXBT를 실행하고 디버깅하면서 확인한 개선 포인트를 제품, 문서, 패키징, 운영 관점으로 정리한 문서입니다.

## 1. 목적

이 문서의 목적은 다음과 같습니다.

1. 현재 사용자 경험에서 막히는 지점을 구조적으로 정리
2. 문서 개선 우선순위를 분명히 하기
3. 웹 UI 개선 포인트를 제품 관점에서 정리
4. macOS/Windows VM 사용자에게 필요한 보조 도구 방향 제시
5. 향후 릴리스와 패키징 전략을 현실적으로 분리

## 2. 가장 큰 문제 요약

현재 macOS 사용자 관점에서 가장 큰 문제는 아래 네 가지입니다.

1. BlueZ 어댑터와 주변 블루투스 기기를 혼동하기 쉬움
2. VM 내부 어댑터 상태와 호스트 USB 캡처 상태를 한 화면에서 이해하기 어려움
3. 브라우저 정적 자산 캐시 때문에 화이트스크린이 발생해도 원인을 파악하기 어려움
4. Linux용 패키징 스크립트와 macOS 사용 경로가 섞여 있어 배포 기대치가 혼란스러움

## 3. 제품 UI 개선사항

### 3.1 Detected Adapters 패널 설명 강화

현재 패널은 의미상 올바르지만, 사용자는 종종 “근처 블루투스 기기 목록”으로 오해합니다.

개선 제안:

1. 패널 제목 아래에 짧은 설명을 항상 고정 표시
2. `BlueZ adapter list` 또는 `Bluetooth controllers available to NUXBT` 같은 보다 직접적인 문구 사용
3. 주변 기기 목록과 어댑터 목록의 차이를 툴팁으로 제공

효과:

1. 사용자 기대치 정렬
2. “왜 다른 블루투스 기기가 안 보이냐”는 혼동 감소

### 3.2 선택된 어댑터와 다음 생성 동작 연결성 강화

현재는 선택 기능이 있지만, 사용자는 “이 선택이 실제 어디에 적용되는지”를 놓치기 쉽습니다.

개선 제안:

1. `Create Pro Controller` 카드에 현재 선택된 어댑터 이름 고정 표시
2. 버튼 문구를 `Create Pro Controller with Selected Adapter`로 강화하는 옵션 검토
3. 선택된 어댑터가 없으면 버튼 비활성화 및 이유 표시

### 3.3 Host USB Devices와 Detected Adapters 자동 매칭

현재 두 패널은 정보를 따로 보여주지만, 사용자는 어느 호스트 USB 장치가 어느 BlueZ 어댑터인지 즉시 연결하기 어렵습니다.

개선 제안:

1. `vendor_id:product_id` 기준 기본 매칭
2. 가능하다면 MAC address 또는 sysfs path 기반 보강 매칭
3. 매칭 성공 시 `Mapped to /org/bluez/hci0` 같은 배지 표시

효과:

1. 호스트 동글과 VM 어댑터의 상관관계가 명확해짐
2. USB 패스스루 문제 진단이 쉬워짐

### 3.4 Host USB Devices에서 블루투스 장치 우선 표시

현재 호스트 USB 전체 목록이 보이면 정보량은 충분하지만, 사용자 목적은 거의 항상 “블루투스 동글이 잡혔는가”입니다.

개선 제안:

1. 블루투스 관련 USB 장치를 상단 고정
2. `Captured`, `Busy`, `Available` 상태를 색상 배지로 강조
3. 비블루투스 장치는 기본 collapsed 처리 고려

### 3.5 Nearby Devices 패널 분리

사용자가 기대하는 “블루투스 목록”은 사실상 주변 검색 결과인 경우가 많습니다.

개선 제안:

1. `Detected Adapters`와 별도로 `Nearby Devices` 패널 제공
2. 이 패널은 주변 스캔 결과를 보여주되 NUXBT 어댑터 선택과는 분리
3. Switch가 검색되는지 여부를 별도 진단 정보로 제공

주의:

1. 주변 검색은 어댑터 선택 로직과 다르다는 점을 UI에서 분명히 분리해야 함

## 4. 진단 및 운영 개선사항

### 4.1 호스트 USB bridge 내장 전략

현재 host USB bridge는 별도 실행 도구입니다. 기능상 유용하지만, 기본 경험에서는 끊김 없이 동작해야 합니다.

개선 제안:

1. macOS 호스트용 작은 launcher 스크립트 제공
2. 웹앱 실행 전 자동으로 host bridge까지 띄우는 helper 제공
3. 브리지 미실행 시 UI에 실행 방법을 명확히 표시

예:

```bash
python3 scripts/host_usb_bridge.py
```

### 4.2 VM 상태 점검 명령 모음 제공

사용자는 지금 여러 명령을 수동으로 조합해 확인해야 합니다.

개선 제안:

1. `scripts/check_vm_bt.sh` 같은 스크립트 추가
2. 다음 정보를 한 번에 출력
   - `lsusb`
   - `bluetoothctl list`
   - `hciconfig -a`
   - `nuxbt check`
   - `ss -ltnp | grep :8000`

효과:

1. 문제 재현과 보고가 쉬워짐
2. 문서가 단순해짐

### 4.3 브라우저 캐시 문제 완화

화이트스크린의 주요 원인 중 하나는 오래된 `index.html`이 삭제된 bundle을 가리키는 상황입니다.

개선 제안:

1. 루트 HTML에 `no-store` 캐시 방지 헤더 유지
2. 정적 자산 fingerprint 관리 일관성 점검
3. 문서에 `?v=1` cache busting 예시 유지
4. 빌드 후 배포 프로세스에서 HTML/자산 싱크 확인 추가

### 4.4 런타임 에러 표시 강화

현재 빈 화면은 사용자에게 정보가 너무 적습니다.

개선 제안:

1. 앱 초기화 실패 시 완전 빈 화면 대신 fallback error UI 표시
2. JS bundle 404 시 사용자 친화 메시지 제공
3. `Reload`, `Clear cache guidance`, `Open troubleshooting` 버튼 제공

## 5. 문서 개선사항

### 5.1 사용 가이드와 설치 가이드 분리

현재 설치 절차와 운영 절차가 한 문서 안에 몰려 있으면 사용자가 현재 어디 단계에 있는지 혼란스럽습니다.

개선 방향:

1. 설치 가이드
2. 실행/사용 가이드
3. 트러블슈팅 가이드
4. 개선사항/로드맵 문서

이번 작업에서 이미 `Usage-Guide-ko.md`와 본 문서를 분리한 이유도 여기에 있습니다.

### 5.2 macOS 실사용 예시 강화

문서에는 추상적 설명보다 “실제로 이렇게 입력하면 된다”는 예시가 중요합니다.

필수 예시:

1. `vagrant up`
2. `vagrant ssh`
3. `VBoxManage list usbhost`
4. `lsusb`
5. `bluetoothctl list`
6. `nuxbt check`
7. `nuxbt webapp --ip 0.0.0.0 --port 8000`
8. `python3 scripts/host_usb_bridge.py`

### 5.3 문제 유형별 트러블슈팅 재구성

현재 사용자는 “무엇을 기준으로 실패를 분류해야 하는지”부터 모르는 경우가 많습니다.

권장 분류:

1. USB 패스스루 문제
2. BlueZ 어댑터 인식 문제
3. NUXBT 플러그인 문제
4. 웹 UI 캐시/프런트 문제
5. Switch 연결 문제

## 6. 패키징 개선사항

### 6.1 macOS와 Linux 패키징 기대치 분리

현재 `build_deb.sh`, `build_ppa_source.sh`는 Linux 패키징 스크립트입니다.  
macOS 사용자 입장에서는 이 스크립트를 직접 실행할 수 있을 것처럼 보이면 혼란이 생깁니다.

개선 제안:

1. README에 `deb`/PPA는 Linux 전용이라고 명확히 표시
2. macOS용 산출물은 `source tarball + docs + built web assets` 기준으로 별도 설명
3. GitHub Release 자산 구성 예시를 문서화

### 6.2 릴리스 아카이브 기준 정리

macOS에서 현실적으로 만들 수 있는 릴리스 산출물:

1. 소스 tarball
2. 빌드된 웹 정적 자산 포함
3. 릴리스 노트 포함

예시:

```text
dist_release/nuxbt-macos-vm-webapp-YYYY-MM-DD.tar.gz
```

### 6.3 배포 전 검증 체크리스트 추가

릴리스 전에 최소한 아래는 자동 또는 수동 점검이 필요합니다.

1. Python 문법 검증
2. 프런트 빌드 성공
3. VM 배포본에 HTML과 정적 자산 이름이 일치하는지 확인
4. `Detected Adapters` 응답 확인
5. host USB bridge 응답 확인

## 7. 개발 생산성 개선사항

### 7.1 VM 동기화 방식 단순화

이번 작업에서 가장 번거로웠던 지점 중 하나는 VM 설치본과 로컬 소스 간 동기화였습니다.

개선 제안:

1. 배포용 sync 스크립트 추가
2. `app.py`, `templates/index.html`, `static/dist`를 한 번에 VM site-packages로 복사
3. 재시작까지 포함한 one-shot 스크립트 제공

예:

```bash
./scripts/sync_vm_webapp.sh
```

### 7.2 host bridge와 VM 웹앱 묶음 실행 스크립트

개선 제안:

1. 호스트에서 `start_macos_vm_webapp.sh`
2. 동작:
   - host USB bridge 실행
   - `vagrant up`
   - VM webapp 실행
   - 접속 URL 출력

## 8. 우선순위 제안

### 높은 우선순위

1. 웹앱 초기화 실패 시 빈 화면 방지
2. Host USB Devices와 Detected Adapters 자동 매칭
3. macOS host bridge 실행 경로 단순화
4. VM sync/restart 스크립트 제공

### 중간 우선순위

1. Nearby Devices 패널 추가
2. 블루투스 동글 우선 정렬
3. 문서의 단계별 분리 강화

### 낮은 우선순위

1. 추가 시각화 개선
2. 상태 badge 디자인 세분화
3. 고급 진단 패널 확장

## 9. 이번 작업에서 반영된 항목

이미 반영된 내용:

1. BlueZ 어댑터 목록 패널 강화
2. Manufacturer / Product / USB ID 표시
3. 어댑터 선택 기능
4. 추천 어댑터 표시
5. Host USB Devices 패널
6. macOS host USB bridge
7. 문서 보강
8. 캐시 문제 완화를 위한 HTML 캐시 방지 헤더

## 10. 관련 문서

1. [Usage-Guide-ko.md](./Usage-Guide-ko.md)
2. [Windows-and-macOS-Installation.md](./Windows-and-macOS-Installation.md)
3. [README.md](../README.md)
