<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🏦 계좌번호 관리</h1>
    </div>

    <!-- 카테고리 탭 -->
    <div class="category-tabs">
      <button
        v-for="cat in CATEGORIES" :key="cat.code"
        class="cat-tab"
        :class="{ active: selectedCat === cat.code }"
        :style="selectedCat === cat.code
          ? { background: cat.color, borderColor: cat.color, color: '#fff' }
          : { borderColor: cat.color, color: cat.color }"
        @click="selectedCat = cat.code"
      >
        {{ cat.icon }} {{ cat.label }}
        <span class="tab-count">{{ accountsByCategory(cat.code).length }}</span>
      </button>
    </div>

    <!-- 카테고리별 계좌 카드 -->
    <div class="table-section">
      <div class="section-header">
        <h3 class="section-title">{{ currentCategory.icon }} {{ currentCategory.label }}</h3>
        <button @click="openAddModal" class="btn-add">➕ 계좌 추가</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div><p>불러오는 중...</p>
      </div>
      <div v-else-if="accountsByCategory(selectedCat).length === 0" class="empty-state">
        <div class="empty-icon">🏦</div>
        <p>등록된 계좌가 없습니다</p>
        <button @click="openAddModal" class="btn-add-empty">계좌 추가하기</button>
      </div>
      <div v-else class="account-grid">
        <div
          v-for="acc in accountsByCategory(selectedCat)" :key="acc.accountId"
          class="account-card"
          :style="{ '--cat-color': currentCategory.color, '--cat-light': currentCategory.light }"
        >
          <div class="acc-top">
            <div class="acc-alias">{{ acc.alias || '계좌' }}</div>
            <div class="acc-actions">
              <button @click="openEditModal(acc)" class="btn-icon">✏️</button>
              <button @click="confirmDelete(acc)" class="btn-icon">🗑️</button>
            </div>
          </div>
          <div class="acc-holder">👤 {{ acc.holderName }}</div>
          <div class="acc-number-wrap">
            <span class="acc-number">{{ acc.accountNumber }}</span>
            <button @click="copyAccount(acc)" class="btn-copy" :class="{ copied: copiedId === acc.accountId }">
              {{ copiedId === acc.accountId ? '✓ 복사됨' : '📋 복사' }}
            </button>
          </div>
          <div class="acc-date">등록일 {{ acc.createdAt }}</div>
        </div>
      </div>
    </div>

    <!-- 전체 계좌 테이블 -->
    <div class="table-section" style="margin-top:.75rem">
      <div class="section-header">
        <h3 class="section-title">📋 전체 계좌 목록</h3>
        <input v-model="searchKeyword" class="search-input" placeholder="🔍 예금주 · 별칭 검색" />
      </div>
      <div class="table-wrapper">
        <table class="account-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>별칭</th>
              <th>예금주</th>
              <th>계좌번호</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="cat in CATEGORIES">
              <tr v-for="acc in filteredAccounts(cat.code)" :key="cat.code + '_' + acc.accountId" class="table-row">
                <td>
                  <span class="table-cat-badge" :style="{ background: cat.light, color: cat.color }">
                    {{ cat.icon }} {{ cat.label }}
                  </span>
                </td>
                <td class="td-alias">{{ acc.alias || '-' }}</td>
                <td class="td-holder">{{ acc.holderName }}</td>
                <td class="td-accnum">
                  <span class="monospace">{{ acc.accountNumber }}</span>
                  <button @click="copyAccount(acc)" class="btn-copy-sm" :class="{ copied: copiedId === acc.accountId }">
                    {{ copiedId === acc.accountId ? '✓' : '📋' }}
                  </button>
                </td>
                <td class="td-date">{{ acc.createdAt }}</td>
                <td class="td-actions">
                  <button @click="openEditModal(acc)" class="btn-icon">✏️</button>
                  <button @click="confirmDelete(acc)" class="btn-icon">🗑️</button>
                </td>
              </tr>
            </template>
            <tr v-if="totalFiltered === 0">
              <td colspan="6" class="empty-state" style="padding:2rem">검색 결과가 없습니다</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 입력/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>🏦 {{ modal.isEdit ? '계좌 수정' : '계좌 추가' }}</h5>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">

          <div class="form-group">
            <label class="form-label">계좌 구분 *</label>
            <div class="cat-select-group">
              <button
                v-for="cat in CATEGORIES" :key="cat.code"
                class="cat-select-btn"
                :class="{ active: modal.category === cat.code }"
                :style="modal.category === cat.code
                  ? { background: cat.color, color: '#fff', borderColor: cat.color }
                  : { borderColor: cat.color, color: cat.color }"
                @click="modal.category = cat.code"
              >
                {{ cat.icon }} {{ cat.label }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">별칭</label>
            <input v-model="modal.alias" class="custom-input"
              placeholder="예) 법인카드, 홍길동 기사님, 마을회관 등" />
          </div>

          <div class="form-group">
            <label class="form-label">예금주 *</label>
            <input v-model="modal.holderName" class="custom-input" placeholder="예금주 이름" />
          </div>

          <div class="form-group">
            <label class="form-label">계좌번호 *</label>
            <input v-model="modal.accountNumber" class="custom-input monospace-input"
              placeholder="계좌번호 입력" />
          </div>

        </div>
        <div class="modal-footer">
          <button v-if="modal.isEdit" @click="deleteFromModal" class="btn-custom btn-danger">🗑️ 삭제</button>
          <button @click="closeModal" class="btn-custom btn-secondary">취소</button>
          <button @click="saveModal" class="btn-custom btn-success">💾 저장</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const CATEGORIES = [
  { code: 'SMALL',   label: '소액 결제',      icon: '💳', color: '#2563eb', light: '#dbeafe' },
  { code: 'DRIVER',  label: '기사 개인계좌',  icon: '🚛', color: '#059669', light: '#d1fae5' },
  { code: 'VILLAGE', label: '마을 발전기금',  icon: '🏘️', color: '#7c3aed', light: '#ede9fe' },
  { code: 'SUPPLY',  label: '골재·기름 결제', icon: '⛽', color: '#d97706', light: '#fef3c7' },
]

const accounts      = ref([])
const loading       = ref(false)
const showModal     = ref(false)
const modal         = ref({})
const selectedCat   = ref('SMALL')
const copiedId      = ref(null)
const searchKeyword = ref('')

const currentCategory = computed(() => CATEGORIES.find(c => c.code === selectedCat.value))

const accountsByCategory = (code) => accounts.value.filter(a => a.category === code)

const filteredAccounts = (code) => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return accounts.value.filter(a => {
    if (a.category !== code) return false
    if (!kw) return true
    return (a.holderName || '').toLowerCase().includes(kw)
        || (a.alias || '').toLowerCase().includes(kw)
  })
}

const totalFiltered = computed(() =>
  CATEGORIES.reduce((s, c) => s + filteredAccounts(c.code).length, 0)
)

const copyAccount = async (acc) => {
  try {
    await navigator.clipboard.writeText(acc.accountNumber)
    copiedId.value = acc.accountId
    setTimeout(() => { copiedId.value = null }, 2000)
  } catch {
    alert('복사 실패: ' + acc.accountNumber)
  }
}

const openAddModal = () => {
  modal.value = { isEdit: false, category: selectedCat.value, alias: '', holderName: '', accountNumber: '' }
  showModal.value = true
}

const openEditModal = (acc) => {
  modal.value = {
    isEdit: true, accountId: acc.accountId,
    category: acc.category, alias: acc.alias || '',
    holderName: acc.holderName, accountNumber: acc.accountNumber,
  }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; modal.value = {} }

const saveModal = async () => {
  if (!modal.value.category)              { alert('구분을 선택해주세요'); return }
  if (!modal.value.holderName?.trim())    { alert('예금주를 입력해주세요'); return }
  if (!modal.value.accountNumber?.trim()) { alert('계좌번호를 입력해주세요'); return }
  try {
    const url = modal.value.isEdit ? '/account/update' : '/account/save'
    await api.post(url, {
      accountId:     modal.value.accountId || null,
      category:      modal.value.category,
      alias:         modal.value.alias?.trim() || null,
      holderName:    modal.value.holderName.trim(),
      accountNumber: modal.value.accountNumber.trim(),
    })
    await loadData()
    closeModal()
    alert('저장되었습니다')
  } catch (e) {
    alert('저장 오류: ' + e.message)
  }
}

const deleteFromModal = async () => {
  if (!confirm(`[${modal.value.alias || modal.value.holderName}] 계좌를 삭제하시겠습니까?`)) return
  try {
    await api.post('/account/delete', { accountId: modal.value.accountId })
    await loadData()
    closeModal()
  } catch (e) {
    alert('삭제 오류: ' + e.message)
  }
}

const confirmDelete = async (acc) => {
  if (!confirm(`[${acc.alias || acc.holderName}] 계좌를 삭제하시겠습니까?`)) return
  try {
    await api.post('/account/delete', { accountId: acc.accountId })
    await loadData()
  } catch (e) {
    alert('삭제 오류: ' + e.message)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.post('/account/list', {})
    accounts.value = res.data || res
  } catch (e) {
    alert('조회 오류: ' + e.message)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
.page-header    { margin-bottom: .75rem; }
.page-title     { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0; }

/* 탭 */
.category-tabs { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .75rem; }
.cat-tab {
  padding: .5rem 1.25rem; font-size: .9rem; font-weight: 700;
  border: 2px solid; border-radius: 2rem; cursor: pointer;
  background: white; transition: all .2s; display: flex; align-items: center; gap: .4rem;
}
.cat-tab:hover  { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.12); }
.tab-count { font-size: .75rem; padding: .1rem .45rem; border-radius: 999px; background: rgba(0,0,0,.1); }
.cat-tab.active .tab-count { background: rgba(255,255,255,.3); }

/* 섹션 */
.table-section  { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: .5rem; }
.section-title  { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0; }

/* 카드 */
.account-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.account-card {
  border: 1.5px solid #e2e8f0; border-radius: .875rem; padding: 1.125rem;
  border-top: 4px solid var(--cat-color); background: #fafafa; transition: all .2s;
}
.account-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); transform: translateY(-2px); }
.acc-top         { display: flex; justify-content: space-between; align-items: center; margin-bottom: .5rem; }
.acc-alias       { font-weight: 700; font-size: 1rem; color: #1e293b; }
.acc-actions     { display: flex; gap: .25rem; }
.acc-holder      { font-size: .9rem; color: #64748b; margin-bottom: .625rem; }
.acc-number-wrap { display: flex; align-items: center; gap: .5rem; background: var(--cat-light); border-radius: .5rem; padding: .5rem .75rem; margin-bottom: .5rem; }
.acc-number      { font-family: 'Courier New', monospace; font-size: 1rem; font-weight: 700; color: #1e293b; flex: 1; word-break: break-all; }
.acc-date        { font-size: .75rem; color: #94a3b8; text-align: right; }

/* 복사 버튼 */
.btn-copy { font-size: .75rem; font-weight: 600; padding: .25rem .6rem; background: white; border: 1px solid #e2e8f0; border-radius: .375rem; cursor: pointer; color: #64748b; transition: all .2s; white-space: nowrap; }
.btn-copy:hover  { background: #2563eb; color: white; border-color: #2563eb; }
.btn-copy.copied { background: #10b981; color: white; border-color: #10b981; }
.btn-copy-sm { font-size: .72rem; padding: .15rem .4rem; margin-left: .35rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: .3rem; cursor: pointer; transition: all .15s; }
.btn-copy-sm:hover  { background: #2563eb; color: white; }
.btn-copy-sm.copied { background: #10b981; color: white; }

/* 버튼 */
.btn-add { padding: .5rem 1.25rem; font-size: .875rem; font-weight: 600; background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; border: none; border-radius: .5rem; cursor: pointer; transition: all .2s; }
.btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(59,130,246,.4); }
.btn-add-empty { margin-top: .75rem; padding: .625rem 1.5rem; font-size: .9rem; font-weight: 600; background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; border: none; border-radius: .5rem; cursor: pointer; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: .25rem; transition: transform .2s; }
.btn-icon:hover { transform: scale(1.2); }

/* 검색 */
.search-input { padding: .45rem .875rem; font-size: .875rem; border: 1px solid #e2e8f0; border-radius: .5rem; width: 220px; }
.search-input:focus { outline: none; border-color: #3b82f6; }

/* 테이블 */
.table-wrapper { overflow-x: auto; }
.account-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.account-table thead th { background: linear-gradient(135deg,#1e3a5f,#203864); color: white; font-weight: 700; padding: .75rem; text-align: center; border: 1px solid #2d4e7e; white-space: nowrap; }
.account-table tbody td { padding: .625rem .75rem; border: 1px solid #e2e8f0; vertical-align: middle; }
.table-row:hover td { background: #f8fafc; }
.table-cat-badge { font-size: .78rem; font-weight: 700; padding: .25rem .625rem; border-radius: .375rem; white-space: nowrap; }
.td-alias   { font-weight: 600; color: #1e293b; }
.td-holder  { text-align: center; }
.td-accnum  { text-align: center; }
.td-date    { text-align: center; font-size: .8rem; color: #94a3b8; white-space: nowrap; }
.td-actions { text-align: center; white-space: nowrap; }
.monospace  { font-family: 'Courier New', monospace; font-weight: 600; color: #1e293b; }

/* 상태 */
.loading-state { text-align: center; padding: 3rem; color: #64748b; }
.spinner { width: 40px; height: 40px; margin: 0 auto 1rem; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
.empty-icon  { font-size: 3rem; margin-bottom: .5rem; }

/* 모달 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: white; border-radius: 1rem; width: 95%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,.15); }
.modal-header  { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.modal-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.1rem; }
.close-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #64748b; padding: .35rem; border-radius: .375rem; }
.close-btn:hover { background: #f1f5f9; }
.modal-body    { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal-footer  { padding: 1.25rem 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; border-top: 1px solid #e2e8f0; }

.form-group  { display: flex; flex-direction: column; gap: .4rem; }
.form-label  { font-size: .875rem; font-weight: 600; color: #64748b; }
.custom-input { padding: .5rem .75rem; border: 1px solid #e2e8f0; border-radius: .5rem; font-size: .9375rem; color: #334155; }
.custom-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
.monospace-input { font-family: 'Courier New', monospace; font-size: 1rem; letter-spacing: 1px; font-weight: 600; }
.cat-select-group { display: flex; flex-wrap: wrap; gap: .5rem; }
.cat-select-btn { padding: .4rem .9rem; font-size: .85rem; font-weight: 600; border: 2px solid; border-radius: .5rem; cursor: pointer; background: white; transition: all .15s; }

.btn-custom   { padding: .575rem 1.25rem; font-size: .9375rem; font-weight: 600; border: none; border-radius: .5rem; cursor: pointer; transition: all .2s; }
.btn-success  { background: linear-gradient(135deg,#10b981,#059669); color: white; }
.btn-success:hover  { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(16,185,129,.4); }
.btn-secondary { background: #e2e8f0; color: #64748b; }
.btn-secondary:hover { background: #cbd5e1; }
.btn-danger   { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
</style>