<template>
  <div class="remcon-calc">
    <div class="calc-header">
      <div class="header-icon">🏗️</div>
      <div class="header-text">
        <h1>레미콘 단가 계산기</h1>
        <p class="subtitle">제일레미콘 배합비 기준 견적 산출</p>
      </div>
      <div class="main-tabs">
        <button class="main-tab-btn" :class="{ active: mainTab === 'calc' }"   @click="mainTab = 'calc'">📐 견적 계산</button>
        <button class="main-tab-btn" :class="{ active: mainTab === 'profit' }" @click="mainTab = 'profit'">💰 수익 분석</button>
      </div>
    </div>

    <!-- ══════════════════ 탭1: 견적 계산기 ══════════════════ -->
    <div v-show="mainTab === 'calc'" class="calc-body">
      <div class="input-panel">

        <section class="input-section">
          <h2 class="section-title"><span class="step">1</span> 규격 선택</h2>
          <div class="tab-buttons">
            <button v-for="spec in specs" :key="spec.value" class="tab-btn"
              :class="{ active: selectedSpec === spec.value }" @click="selectedSpec = spec.value">
              <span class="tab-label">{{ spec.label }}</span>
              <span class="tab-desc">{{ spec.desc }}</span>
            </button>
          </div>
        </section>

        <section class="input-section">
          <h2 class="section-title"><span class="step">2</span> 배합 규격</h2>
          <div class="spec-grid">
            <div class="field">
              <label>슬럼프 (mm)</label>
              <div class="radio-group">
                <button v-for="s in slumps" :key="s" class="radio-btn"
                  :class="{ active: selectedSlump === s }" @click="selectedSlump = s">{{ s }}</button>
              </div>
            </div>
            <div class="field">
              <label>호칭강도 (MPa)</label>
              <div class="strength-groups">
                <div v-for="group in strengthGroups" :key="group.ratio" class="strength-group">
                  <span class="group-ratio">배합비 {{ group.ratio }}</span>
                  <div class="radio-group">
                    <button v-for="s in group.strengths" :key="s" class="radio-btn"
                      :class="{ active: selectedStrength === s }" @click="selectedStrength = s">{{ s }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedStrength" class="selected-info">
            <span class="info-badge">{{ selectedSpec === 'A' ? '표준' : '0.76 적용' }}</span>
            <span class="info-badge">슬럼프 {{ selectedSlump }}mm</span>
            <span class="info-badge">{{ selectedStrength }}MPa</span>
            <span class="info-badge ratio">배합비 {{ currentRatio }}</span>
          </div>
        </section>

        <section class="input-section">
          <h2 class="section-title"><span class="step">3</span> 치수 입력 <small>(단위: m)</small></h2>
          <div class="dimension-inputs">
            <div class="dim-field">
              <label>가로</label>
              <input type="number" v-model.number="width" min="0" step="0.01" placeholder="0.00" @input="clampPositive('width')" />
              <span class="unit">m</span>
            </div>
            <div class="dim-sep">×</div>
            <div class="dim-field">
              <label>세로</label>
              <input type="number" v-model.number="length" min="0" step="0.01" placeholder="0.00" @input="clampPositive('length')" />
              <span class="unit">m</span>
            </div>
            <div class="dim-sep">×</div>
            <div class="dim-field">
              <label>높이</label>
              <input type="number" v-model.number="height" min="0" step="0.01" placeholder="0.00" @input="clampPositive('height')" />
              <span class="unit">m</span>
            </div>
            <div class="dim-result">
              <label>체적</label>
              <div class="volume-display">{{ volume.toFixed(3) }}</div>
              <span class="unit">m³</span>
            </div>
          </div>
        </section>

        <section class="input-section">
          <h2 class="section-title"><span class="step">4</span> 적용 비율</h2>
          <div class="rate-input-wrap">
            <div class="rate-slider-area">
              <input type="range" v-model.number="appliedRate" min="50" max="100" step="1" class="rate-slider" />
              <div class="rate-labels"><span>50%</span><span>100%</span></div>
            </div>
            <div class="rate-number-wrap">
              <input type="number" v-model.number="appliedRate" min="1" max="100" class="rate-number" />
              <span class="rate-pct">%</span>
            </div>
          </div>
        </section>
      </div>

      <div class="result-panel">
        <div class="result-header">
          <h2>견적 결과</h2>
          <div v-if="!isReady" class="not-ready">규격과 치수를 모두 입력해주세요</div>
        </div>

        <div class="result-cards" :class="{ disabled: !isReady }">
          <div class="result-card highlight-card">
            <div class="card-label">체적 (루베)</div>
            <div class="card-value big">{{ isReady ? volume.toFixed(3) : '—' }}<span class="card-unit">m³</span></div>
          </div>
          <div class="result-card">
            <div class="card-label">기준 단가 (100%)</div>
            <div class="card-value">{{ isReady ? fmt(baseUnitPrice) : '—' }}<span class="card-unit">원/m³</span></div>
          </div>
          <div class="result-card" v-if="appliedRate !== 100">
            <div class="card-label">적용 단가 ({{ appliedRate }}%)</div>
            <div class="card-value">{{ isReady ? fmt(appliedUnitPrice) : '—' }}<span class="card-unit">원/m³</span></div>
          </div>
          <div class="divider"></div>
          <div class="result-card accent-card">
            <div class="card-label">공급가액 (부가세 제외)</div>
            <div class="card-value accent">{{ isReady ? fmt(totalExVat) : '—' }}<span class="card-unit">원</span></div>
          </div>
          <div class="result-card">
            <div class="card-label">부가세 (10%)</div>
            <div class="card-value muted">{{ isReady ? fmt(vatAmount) : '—' }}<span class="card-unit">원</span></div>
          </div>
          <div class="result-card total-card">
            <div class="card-label">합계 (부가세 포함)</div>
            <div class="card-value total">{{ isReady ? fmt(totalIncVat) : '—' }}<span class="card-unit">원</span></div>
          </div>
        </div>

        <div class="price-table-wrap" v-if="selectedSpec">
          <h3 class="table-title">단가표 — {{ currentSpecLabel }}</h3>
          <div class="price-table-scroll">
            <table class="price-table">
              <thead>
                <tr>
                  <th>슬럼프\강도</th>
                  <th v-for="s in strengths" :key="s" :class="{ 'col-active': selectedStrength === s }">{{ s }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slump in slumps" :key="slump" :class="{ 'row-active': selectedSlump === slump }">
                  <td class="row-header">{{ slump }}</td>
                  <td v-for="s in strengths" :key="s" :class="{
                    'cell-active': selectedSlump === slump && selectedStrength === s,
                    'col-active':  selectedStrength === s && selectedSlump !== slump
                  }">{{ fmt(currentTable[slump]?.[s] ?? 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════ 탭2: 수익 분석 ══════════════════ -->
    <div v-show="mainTab === 'profit'" class="calc-body">
      <div class="input-panel">

        <section class="input-section">
          <h2 class="section-title"><span class="step">1</span> 배합 규격 선택</h2>
          <div class="tab-buttons">
            <button v-for="spec in specs" :key="spec.value" class="tab-btn"
              :class="{ active: pSpec === spec.value }" @click="pSpec = spec.value; calcProfit()">
              <span class="tab-label">{{ spec.label }}</span>
              <span class="tab-desc">{{ spec.desc }}</span>
            </button>
          </div>
          <div class="field" style="margin-top:4px">
            <label>슬럼프 (mm)</label>
            <div class="radio-group">
              <button v-for="s in slumps" :key="s" class="radio-btn"
                :class="{ active: pSlump === s }" @click="pSlump = s; calcProfit()">{{ s }}</button>
            </div>
          </div>
          <div class="field">
            <label>호칭강도 (MPa)</label>
            <div class="strength-groups">
              <div v-for="group in strengthGroups" :key="group.ratio" class="strength-group">
                <span class="group-ratio">배합비 {{ group.ratio }}</span>
                <div class="radio-group">
                  <button v-for="s in group.strengths" :key="s" class="radio-btn"
                    :class="{ active: pStrength === s }" @click="pStrength = s; calcProfit()">{{ s }}</button>
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label>적용 비율 (%)</label>
            <div class="rate-input-wrap">
              <div class="rate-slider-area">
                <input type="range" v-model.number="pRate" min="50" max="100" step="1" class="rate-slider" @input="calcProfit" />
                <div class="rate-labels"><span>50%</span><span>100%</span></div>
              </div>
              <div class="rate-number-wrap">
                <input type="number" v-model.number="pRate" min="1" max="100" class="rate-number" @input="calcProfit" />
                <span class="rate-pct">%</span>
              </div>
            </div>
          </div>
          <div v-if="pStrength" class="selling-price-row">
            <div class="sp-badge">
              <span class="sp-label">기준단가 (100%)</span>
              <span class="sp-value">{{ fmt(pResult.baseUnitPrice) }}</span>
              <span class="sp-unit">원/m³</span>
            </div>
            <div class="sp-badge accent" v-if="pRate !== 100">
              <span class="sp-label">적용단가 ({{ pRate }}%)</span>
              <span class="sp-value">{{ fmt(pResult.appliedUnitPrice) }}</span>
              <span class="sp-unit">원/m³</span>
            </div>
          </div>
        </section>

        <section class="input-section">
          <h2 class="section-title" style="justify-content:space-between">
            <span style="display:flex;align-items:center;gap:10px">
              <span class="step">2</span> m³당 자재 사용량
            </span>
            <button @click="loadProfitPrices" class="refresh-btn">🔄 단가 새로고침</button>
          </h2>
          <div class="cost-list">
            <div v-for="item in profitCostItems" :key="item.materialType" class="cost-row">
              <div class="cost-info">
                <span class="mat-badge" :class="item.group">{{ item.materialType }}</span>
                <span class="mat-name">{{ item.materialName }}</span>
                <span class="mat-price">{{ fmt(item.unitPrice) }}원/{{ item.unit }}</span>
              </div>
              <div class="cost-input-wrap">
                <input type="number" step="0.001" v-model.number="item.usagePerM3" @input="calcProfit"
                  class="cost-input" :placeholder="item.defaultUsage" />
                <span class="cost-unit">{{ item.unit }}</span>
                <span class="cost-result">= {{ fmt(Math.round(item.unitPrice * (item.usagePerM3 || 0))) }}원</span>
              </div>
            </div>
            <div class="cost-row extra-row">
              <div class="cost-info">
                <span class="mat-badge etc">기타</span>
                <span class="mat-name">기타 제조원가</span>
                <span class="mat-price">직접 입력</span>
              </div>
              <div class="cost-input-wrap">
                <input type="number" v-model.number="pEtcCost" @input="calcProfit" class="cost-input" placeholder="0" />
                <span class="cost-unit">원</span>
                <span class="cost-result">= {{ fmt(pEtcCost || 0) }}원</span>
              </div>
            </div>
          </div>
          <div class="cost-total-row">
            <span>m³당 총 원가</span>
            <span class="cost-total-val">{{ fmt(pResult.totalCostPerM3) }} 원</span>
          </div>
        </section>

        <section class="input-section">
          <h2 class="section-title"><span class="step">3</span> 납품량 시뮬레이션</h2>
          <div class="dimension-inputs">
            <div class="dim-field">
              <label>납품량</label>
              <input type="number" v-model.number="pVolume" @input="calcProfit" placeholder="0" />
              <span class="unit">m³</span>
            </div>
          </div>
        </section>
      </div>

      <div class="result-panel">
        <div class="result-header">
          <h2>수익 분석 결과</h2>
          <div v-if="!pStrength" class="not-ready">배합 규격을 선택해주세요</div>
        </div>

        <div :class="{ disabled: !pStrength }">
          <div class="profit-summary-grid">
            <div class="profit-card selling">
              <div class="pc-icon">💵</div>
              <div class="pc-label">판매 단가</div>
              <div class="pc-value">{{ fmt(pResult.appliedUnitPrice) }}</div>
              <div class="pc-unit">원/m³</div>
            </div>
            <div class="profit-sep">−</div>
            <div class="profit-card cost">
              <div class="pc-icon">🏭</div>
              <div class="pc-label">m³당 원가</div>
              <div class="pc-value">{{ fmt(pResult.totalCostPerM3) }}</div>
              <div class="pc-unit">원/m³</div>
            </div>
            <div class="profit-sep">=</div>
            <div class="profit-card" :class="pResult.profitPerM3 >= 0 ? 'profit-pos' : 'profit-neg'">
              <div class="pc-icon">{{ pResult.profitPerM3 >= 0 ? '📈' : '📉' }}</div>
              <div class="pc-label">m³당 순이익</div>
              <div class="pc-value">{{ fmt(pResult.profitPerM3) }}</div>
              <div class="pc-unit">원/m³</div>
            </div>
          </div>

          <div class="margin-bar-wrap">
            <div class="margin-bar-header">
              <span class="margin-label">마진율</span>
              <span class="margin-val" :class="pResult.marginRate >= 0 ? 'positive' : 'negative'">
                {{ pResult.marginRate.toFixed(1) }}%
              </span>
            </div>
            <div class="margin-bar-bg">
              <div class="margin-bar-fill" :class="pResult.marginRate >= 0 ? 'fill-pos' : 'fill-neg'"
                :style="{ width: Math.min(Math.abs(pResult.marginRate), 100) + '%' }"></div>
            </div>
            <div class="margin-bar-desc">순이익 ÷ 판매단가</div>
          </div>

          <div class="divider"></div>

          <div class="sim-section" :class="{ disabled: !pVolume }">
            <div class="sim-header">
              <span>납품량 시뮬레이션</span>
              <span class="sim-vol">{{ fmt(pVolume || 0) }} m³</span>
            </div>
            <div class="result-card" style="margin-bottom:8px">
              <div class="card-label">부가세 포함 총 매출</div>
              <div class="card-value" style="color:#60a5fa">{{ fmt(pResult.simTotalIncVat) }}<span class="card-unit">원</span></div>
            </div>
            <div class="result-card accent-card" style="margin-bottom:8px">
              <div class="card-label">공급가액 (부가세 제외)</div>
              <div class="card-value accent">{{ fmt(pResult.simTotalExVat) }}<span class="card-unit">원</span></div>
            </div>
            <div class="result-card" style="border-color:#78350f;background:#1c100a;margin-bottom:8px">
              <div class="card-label">총 원가</div>
              <div class="card-value" style="color:#f87171">{{ fmt(pResult.simTotalCost) }}<span class="card-unit">원</span></div>
            </div>
            <div class="result-card" :class="pResult.simTotalProfit >= 0 ? 'total-card' : 'total-card-neg'">
              <div class="card-label">총 순이익 (부가세 제외 기준)</div>
              <div class="card-value" :class="pResult.simTotalProfit >= 0 ? 'total' : 'total-neg'">
                {{ fmt(pResult.simTotalProfit) }}<span class="card-unit">원</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

// ─── 단가 데이터 ──────────────────────────────────────────
const priceData = {
  A: {
    80:  { 18:126700, 21:129000, 24:133400, 27:138000, 30:145500, 33:151400, 35:154900, 40:166600, 45:174000, 50:200700 },
    120: { 18:129000, 21:131600, 24:137600, 27:142800, 30:151900, 33:156800, 35:159400, 40:170400, 45:184600, 50:204300 },
    150: { 18:131000, 21:134100, 24:140600, 27:147600, 30:155100, 33:160200, 35:162900, 40:175300, 45:192000, 50:207900 },
    180: { 18:132700, 21:136400, 24:143400, 27:150400, 30:158400, 33:165400, 35:170100, 40:176800, 45:195600, 50:211500 },
    210: { 18:131000, 21:139200, 24:146200, 27:153600, 30:161600, 33:168400, 35:173000, 40:183300, 45:199200, 50:215200 },
  },
  B: {
    80:  { 18:96292,  21:98040,  24:101384, 27:104880, 30:110580, 33:115064, 35:117724, 40:126616, 45:132240, 50:152532 },
    120: { 18:98040,  21:100016, 24:104576, 27:108528, 30:115444, 33:119168, 35:121144, 40:129504, 45:140296, 50:155268 },
    150: { 18:99560,  21:101916, 24:106856, 27:112176, 30:117876, 33:121752, 35:123804, 40:133228, 45:145920, 50:158004 },
    180: { 18:100852, 21:103664, 24:108984, 27:114304, 30:120384, 33:125704, 35:129276, 40:134368, 45:148656, 50:160740 },
    210: { 18:99560,  21:105792, 24:111112, 27:116736, 30:122816, 33:127984, 35:131480, 40:139308, 45:151392, 50:163552 },
  },
}

const ratioMap = { 18:'1:1',21:'1:1',24:'1:2',27:'1:2',30:'1:3',33:'1:3',35:'1:3',40:'1:4',45:'1:5',50:'1:5' }

const specs = [
  { value: 'A', label: '표준',      desc: '100% 기준 단가' },
  { value: 'B', label: '0.76 적용', desc: '76% 환산 단가'  },
]
const slumps   = [80, 120, 150, 180, 210]
const strengths = [18, 21, 24, 27, 30, 33, 35, 40, 45, 50]
const strengthGroups = [
  { ratio: '1:1', strengths: [18, 21] },
  { ratio: '1:2', strengths: [24, 27] },
  { ratio: '1:3', strengths: [30, 33, 35] },
  { ratio: '1:4', strengths: [40] },
  { ratio: '1:5', strengths: [45, 50] },
]

// ─── 메인 탭 ──────────────────────────────────────────────
const mainTab = ref('calc')

// ─── [탭1] 견적 계산기 ────────────────────────────────────
const selectedSpec     = ref('A')
const selectedSlump    = ref(150)
const selectedStrength = ref(null)
const width            = ref(null)
const length           = ref(null)
const height           = ref(null)
const appliedRate      = ref(100)

const currentTable     = computed(() => priceData[selectedSpec.value])
const currentSpecLabel = computed(() => specs.find(s => s.value === selectedSpec.value)?.label ?? '')
const currentRatio     = computed(() => selectedStrength.value ? ratioMap[selectedStrength.value] : '')
const volume           = computed(() => (width.value||0) * (length.value||0) * (height.value||0))
const baseUnitPrice    = computed(() => selectedStrength.value ? (currentTable.value[selectedSlump.value]?.[selectedStrength.value] ?? 0) : 0)
const appliedUnitPrice = computed(() => Math.round(baseUnitPrice.value * appliedRate.value / 100))
const totalExVat       = computed(() => Math.round(appliedUnitPrice.value * volume.value))
const vatAmount        = computed(() => Math.round(totalExVat.value * 0.1))
const totalIncVat      = computed(() => totalExVat.value + vatAmount.value)
const isReady          = computed(() => selectedStrength.value && volume.value > 0)

const clampPositive = (field) => {
  const map = { width, length, height }
  if (map[field].value < 0) map[field].value = 0
}

// ─── [탭2] 수익 분석 ──────────────────────────────────────
const pSpec     = ref('A')
const pSlump    = ref(150)
const pStrength = ref(null)
const pRate     = ref(100)
const pVolume   = ref(null)
const pEtcCost  = ref(0)

const profitCostItems = ref([
  { materialType:'C1',  materialName:'시멘트',     group:'cement',    unit:'kg',  unitPrice:0, usagePerM3:null, defaultUsage:'300' },
  { materialType:'C2',  materialName:'플라이애쉬', group:'cement',    unit:'kg',  unitPrice:0, usagePerM3:null, defaultUsage:'50'  },
  { materialType:'C3',  materialName:'슬래그',     group:'cement',    unit:'kg',  unitPrice:0, usagePerM3:null, defaultUsage:'0'   },
  { materialType:'G1',  materialName:'자갈 25mm',  group:'aggregate', unit:'ton', unitPrice:0, usagePerM3:null, defaultUsage:'0.9' },
  { materialType:'S2',  materialName:'자갈 19mm',  group:'aggregate', unit:'ton', unitPrice:0, usagePerM3:null, defaultUsage:'0'   },
  { materialType:'S1',  materialName:'샌드밀',     group:'aggregate', unit:'ton', unitPrice:0, usagePerM3:null, defaultUsage:'0.8' },
  { materialType:'AD1', materialName:'혼화제 1',   group:'admix',     unit:'L',   unitPrice:0, usagePerM3:null, defaultUsage:'2'   },
  { materialType:'AD2', materialName:'혼화제 2',   group:'admix',     unit:'L',   unitPrice:0, usagePerM3:null, defaultUsage:'0'   },
  { materialType:'AD3', materialName:'혼화제 3',   group:'admix',     unit:'L',   unitPrice:0, usagePerM3:null, defaultUsage:'0'   },
])

const pResult = ref({
  baseUnitPrice:0, appliedUnitPrice:0,
  totalCostPerM3:0, profitPerM3:0, marginRate:0,
  simTotalIncVat:0, simTotalExVat:0, simTotalCost:0, simTotalProfit:0,
})

const loadProfitPrices = async () => {
  try {
    const res  = await api.post('/material/stock/dashboard/unit-prices')
    const list = res.data || res || []
    list.forEach(p => {
      const item = profitCostItems.value.find(i => i.materialType === p.materialType)
      if (item) item.unitPrice = p.totalPrice
    })
    calcProfit()
  } catch (e) {
    console.error('단가 로드 오류:', e)
  }
}

const calcProfit = () => {
  const baseUnitPrice    = pStrength.value ? (priceData[pSpec.value]?.[pSlump.value]?.[pStrength.value] ?? 0) : 0
  const appliedUnitPrice = Math.round(baseUnitPrice * pRate.value / 100)
  const materialCost     = profitCostItems.value.reduce((sum, item) => sum + Math.round(item.unitPrice * (item.usagePerM3||0)), 0)
  const totalCostPerM3   = materialCost + (pEtcCost.value||0)
  const profitPerM3      = appliedUnitPrice - totalCostPerM3
  const marginRate       = appliedUnitPrice > 0 ? (profitPerM3 / appliedUnitPrice) * 100 : 0
  const vol              = pVolume.value || 0
  const simTotalExVat    = Math.round(appliedUnitPrice * vol)
  const simTotalIncVat   = Math.round(simTotalExVat * 1.1)
  const simTotalCost     = Math.round(totalCostPerM3 * vol)
  const simTotalProfit   = simTotalExVat - simTotalCost
  pResult.value = { baseUnitPrice, appliedUnitPrice, totalCostPerM3, profitPerM3, marginRate, simTotalIncVat, simTotalExVat, simTotalCost, simTotalProfit }
}

const fmt = (n) => Number(n||0).toLocaleString('ko-KR')

onMounted(() => { loadProfitPrices() })
</script>

<style scoped>
.remcon-calc {
  font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  background: #0f1117;
  color: #e2e8f0;
  min-height: 100vh;
}

/* ── Header ── */
.calc-header {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 32px; border-bottom: 1px solid #1e2535;
  background: linear-gradient(135deg, #0f1117 0%, #151b2e 100%);
  flex-wrap: wrap;
}
.header-icon { font-size: 36px; }
.header-text { flex: 1; min-width: 0; }
.calc-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; }
.subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }

/* ── 메인 탭 ── */
.main-tabs { display: flex; gap: 8px; }
.main-tab-btn {
  padding: 8px 20px; border-radius: 8px;
  border: 1.5px solid #1e2535; background: #151b2e;
  color: #64748b; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s;
}
.main-tab-btn:hover  { border-color: #334155; color: #cbd5e1; }
.main-tab-btn.active { border-color: #3b82f6; background: #1e3a5f; color: #f1f5f9; }

/* ── 공통 레이아웃 ── */
.calc-body {
  display: grid; grid-template-columns: 480px 1fr;
  min-height: calc(100vh - 90px);
}
.input-panel {
  border-right: 1px solid #1e2535; padding: 24px;
  display: flex; flex-direction: column; gap: 20px; overflow-y: auto;
}
.result-panel {
  padding: 24px; display: flex; flex-direction: column; gap: 16px;
  background: #0b0f1a; overflow-y: auto;
}
.input-section { display: flex; flex-direction: column; gap: 12px; }
.section-title {
  font-size: 13px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.8px;
  margin: 0; display: flex; align-items: center; gap: 10px;
}
.section-title small { font-size: 11px; text-transform: none; color: #475569; letter-spacing: 0; }
.step {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  background: #1e40af; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0;
}

/* ── 규격 탭 ── */
.tab-buttons { display: flex; gap: 10px; }
.tab-btn {
  flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  padding: 12px 16px; border-radius: 10px; border: 1.5px solid #1e2535;
  background: #151b2e; cursor: pointer; transition: all 0.15s; color: #94a3b8;
}
.tab-btn:hover  { border-color: #334155; background: #1a2238; }
.tab-btn.active { border-color: #3b82f6; background: #1e3a5f; color: #f1f5f9; }
.tab-label { font-size: 15px; font-weight: 700; }
.tab-desc  { font-size: 11px; color: #64748b; }
.tab-btn.active .tab-desc { color: #93c5fd; }

/* ── Radio ── */
.spec-grid { display: flex; flex-direction: column; gap: 14px; }
.field label {
  display: block; font-size: 12px; font-weight: 600; color: #64748b;
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
}
.radio-group    { display: flex; flex-wrap: wrap; gap: 6px; }
.radio-btn {
  padding: 6px 14px; border-radius: 6px; border: 1.5px solid #1e2535;
  background: #151b2e; color: #94a3b8; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.12s; font-family: 'JetBrains Mono', monospace;
}
.radio-btn:hover  { border-color: #334155; color: #cbd5e1; }
.radio-btn.active { border-color: #3b82f6; background: #1e3a5f; color: #93c5fd; }
.strength-groups { display: flex; flex-direction: column; gap: 10px; }
.strength-group  { display: flex; align-items: center; gap: 10px; }
.group-ratio { font-size: 11px; font-weight: 700; color: #475569; width: 54px; flex-shrink: 0; font-family: monospace; }

/* ── Selected info ── */
.selected-info  { display: flex; flex-wrap: wrap; gap: 6px; }
.info-badge {
  padding: 4px 10px; border-radius: 20px;
  background: #0f2540; border: 1px solid #1e40af; color: #93c5fd; font-size: 12px; font-weight: 600;
}
.info-badge.ratio { background: #1a1a2e; border-color: #7c3aed; color: #c4b5fd; }

/* ── Dimensions ── */
.dimension-inputs { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
.dim-field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 70px; }
.dim-field label, .dim-result label {
  font-size: 11px; font-weight: 600; color: #64748b;
  text-align: center; text-transform: uppercase; letter-spacing: 0.5px;
}
.dim-field input {
  width: 100%; padding: 10px 8px; border-radius: 8px;
  border: 1.5px solid #1e2535; background: #0a0f1e; color: #f1f5f9;
  font-size: 16px; font-weight: 700; text-align: center;
  font-family: 'JetBrains Mono', monospace; box-sizing: border-box; transition: border-color 0.15s;
}
.dim-field input:focus       { outline: none; border-color: #3b82f6; }
.dim-field input::placeholder { color: #334155; }
.dim-sep   { font-size: 20px; font-weight: 300; color: #334155; padding-bottom: 10px; flex-shrink: 0; }
.unit      { font-size: 11px; color: #475569; text-align: center; }
.dim-result { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.volume-display {
  padding: 10px 12px; border-radius: 8px; background: #0f2540; border: 1.5px solid #1e40af;
  color: #60a5fa; font-size: 16px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  min-width: 80px; text-align: center;
}

/* ── Rate ── */
.rate-input-wrap  { display: flex; align-items: center; gap: 16px; }
.rate-slider-area { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.rate-slider {
  -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px;
  background: linear-gradient(to right, #3b82f6 0%, #3b82f6 50%, #1e2535 50%, #1e2535 100%);
  outline: none; cursor: pointer;
}
.rate-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: #3b82f6; border: 2px solid #1e3a5f; cursor: pointer; box-shadow: 0 0 0 4px rgba(59,130,246,0.2);
}
.rate-labels { display: flex; justify-content: space-between; font-size: 11px; color: #475569; }
.rate-number-wrap { display: flex; align-items: center; gap: 4px; }
.rate-number {
  width: 64px; padding: 8px 6px; border-radius: 8px;
  border: 1.5px solid #1e2535; background: #0a0f1e; color: #f1f5f9;
  font-size: 16px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace;
}
.rate-number:focus { outline: none; border-color: #3b82f6; }
.rate-pct { font-size: 16px; font-weight: 700; color: #60a5fa; }

/* ── 결과 공통 ── */
.result-header { display: flex; align-items: center; justify-content: space-between; }
.result-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: #94a3b8; }
.not-ready { font-size: 12px; color: #475569; }
.result-cards { display: flex; flex-direction: column; gap: 8px; }
.disabled { opacity: 0.4; pointer-events: none; }
.result-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-radius: 10px; background: #111827; border: 1px solid #1e2535;
}
.card-label { font-size: 13px; color: #64748b; font-weight: 500; }
.card-value {
  font-size: 20px; font-weight: 800; color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace; display: flex; align-items: baseline; gap: 6px;
}
.card-value.big    { font-size: 26px; color: #60a5fa; }
.card-value.accent { color: #34d399; font-size: 22px; }
.card-value.muted  { color: #64748b; font-size: 18px; }
.card-value.total  { color: #f59e0b; font-size: 24px; }
.card-value.total-neg { color: #f87171; font-size: 24px; }
.card-unit { font-size: 12px; font-weight: 500; color: #475569; }
.highlight-card { border-color: #1e3a5f; background: #0f1c33; }
.accent-card    { border-color: #064e3b; background: #0a2018; }
.total-card     { border-color: #78350f; background: #1c100a; }
.total-card-neg { border-color: #7f1d1d; background: #1c0a0a; }
.divider { height: 1px; background: #1e2535; margin: 4px 0; }

/* ── Price Table ── */
.price-table-wrap  { margin-top: 8px; }
.table-title { font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 10px; }
.price-table-scroll { overflow-x: auto; border-radius: 10px; border: 1px solid #1e2535; }
.price-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
  font-family: 'JetBrains Mono', monospace; min-width: 700px;
}
.price-table thead th {
  padding: 8px 6px; background: #151b2e; color: #64748b; font-weight: 600;
  text-align: center; border-bottom: 1px solid #1e2535;
}
.price-table thead th.col-active { color: #93c5fd; background: #1e3a5f; }
.price-table tbody td {
  padding: 7px 6px; text-align: center; border-bottom: 1px solid #1a2035; color: #94a3b8; font-size: 11px;
}
.price-table tbody tr:last-child td { border-bottom: none; }
.price-table .row-header { background: #151b2e; color: #64748b; font-weight: 700; text-align: center; }
.price-table .row-active td { background: #0e1f38; color: #cbd5e1; }
.price-table .col-active    { background: #0e1f38; }
.price-table .cell-active   { background: #1e40af !important; color: #fff !important; font-weight: 700; font-size: 12px; }

/* ── 수익분석: 판매단가 뱃지 ── */
.selling-price-row { display: flex; gap: 10px; flex-wrap: wrap; }
.sp-badge {
  display: flex; flex-direction: column; gap: 3px;
  padding: 10px 14px; border-radius: 10px; background: #0f2540; border: 1.5px solid #1e40af;
}
.sp-badge.accent { background: #0d2b1f; border-color: #065f46; }
.sp-label { font-size: 11px; color: #64748b; font-weight: 600; }
.sp-value { font-size: 18px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace; }
.sp-badge.accent .sp-value { color: #34d399; }
.sp-unit  { font-size: 11px; color: #475569; }

/* ── 새로고침 ── */
.refresh-btn {
  padding: 5px 12px; border-radius: 6px; border: 1px solid #1e2535;
  background: #151b2e; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.refresh-btn:hover { border-color: #334155; color: #cbd5e1; }

/* ── 자재 원가 리스트 ── */
.cost-list { display: flex; flex-direction: column; gap: 4px; }
.cost-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 8px; background: #111827; border: 1px solid #1a2035;
  gap: 8px; flex-wrap: wrap;
}
.cost-row.extra-row { background: #0f1420; border-style: dashed; }
.cost-info  { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 160px; }
.mat-badge {
  display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.mat-badge.cement    { background: #422006; color: #fbbf24; }
.mat-badge.aggregate { background: #052e16; color: #4ade80; }
.mat-badge.admix     { background: #2e1065; color: #c4b5fd; }
.mat-badge.etc       { background: #1e2535; color: #94a3b8; }
.mat-name  { font-size: 13px; font-weight: 600; color: #cbd5e1; }
.mat-price { font-size: 11px; color: #475569; margin-left: auto; white-space: nowrap; }
.cost-input-wrap { display: flex; align-items: center; gap: 6px; }
.cost-input {
  width: 80px; padding: 5px 8px; border-radius: 6px;
  border: 1.5px solid #1e2535; background: #0a0f1e; color: #f1f5f9;
  font-size: 13px; font-weight: 700; text-align: right; font-family: 'JetBrains Mono', monospace;
}
.cost-input:focus { outline: none; border-color: #3b82f6; }
.cost-unit   { font-size: 11px; color: #475569; }
.cost-result { font-size: 12px; font-weight: 700; color: #64748b; min-width: 90px; text-align: right; font-family: monospace; }

/* ── 원가 합계 바 ── */
.cost-total-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 14px; border-radius: 8px; background: #1a0a0a; border: 1.5px solid #7f1d1d;
}
.cost-total-row span:first-child { font-size: 13px; font-weight: 600; color: #94a3b8; }
.cost-total-val { font-size: 18px; font-weight: 800; color: #f87171; font-family: 'JetBrains Mono', monospace; }

/* ── 수익 요약 그리드 ── */
.profit-summary-grid { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.profit-sep { font-size: 22px; font-weight: 300; color: #334155; }
.profit-card {
  flex: 1; min-width: 110px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 16px 12px; border-radius: 12px; border: 1.5px solid #1e2535; background: #111827; text-align: center;
}
.profit-card.selling    { border-color: #1e3a5f; background: #0f1c33; }
.profit-card.cost       { border-color: #7f1d1d; background: #1a0a0a; }
.profit-card.profit-pos { border-color: #064e3b; background: #0a2018; }
.profit-card.profit-neg { border-color: #7f1d1d; background: #1a0a0a; }
.pc-icon  { font-size: 20px; }
.pc-label { font-size: 11px; color: #64748b; font-weight: 600; }
.pc-value { font-size: 18px; font-weight: 800; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; }
.profit-card.selling    .pc-value { color: #60a5fa; }
.profit-card.cost       .pc-value { color: #f87171; }
.profit-card.profit-pos .pc-value { color: #34d399; }
.profit-card.profit-neg .pc-value { color: #f87171; }
.pc-unit  { font-size: 11px; color: #475569; }

/* ── 마진율 바 ── */
.margin-bar-wrap { margin-bottom: 4px; }
.margin-bar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.margin-label { font-size: 13px; color: #64748b; font-weight: 600; }
.margin-val   { font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.margin-val.positive { color: #34d399; }
.margin-val.negative { color: #f87171; }
.margin-bar-bg   { height: 8px; border-radius: 4px; background: #1e2535; overflow: hidden; }
.margin-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.fill-pos { background: linear-gradient(90deg, #059669, #34d399); }
.fill-neg { background: linear-gradient(90deg, #dc2626, #f87171); }
.margin-bar-desc { font-size: 11px; color: #334155; margin-top: 4px; }

/* ── 납품량 시뮬레이션 ── */
.sim-section { display: flex; flex-direction: column; gap: 0; }
.sim-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #64748b;
}
.sim-vol { font-size: 15px; font-weight: 800; color: #93c5fd; font-family: 'JetBrains Mono', monospace; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .calc-body { grid-template-columns: 1fr; }
  .input-panel { border-right: none; border-bottom: 1px solid #1e2535; }
  .main-tabs { margin-left: 0; width: 100%; }
  .main-tab-btn { flex: 1; text-align: center; }
}
</style>