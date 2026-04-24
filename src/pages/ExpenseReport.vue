<template>
  <div class="page-container">

    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="page-title">📋 제일개발㈜ 수시이체 지출결의서</h1>
    </div>

    <!-- 필터 섹션 -->
    <div class="control-section">
      <div class="filter-group">
        <div class="filter-item">
          <label class="form-label">연도</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedYear" @change="loadData" class="custom-select">
              <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item">
          <label class="form-label">월</label>
          <div class="custom-select-wrapper">
            <select v-model="selectedMonth" @change="loadData" class="custom-select">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-item filter-btns">
          <button @click="openAddModal" class="btn-custom btn-primary">➕ 항목 추가</button>
          <button @click="exportExcel" :disabled="items.length === 0" class="btn-custom btn-success">
            📥 엑셀 다운로드
          </button>
        </div>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon" style="background:#fef3c7"><span style="font-size:1.5rem">💰</span></div>
        <div class="stat-content">
          <div class="stat-label">월 합계 금액</div>
          <div class="stat-value">{{ formatNumber(monthTotal) }}원</div>
          <div class="stat-sub">{{ items.length }}건</div>
        </div>
      </div>
      <div class="stat-card" v-for="(ds, idx) in dateSummaries" :key="idx">
        <div class="stat-icon" style="background:#dbeafe"><span style="font-size:1.5rem">📅</span></div>
        <div class="stat-content">
          <div class="stat-label">{{ ds.date }} 소계</div>
          <div class="stat-value">{{ formatNumber(ds.total) }}원</div>
          <div class="stat-sub">{{ ds.count }}건</div>
        </div>
      </div>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <div style="font-size:2.5rem;margin-bottom:.75rem">📋</div>
        {{ selectedYear }}년 {{ selectedMonth }}월 지출결의 내역이 없습니다
      </div>

      <div v-else class="table-wrapper">
        <table class="support-table">
          <thead>
            <tr>
              <th>순</th>
              <th>전표일자</th>
              <th>입금은행</th>
              <th>입금 계좌번호</th>
              <th>입금액 (원)</th>
              <th>예상 예금주</th>
              <th>품목</th>
              <th>입금상태</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in flatRows"
              :key="row.key"
              :class="{
                'subtotal-row': row.type === 'subtotal',
                'total-row':    row.type === 'total'
              }"
            >
              <!-- 데이터 행 -->
              <template v-if="row.type === 'data'">
                <td>{{ row.idx + 1 }}</td>
                <td class="date-val-cell">{{ formatDate(row.item.transferDate) }}</td>
                <td><span class="bank-badge" :class="'bank-' + getBankClass(row.item.bank)">{{ row.item.bank }}</span></td>
                <td class="acct-cell">{{ row.item.accountNumber || '-' }}</td>
                <td class="number-cell highlight">{{ formatNumber(row.item.amount) }}</td>
                <td>{{ row.item.recipient || '-' }}</td>
                <td v-if="row.idx === 0" :rowspan="row.groupSize" class="date-cell">
                  {{ formatGroupDate(row.item.transferDate) }}
                </td>
                <td class="note-cell">
                  <span v-if="row.item.note" class="note-badge" :class="getNoteClass(row.item.note)">
                    {{ row.item.note }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(row.item.paymentStatus)">
                    {{ row.item.paymentStatus || '입금필요' }}
                  </span>
                </td>
                <td>
                  <button @click="openEditModal(row.item)" class="btn-icon">✏️</button>
                  <button @click="confirmDelete(row.item)" class="btn-icon">🗑️</button>
                </td>
              </template>

              <!-- 일계 행 -->
              <template v-else-if="row.type === 'subtotal'">
                <td colspan="4" class="subtotal-label">{{ row.date }} 소계</td>
                <td class="number-cell"><strong>{{ formatNumber(row.subtotal) }}</strong></td>
                <td colspan="5"></td>
              </template>

              <!-- 총계 행 -->
              <template v-else-if="row.type === 'total'">
                <td colspan="4" class="total-label">총계</td>
                <td class="total-value">{{ formatNumber(monthTotal) }}</td>
                <td colspan="5"></td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 입력/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>📋 {{ modal.itemId ? '항목 수정' : '항목 추가' }}</h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">전표일자 *</label>
            <input type="date" v-model="modal.transferDate" class="custom-input" />
          </div>

          <div class="mb-3 two-col">
            <div>
              <label class="form-label">입금은행 *</label>
              <div class="custom-select-wrapper">
                <select v-model="modal.bank" class="custom-select">
                  <option value="">선택하세요</option>
                  <option v-for="b in bankOptions" :key="b" :value="b">{{ b }}</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
            <div>
              <label class="form-label">입금 계좌번호</label>
              <input type="text" v-model="modal.accountNumber" placeholder="계좌번호" class="custom-input" />
            </div>
          </div>

          <div class="mb-3 two-col">
            <div>
              <label class="form-label">입금액 (원) *</label>
              <input type="number" v-model.number="modal.amount" placeholder="0" class="custom-input" min="0" />
            </div>
            <div>
              <label class="form-label">예상 예금주</label>
              <input type="text" v-model="modal.recipient" placeholder="예금주명" class="custom-input" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">품목 *</label>
            <input type="text" v-model="modal.itemName" placeholder="지출 항목 내용을 입력하세요" class="custom-input" />
          </div>

          <div class="mb-3 two-col">
            <div>
              <label class="form-label">비고</label>
              <div class="custom-select-wrapper">
                <select v-model="modal.note" class="custom-select">
                  <option value="">없음</option>
                  <option value="계산서">계산서</option>
                  <option value="지출증빙">지출증빙</option>
                  <option value="영수증">영수증</option>
                  <option value="카드">카드</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
            <div>
              <label class="form-label">입금상태 *</label>
              <div class="custom-select-wrapper">
                <select v-model="modal.paymentStatus" class="custom-select">
                  <option value="입금필요">입금필요</option>
                  <option value="입금완료">입금완료</option>
                  <option value="자동입금">자동입금</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="modal.itemId" @click="deleteFromModal" class="btn-custom btn-danger">🗑️ 삭제</button>
          <button @click="closeModal" class="btn-custom btn-secondary">취소</button>
          <button @click="saveModal" class="btn-custom btn-save">💾 저장</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const selectedYear  = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const items   = ref([])
const loading = ref(false)
const showModal = ref(false)
const modal     = ref({})

const bankOptions = ['농협', '국민', '신한', '하나', '우리', '기업', '카카오', '토스', '우체국', '새마을', '부산', '경남', '기타']

// ── computed ──────────────────────────────────────────────────────────────────

const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

const monthTotal = computed(() =>
  items.value.reduce((s, i) => s + (i.amount || 0), 0)
)

// 이체일별 그룹핑 (순서 유지 LinkedHashMap 역할)
const groupedItems = computed(() => {
  const map = {}
  items.value.forEach(item => {
    const key = String(item.transferDate).replace(/-/g, '.')
    if (!map[key]) map[key] = []
    map[key].push(item)
  })
  return map
})

const dateSummaries = computed(() =>
  Object.entries(groupedItems.value).map(([date, group]) => ({
    date,
    total: group.reduce((s, i) => s + (i.amount || 0), 0),
    count: group.length,
  }))
)

// template v-for 중첩 제거용 flat 배열
const flatRows = computed(() => {
  const rows = []
  Object.entries(groupedItems.value).forEach(([date, group]) => {
    group.forEach((item, idx) => {
      rows.push({
        key:       `data-${item.itemId}`,
        type:      'data',
        idx,
        groupSize: group.length,
        item,
      })
    })
    rows.push({
      key:      `sub-${date}`,
      type:     'subtotal',
      date:     formatGroupDate(date),
      subtotal: group.reduce((s, i) => s + (i.amount || 0), 0),
    })
  })
  rows.push({ key: 'total', type: 'total' })
  return rows
})

// ── helpers ──────────────────────────────────────────────────────────────────

const formatNumber    = (num) => (num || 0).toLocaleString('ko-KR')
const formatDate      = (d)   => String(d).replace(/-/g, '.').slice(0, 10)
const formatGroupDate = (d)   => {
  const s = String(d).replace(/\./g, '-').slice(0, 10)
  const dt = new Date(s)
  if (isNaN(dt)) return d
  return `${String(dt.getMonth() + 1).padStart(2, '0')}월 ${String(dt.getDate()).padStart(2, '0')}일`
}

const getBankClass = (bank) => {
  const map = { '농협': 'nh', '국민': 'kb', '신한': 'shin', '하나': 'hana',
                '우리': 'uri', '카카오': 'kakao', '기업': 'ibk', '토스': 'toss' }
  return map[bank] || 'etc'
}

const getNoteClass = (note) => {
  if (!note) return ''
  if (note.includes('계산서'))  return 'note-tax'
  if (note.includes('지출증빙')) return 'note-proof'
  if (note.includes('카드'))    return 'note-card'
  return 'note-etc'
}

const getStatusClass = (status) => {
  if (status === '자동입금') return 'status-auto'
  if (status === '입금완료') return 'status-done'
  return 'status-need'  // 입금필요 (기본)
}

// ── modal ────────────────────────────────────────────────────────────────────

const openAddModal = () => {
  const today = new Date()
  modal.value = {
    itemId:        null,
    transferDate:  `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    bank:          '',
    accountNumber: '',
    amount:        '',
    recipient:     '',
    itemName:      '',
    note:          '',
    paymentStatus: '입금필요',
  }
  showModal.value = true
}

const openEditModal = (item) => {
  modal.value = {
    ...item,
    transferDate: String(item.transferDate).replace(/\./g, '-').slice(0, 10),
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modal.value = {}
}

const saveModal = async () => {
  if (!modal.value.transferDate)             { alert('전표일자를 선택해주세요');  return }
  if (!modal.value.bank)                     { alert('입금은행을 선택해주세요');  return }
  if (!modal.value.amount || modal.value.amount <= 0) { alert('입금액을 입력해주세요'); return }
  if (!modal.value.itemName?.trim())         { alert('품목을 입력해주세요');     return }
  try {
    await api.post('/expense/save', {
      ...modal.value,
      year:  selectedYear.value,
      month: selectedMonth.value,
    })
    await loadData()
    closeModal()
  } catch (e) {
    console.error('저장 오류:', e)
    alert('저장 중 오류가 발생했습니다: ' + e.message)
  }
}

const confirmDelete = async (item) => {
  if (!confirm(`「${item.itemName}」 항목을 삭제하시겠습니까?`)) return
  await doDelete(item.itemId)
}

const deleteFromModal = async () => {
  if (!confirm(`「${modal.value.itemName}」 항목을 삭제하시겠습니까?`)) return
  await doDelete(modal.value.itemId)
  closeModal()
}

const doDelete = async (itemId) => {
  try {
    await api.post('/expense/delete', { itemId })
    await loadData()
  } catch (e) {
    console.error('삭제 오류:', e)
    alert('삭제 중 오류가 발생했습니다: ' + e.message)
  }
}

// ── 엑셀 다운로드 ────────────────────────────────────────────────────────────

const exportExcel = async () => {
  try {
    const res = await api.post(
      '/expense/export/excel',
      { year: selectedYear.value, month: selectedMonth.value },
      { responseType: 'blob' }
    )
    // 인터셉터가 response.data를 바로 반환하면 res 자체가 Blob
    // 그렇지 않으면 res.data가 Blob
    const blobData = res instanceof Blob ? res : (res.data instanceof Blob ? res.data : new Blob([res.data ?? res]))
    const blob = new Blob([blobData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = `지출결의서_${selectedYear.value}년_${selectedMonth.value}월.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('엑셀 오류:', e)
    alert('엑셀 다운로드 실패: ' + e.message)
  }
}

// ── data load ────────────────────────────────────────────────────────────────

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.post('/expense/list', {
      year:  selectedYear.value,
      month: selectedMonth.value,
    })
    items.value = res.data || res
  } catch (e) {
    console.error('조회 오류:', e)
    alert('데이터를 불러오는 중 오류가 발생했습니다')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
.page-header    { margin-bottom: .75rem; }
.page-title     { font-size: 1.3rem; font-weight: 700; color: #ffffff; margin: 0; }

/* ── 컨트롤 섹션 ─────────────────────────────────────────── */
.control-section {
  padding: 1.5rem; background: white; border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-bottom: .75rem;
}
.filter-group  { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
.filter-item   { flex: 1; min-width: 140px; }
.filter-btns   { display: flex; gap: .5rem; min-width: 280px; }

.form-label { font-size: .875rem; font-weight: 600; color: #64748b; margin-bottom: .5rem; display: block; }

.custom-select-wrapper { position: relative; }
.custom-select {
  width: 100%; font-size: .9375rem; border: 1px solid #e2e8f0;
  border-radius: .5rem; background: white; color: #334155;
  appearance: none; cursor: pointer; padding: .5rem 2rem .5rem .75rem;
}
.custom-select:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.select-arrow { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #64748b; font-size: .75rem; }

.custom-input {
  width: 100%; padding: .5rem .75rem; font-size: .9375rem;
  border: 1px solid #e2e8f0; border-radius: .5rem; background: white;
  color: #334155; box-sizing: border-box;
}
.custom-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }

.btn-custom    { padding: .625rem 1.25rem; font-size: .875rem; font-weight: 600; border: none; border-radius: .5rem; cursor: pointer; transition: all .2s; white-space: nowrap; }
.btn-primary   { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,.4); }
.btn-success   { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,.4); }
.btn-success:disabled { opacity: .4; cursor: default; }
.btn-save      { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,.4); }
.btn-secondary { background: #e2e8f0; color: #64748b; }
.btn-danger    { background: #ef4444; color: white; }
.btn-icon      { background: none; border: none; cursor: pointer; padding: .25rem; font-size: 1rem; transition: transform .2s; }
.btn-icon:hover { transform: scale(1.2); }

/* ── 통계 카드 ───────────────────────────────────────────── */
.stats-section {
  display: flex; gap: .75rem; margin-bottom: .75rem;
  flex-wrap: wrap;
}
.stat-card  { background: white; border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); display: flex; align-items: center; gap: .75rem; min-width: 180px; flex: 1; }
.stat-icon  { width: 50px; height: 50px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-content { flex: 1; }
.stat-label { font-size: .75rem; color: #64748b; margin-bottom: .25rem; }
.stat-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
.stat-sub   { font-size: .8rem; color: #94a3b8; margin-top: .25rem; }

/* ── 테이블 섹션 ─────────────────────────────────────────── */
.table-section { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.loading-state, .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
.spinner { width: 40px; height: 40px; margin: 0 auto 1rem; border: 4px solid #f1f5f9; border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrapper   { overflow-x: auto; }
.support-table   { width: 100%; border-collapse: collapse; font-size: .875rem; }

.support-table thead th {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e; font-weight: 700; padding: .75rem .5rem;
  text-align: center; border: 1px solid #e2e8f0; white-space: nowrap;
}
.support-table tbody td { padding: .6rem .5rem; border: 1px solid #e2e8f0; text-align: center; }

.date-val-cell { color: #475569; font-size: .8rem; }
.acct-cell     { font-family: monospace; font-size: .8rem; color: #4a6a8a; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.number-cell   { font-weight: 600; color: #1e293b; }
.highlight     { color: #92400e; font-size: 1rem; font-weight: 700; }
.date-cell     { font-weight: 700; color: #1e293b; vertical-align: middle; background: #f8fafc; white-space: nowrap; font-size: .85rem; }
.note-cell     { min-width: 70px; }

/* 은행 배지 */
.bank-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .75rem; font-weight: 700; }
.bank-nh    { background: #e8f5e9; color: #2e7d32; }
.bank-kb    { background: #fff3e0; color: #e65100; }
.bank-shin  { background: #e3f2fd; color: #1565c0; }
.bank-hana  { background: #e8eaf6; color: #283593; }
.bank-uri   { background: #fce4ec; color: #880e4f; }
.bank-kakao { background: #fffde7; color: #827717; }
.bank-ibk   { background: #e0f7fa; color: #00695c; }
.bank-toss  { background: #ede7f6; color: #4527a0; }
.bank-etc   { background: #f5f5f5; color: #424242; }

/* 비고 배지 */
.note-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: .75rem; font-weight: 600; }
.note-tax   { background: #fff3cd; color: #856404; }
.note-proof { background: #d1ecf1; color: #0c5460; }
.note-card  { background: #f8d7da; color: #721c24; }
.note-etc   { background: #e2e3e5; color: #383d41; }

/* 입금상태 배지 */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; white-space: nowrap; }
.status-auto  { background: #dbeafe; color: #1d4ed8; }   /* 자동입금 - 파랑 */
.status-done  { background: #d1fae5; color: #065f46; }   /* 입금완료 - 초록 */
.status-need  { background: #fee2e2; color: #991b1b; }   /* 입금필요 - 빨강 */

/* 일계 / 총계 행 */
.subtotal-row td  { background: #f1f5f9; }
.subtotal-label   { font-weight: 700; color: #475569; text-align: center; }
.total-row td     { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.total-label      { font-weight: 700; color: #92400e; font-size: 1rem; text-align: center; }
.total-value      { font-weight: 700; color: #dc2626; font-size: 1.05rem; }

/* ── 모달 ────────────────────────────────────────────────── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: white; border-radius: 1rem; width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); }
.modal-header  { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.modal-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.1rem; }
.close-btn     { background: none; border: none; cursor: pointer; padding: .5rem; border-radius: .5rem; color: #64748b; font-size: 1.25rem; }
.close-btn:hover { background: #f1f5f9; }
.modal-body    { padding: 1.5rem; }
.modal-footer  { padding: 1.25rem 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap; }
.mb-3          { margin-bottom: 1rem; }
.two-col       { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
</style>