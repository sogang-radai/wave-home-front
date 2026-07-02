// 실제 네트워크 왕복을 흉내내기 위한 지연. real 클래스와 동일한 async 시그니처를 유지하는 목적.
export function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
