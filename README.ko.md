# ParallelText

[English](README.en.md) | [中文](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

심플하고 오픈 소스인 [이중 언어 대조 번역 확장 프로그램](https://github.com/xiaochenstarboys/paralleltext)입니다.

## 라이선스 및 출처

이 프로젝트는 [fishjar](https://github.com/fishjar)의 [kiss-translator](https://github.com/fishjar/kiss-translator)를 기반으로 한 2차 창작물이며, 업스트림 라이선스에 따라 [GNU General Public License v3.0](LICENSE)으로 공개합니다. 전문은 `LICENSE` 파일을 참조하세요. 원저작자의 오픈소스 기여에 감사드립니다.

이 저장소는 업스트림에서 파생된 확장 프로그램 핵심 코드만 공개하며, 자체 웹사이트·멤버십·결제 서비스 등은 공개 범위에 포함되지 않습니다.

## 특징

- [x] 심플함 유지
- [x] 오픈 소스
- [x] 주요 브라우저 지원
  - [x] Chrome/Edge
  - [x] Firefox
- [x] 다양한 번역 서비스 지원
  - [x] Google
  - [x] DeepSeek/Qwen/OpenAI
  - [x] 사용자 정의 API
- [x] 일반적인 번역 시나리오 지원
  - [x] 웹 페이지 이중 언어 대조 번역
  - [x] 입력창 번역
    - 단축키로 입력 중인 텍스트 즉시 번역
  - [x] 선택 번역
    - [x] 어떤 페이지에서든 번역 상자를 열어 여러 번역 서비스를 전환하며 사용
    - [x] 영어 사전
    - [x] 단어 즐겨찾기
  - [x] 마우스 호버 번역
- [x] 다양한 번역 효과
  - [x] 자동 텍스트 인식 및 수동 규칙 두 가지 모드
    - 자동 인식 모드로 대부분의 사이트를 규칙 없이 완전 번역
    - 수동 규칙 모드로 특정 사이트 최적화
  - [x] 문장별 컬러 대조 읽기(원문과 번역문을 같은 색으로)
  - [x] 번역문 스타일 사용자 지정
  - [x] 리치 텍스트 번역(링크 및 텍스트 스타일 유지)
  - [x] 번역문만 표시(원문 숨기기)
- [x] 번역 API 고급 기능
  - [x] 사용자 정의 API로 이론상 모든 번역 API 지원
  - [x] 번역 텍스트 집계 일괄 전송
  - [x] 스트리밍 전송 실시간 표시
  - [x] 사용자 정의 AI 용어 사전
  - [x] 모든 API에서 Hook 및 사용자 정의 매개변수 지원
- [x] 기기 간 데이터 동기화
  - [x] 계정으로 즐겨찾기·단어장·번역 기록 클라우드 동기화
- [x] 사용자 정의 번역 규칙
  - [x] 규칙 구독
  - [x] 사용자 정의 전문 용어

## 설치

- 공식 사이트에서 다운로드: [https://www.braintiktok.com](https://www.braintiktok.com)
- Chrome / Edge / Firefox 확장 스토어에 순차적으로 출시 예정

## 관련 프로젝트

- 커뮤니티 구독 규칙: [https://github.com/fishjar/kiss-rules](https://github.com/fishjar/kiss-rules)
  - 커뮤니티가 관리하는 구독 규칙 목록(본 프로젝트는 공개 데이터 소스를 사용하며 규칙 형식 호환).

## 자주 묻는 질문 (FAQ)

### 단축키는 어떻게 설정하나요?

플러그인 관리 페이지에서 설정합니다. 예: 

- chrome [chrome://extensions/shortcuts](chrome://extensions/shortcuts)
- firefox [about:addons](about:addons)

### 규칙 설정의 우선순위는 어떻게 되나요?

개인 규칙 > 구독 규칙 > 전역 규칙

그중 전역 규칙은 우선순위가 가장 낮지만, 예비 규칙으로서 매우 중요합니다.

### 인터페이스 (Ollama 등) 테스트 실패

일반적으로 인터페이스 테스트 실패는 다음과 같은 몇 가지 원인이 있습니다:

- 주소를 잘못 입력한 경우:
  - 예를 들어 `Ollama`는 네이티브 인터페이스 주소와 `Openai` 호환 주소가 있습니다. 본 플러그인은 현재 `Openai` 호환 주소를 통일되게 지원하며, `Ollama` 네이티브 인터페이스 주소는 지원하지 않습니다.
- 일부 AI 모델이 통합 번역을 지원하지 않는 경우:
  - 이 경우 사용자 정의 인터페이스(Hook)로 개별 적용할 수 있습니다. 자세한 내용은 [사용자 정의 인터페이스 예시 문서](custom-api_v2.md)를 참조하세요.
- 서버의 크로스 도메인 접근 제한으로 403 오류가 반환되는 경우:
  - 예를 들어 `Ollama` 시작 시 환경 변수 `OLLAMA_ORIGINS=*`를 추가해야 합니다.

### 사용자 정의 인터페이스의 hook 함수는 어떻게 설정하나요?

사용자 정의 인터페이스 기능은 매우 강력하고 유연하며, 이론적으로 어떤 번역 인터페이스든 연결할 수 있습니다.

예시 참고: [custom-api_v2.md](custom-api_v2.md)

## 향후 계획 

 이 프로젝트는 여가 개발로 엄격한 일정이 없으며, 커뮤니티 참여를 환영합니다. 초기 구상:

- [x] **텍스트 집계 전송**: 요청 전략을 최적화하여 API 호출 횟수 감소.
- [x] **리치 텍스트 번역 강화**: 복잡한 페이지 구조와 리치 텍스트의 정확한 번역.
- [x] **사용자 정의/AI API 강화**: 스트리밍 전송 등 고급 AI 기능.
- [ ] **규칙 공동 구축 메커니즘 강화**: 더 유연한 규칙 공유, 버전 관리 및 커뮤니티 검토.

 관심 있는 방향이 있다면 이 저장소의 [Issues](https://github.com/xiaochenstarboys/paralleltext/issues)에서 논의하거나 PR을 보내 주세요!

## 개발 가이드

```sh
git clone https://github.com/xiaochenstarboys/paralleltext.git
cd paralleltext
pnpm install       # pnpm 9 필요 (.pnpm-version 참조)
pnpm build:chrome  # Chrome 확장 빌드；Firefox는 pnpm build:firefox
```

### 외부 트리거 예시

```js
// `toggle_translate`   번역 전환
// `toggle_styles`      스타일 전환
// `toggle_popup`       제어 패널 열기/닫기
// `toggle_transbox`    번역 팝업 열기/닫기
// `toggle_hover_node`  마우스를 올린 문단 번역
// `input_translate`    입력창 번역
window.dispatchEvent(new CustomEvent("kiss_translator", {detail: { action: "toggle_translate" }}));
```

## 커뮤니티

- 공식 사이트: [https://www.braintiktok.com](https://www.braintiktok.com)
- 문의: 공식 사이트의 '고객 지원 센터'에서 티켓을 제출해 주세요
