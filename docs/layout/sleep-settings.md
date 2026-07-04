# 수면 설정 레이아웃 (보존용)

설정 페이지 개편으로 설정 탭에서 "수면 설정" 항목이 제거되었습니다. 다만 기존
`SleepSettings.js` 컴포넌트는 삭제하지 않고 유지하며, 향후 수면 관리 페이지로 이 UI를
옮길 때 참고할 수 있도록 레이아웃 구조를 여기에 기록합니다.

- 원본 컴포넌트: `wave-home-front/src/pages/settings/SleepSettings.js`
- 사용 API: `settingsApi.getSleepConfig()` / `updateSleepConfig()`, `getSounds()`
- 데이터 모델: `docs/api/settings.md`의 SleepConfig 및 Sounds 계약

## 섹션 구조

전체는 `.page-stack` 안에 4개의 `Card`로 구성됩니다.

```
수면 설정
├─ Card: "오늘 밤 수면 계획"
│   ├─ 취침 시간 / 기상 시간         (input[type=time] 2열 그리드)
│   ├─ 예상 수면 시간               (bedtime~wakeTime 계산 결과 표시)
│   └─ 기상음 설정                  (select, getSounds() 목록)
│
├─ Card: "에어컨 자동 온도 조절"
│   ├─ 자동 온도 조절               (toggle-switch, acAuto)
│   ├─ 목표 온도                    (Stepper 20~28℃, acTemp)
│   └─ 단계별 온도 미리보기          (입면 전 / 수면 중 / 기상 전, stat-trio)
│
├─ Card: "입면 조명 자동 조절"
│   ├─ 조명 자동 조절               (toggle-switch, lightAuto)
│   └─ lightAuto = true 일 때만:
│       ├─ 조절 시작 (취침 N분 전)   (Stepper 10~60분, step 5, dimStartMinutes)
│       ├─ 최종 밝기                (Stepper 0~30%, step 5, finalBrightness)
│       └─ 조명 타임라인             (막대 그래프 100→finalBrightness)
│
└─ Card: "단계별 기상 알람"
    └─ WakeAlarmRow × 3
        ├─ 1단계 · 조명 서서히 밝히기  (기상 30분 전, wakeLightRamp)
        ├─ 2단계 · 수면 음악/라디오    (기상 15분 전, wakeMusic)
        └─ 3단계 · TV 켜기/알람 울리기 (기상 시간, wakeTvOrAlarm)
```

## SleepConfig 필드 요약

| 필드 | 타입 | 설명 |
|------|------|------|
| `bedtime` / `wakeTime` | `HH:mm` | 취침 / 기상 시간 |
| `wakeUpSound` | string | 기상음 (Sounds id) |
| `acAuto` | boolean | 에어컨 자동 온도 조절 사용 |
| `acTemp` | number | 목표 온도 (℃) |
| `lightAuto` | boolean | 입면 조명 자동 조절 사용 |
| `dimStartMinutes` | number | 취침 몇 분 전부터 조명을 낮출지 |
| `finalBrightness` | number | 취침 시점 최종 밝기 (%) |
| `wakeLightRamp` / `wakeMusic` / `wakeTvOrAlarm` | boolean | 단계별 기상 알람 on/off |

## 재사용 컴포넌트

- `Card` (`components/ui/Card.js`)
- `Stepper` (`components/ui/Stepper.js`)
- `toggle-switch`, `stat-trio`, `light-timeline`, `wake-alarm-row` 스타일 (`pages/settings/settings.css`)
