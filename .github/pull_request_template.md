name: "🚀 Pull Request: [PR 제목]"
description: "새로운 기능 추가 또는 기존 기능 개선"
labels: ["pull request", "enhancement"]
assignees:
  - ""

body:
  - type: textarea
    attributes:
      label: 📄 PR 설명
      description: |
        - 이 PR에서 해결하는 내용을 간략히 설명해주세요.
        - 관련된 이슈가 있다면 함께 적어주세요.
        - 예) "이 PR은 #12 이슈를 해결합니다."
    validations:
      required: true

  - type: textarea
    attributes:
      label: 🔍 변경 사항
      description: |
        - 코드에서 어떤 변경이 있었는지 설명해주세요.
        - 새로운 기능 추가, 버그 수정, 성능 최적화 등 주요 변경 사항을 서술해주세요.
        - 예) "1. 새로운 API 엔드포인트 추가, 2. UI 변경, 3. DB 모델 업데이트"
    validations:
      required: true

  - type: textarea
    attributes:
      label: 🛠 테스트 방법
      description: |
        - 해당 PR을 테스트하는 방법을 설명해주세요.
        - 로컬 환경에서의 실행 방법, 테스트 케이스, 확인해야 할 시나리오 등을 포함해주세요.
        - 예) "1. 로컬에서 서버 실행, 2. API 호출 테스트, 3. UI 확인"
    validations:
      required: true

  - type: textarea
    attributes:
      label: 🚀 기대 효과
      description: |
        - 이 변경이 적용되었을 때 기대되는 효과를 설명해주세요.
        - 예) "UI 개선으로 사용자 접근성이 증가할 것으로 기대됩니다."
    validations:
      required: true

  - type: textarea
    attributes:
      label: 📝 관련 문서 및 참고 자료 (선택)
      description: |
        - 참고할 문서, 디자인 파일, API 문서, 관련 이슈 링크 등을 첨부해주세요.
        - 예) "Figma 디자인 링크", "관련 API 문서 링크"

  - type: textarea
    attributes:
      label: ⚠️ 기타 사항
      description: |
        - 코드 리뷰 시 추가로 고려해야 할 점이나 협업이 필요한 부분이 있다면 작성해주세요.
        - 예) "이 부분에 대한 추가 논의가 필요합니다."
    validations:
      required: false