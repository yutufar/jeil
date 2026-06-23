<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">비율 설정</h1>
      <p class="page-subtitle">골재류 수량 → 톤 변환 제수(나누는 값)를 설정합니다.</p>
    </div>

    <div class="card-section">
      <div class="card-header">
        <h4 class="card-title">골재류 제수 설정</h4>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-msg">불러오는 중...</div>
        <div v-else>
          <table class="ratio-table">
            <thead>
              <tr>
                <th>자재</th>
                <th>자재명</th>
                <th>현재 제수</th>
                <th>변경값</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.materialType">
                <td class="type-cell">{{ item.materialType }}</td>
                <td>{{ item.materialName }}</td>
                <td class="current-cell">{{ item.currentDivisor }}</td>
                <td>
                  <input
                    type="number"
                    v-model.number="item.newDivisor"
                    class="divisor-input"
                    min="1"
                    step="1"
                    placeholder="예: 1500"
                  />
                </td>
                <td>
                  <button
                    class="save-btn"
                    @click="save(item)"
                    :disabled="item.saving"
                  >
                    {{ item.saving ? '저장 중...' : '저장' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="hint-text">
            * 시멘트류(C1/C2/C3)는 고정 제수 1000을 사용합니다.
          </p>
        </div>
      </div>
    </div>

    <!-- 재고 전체 재계산 -->
    <div class="card-section rebuild-card">
      <div class="card-header">
        <h4 class="card-title">재고 전체 재계산</h4>
      </div>
      <div class="card-body">
        <div class="rebuild-notice">
          <div class="notice-icon">⚠️</div>
          <div class="notice-text">
            <strong>비율(제수)을 변경한 경우 반드시 아래 버튼을 눌러 재계산해야 합니다.</strong><br>
            재계산하지 않으면 기존에 저장된 재고 데이터의 출고량·현재고에 변경된 비율이 반영되지 않습니다.
          </div>
        </div>
        <button
          class="rebuild-btn"
          @click="rebuildStock"
          :disabled="rebuilding"
        >
          {{ rebuilding ? '재계산 중...' : '재고 전체 재계산' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api/axios'

const AGGREGATE_TYPES = [
  { materialType: 'G1', materialName: '자갈 25mm' },
  { materialType: 'S1', materialName: '샌드밀' },
  { materialType: 'S2', materialName: '자갈 19mm' },
]

export default {
  name: 'RatioSetting',
  data() {
    return {
      loading: true,
      items: [],
      rebuilding: false,
    }
  },
  async created() {
    await this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const configs = await api.post('/ratio-config/list')
        const configMap = {}
        configs.forEach(c => { configMap[c.materialType] = c.divisor })

        this.items = AGGREGATE_TYPES.map(t => ({
          materialType: t.materialType,
          materialName: t.materialName,
          currentDivisor: configMap[t.materialType] ?? 1500,
          newDivisor: configMap[t.materialType] ?? 1500,
          saving: false,
        }))
      } catch (e) {
        alert('설정을 불러오지 못했습니다.')
      } finally {
        this.loading = false
      }
    },
    async save(item) {
      if (!item.newDivisor || item.newDivisor <= 0) {
        alert('제수는 0보다 큰 값이어야 합니다.')
        return
      }
      item.saving = true
      try {
        await api.post('/ratio-config/save', {
          materialType: item.materialType,
          divisor: item.newDivisor,
        })
        item.currentDivisor = item.newDivisor
        alert(`${item.materialType} (${item.materialName}) 제수가 ${item.newDivisor}으로 저장되었습니다.\n\n아래 "재고 전체 재계산" 버튼을 눌러 기존 데이터에 반영하세요.`)
      } catch (e) {
        alert('저장에 실패했습니다.')
      } finally {
        item.saving = false
      }
    },
    async rebuildStock() {
      if (!confirm('전체 재고를 재계산합니다. 계속하시겠습니까?')) return
      this.rebuilding = true
      try {
        await api.post('/material/inventory/rebuild-stock')
        alert('재고 전체 재계산이 완료되었습니다.')
      } catch (e) {
        alert('재계산 중 오류가 발생했습니다.')
      } finally {
        this.rebuilding = false
      }
    },
  },
}
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 4px; }
.page-subtitle { color: #aaa; font-size: 0.9rem; margin: 0; }

.card-section {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}
.rebuild-card {
  border-color: rgba(255, 160, 0, 0.35);
}
.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.card-title { margin: 0; font-size: 1rem; font-weight: 600; color: #000000; }
.card-body { padding: 24px; }

.loading-msg { color: #aaa; }

.ratio-table { width: 100%; border-collapse: collapse; }
.ratio-table th, .ratio-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.ratio-table th { color: #aaa; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; }
.type-cell { font-weight: 700; color: #e14eca; }
.current-cell { font-weight: 600; color: #1d8cf8; }

.divisor-input {
  width: 110px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
}
.divisor-input:focus { border-color: #1d8cf8; }

.save-btn {
  padding: 8px 20px;
  background: #1d8cf8;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: background 0.2s;
}
.save-btn:hover:not(:disabled) { background: #1a7ae0; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.hint-text {
  margin-top: 16px;
  font-size: 0.82rem;
  color: #888;
}

.rebuild-notice {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: rgba(255, 160, 0, 0.08);
  border: 1px solid rgba(255, 160, 0, 0.3);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.notice-icon { font-size: 1.2rem; flex-shrink: 0; }
.notice-text { font-size: 0.88rem; color: #ccc; line-height: 1.7; }
.notice-text strong { color: #ffa000; }

.rebuild-btn {
  padding: 10px 28px;
  background: #ff5f5f;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 700;
  transition: background 0.2s;
}
.rebuild-btn:hover:not(:disabled) { background: #e04f4f; }
.rebuild-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
