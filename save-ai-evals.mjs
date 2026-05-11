import { initializeApp } from 'firebase/app'
import { getFirestore, doc, updateDoc } from 'firebase/firestore/lite'

const app = initializeApp({
  apiKey: "AIzaSyCBpgDMWtyImucD9PcI-pVlsfUYcDxY38o",
  projectId: "vibecoding02",
})
const db = getFirestore(app)

const evaluations = {
  // 구서아 — 2일 5일 자동화 (의류CU 상품 본부)
  'TJldemD34BUrZ1ltQmzU': `[AI 평가] 2026-04-13
⚠️ UI/UX: 배포 URL 미제출 — 현재 기획 단계, 아직 개발 전
⚠️ 목적 부합: 월 2일·5일 반복 소싱 업무 자동화 컨셉 — 실무 효율화 방향 명확
💡 기술 수준: 구현 전 단계 (소싱팀 협업 TEST 예정)
✅ 바이브코딩: Claude Code 구독 중 — 개발 착수 시 빠른 구현 기대
📊 종합 ★★☆☆☆ — 기획 단계로 평가 제한적. 과정 중 구현 및 URL 제출 시 재평가 예정`,
}

for (const [id, aiMemo] of Object.entries(evaluations)) {
  try {
    await updateDoc(doc(db, 'entries', id), { aiMemo })
    console.log(`✅ 저장 완료: ${id}`)
  } catch (e) {
    console.error(`❌ 실패: ${id}`, e.message)
  }
}
console.log('완료!')
