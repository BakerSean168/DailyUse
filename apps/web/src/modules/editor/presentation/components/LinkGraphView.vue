<template>
  <v-card class="link-graph-view">
    <v-card-title class="d-flex align-center pa-3">
      <v-icon class="mr-2" color="primary">mdi-graph-outline</v-icon>
      <span class="text-h6">链接图谱</span>
      <v-spacer />
      
      <!-- 深度选择器 -->
      <v-btn-toggle v-model="currentDepth" mandatory density="compact" class="mr-2">
        <v-btn :value="1" size="small">1 层</v-btn>
        <v-btn :value="2" size="small">2 层</v-btn>
        <v-btn :value="3" size="small">3 层</v-btn>
      </v-btn-toggle>

      <v-btn icon="mdi-refresh" size="small" variant="text" @click="refresh" :loading="loading" />
      <v-btn icon="mdi-close" size="small" variant="text" @click="emit('close')" />
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <!-- 加载状态 -->
      <div v-if="loading" class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-body-2 text-grey mt-4">生成图谱中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="graphData.nodes.length === 0" class="pa-8 text-center">
        <v-icon size="80" color="grey-lighten-1">mdi-graph-outline</v-icon>
        <p class="text-h6 text-grey mt-4">暂无关联文档</p>
        <p class="text-caption text-grey">创建链接后图谱会显示在这里</p>
      </div>

      <!-- ECharts 图谱 -->
      <div v-else ref="chartRef" class="graph-container" />

      <!-- 图例 -->
      <div v-if="!loading && graphData.nodes.length > 0" class="graph-legend pa-3">
        <v-chip size="small" class="mr-2">
          <v-icon start size="small" color="primary">mdi-circle</v-icon>
          当前文档
        </v-chip>
        <v-chip size="small" class="mr-2">
          <v-icon start size="small" color="grey">mdi-circle</v-icon>
          关联文档
        </v-chip>
        <v-chip size="small">
          节点: {{ graphData.nodes.length }} | 链接: {{ graphData.edges.length }}
        </v-chip>
      </div>
    </v-card-text>

    <!-- 错误提示 -->
    <v-alert v-if="error" type="error" variant="tonal" class="ma-3">
      {{ error }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { documentApiClient } from '@/modules/document/api/DocumentApiClient';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';
import * as echarts from 'echarts';

type LinkGraphResponseDTO = LinkGraphResponseDTO;
type LinkGraphNodeDTO = LinkGraphNodeDTO;
type LinkGraphEdgeDTO = LinkGraphEdgeDTO;

// ==================== Props ====================
interface Props {
  documentUuid: string;
  initialDepth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialDepth: 2,
});

// ==================== Emits ====================
const emit = defineEmits<{
  close: [];
  nodeClick: [nodeUuid: string];
}>();

// ==================== State ====================
const loading = ref(false);
const error = ref<string | null>(null);
const currentDepth = ref(props.initialDepth);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const graphData = ref<LinkGraphResponseDTO>({
  nodes: [],
  edges: [],
  centerUuid: props.documentUuid,
  depth: currentDepth.value,
});

// ==================== Methods ====================
async function loadLinkGraph() {
  if (!props.documentUuid) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await documentApiClient.getLinkGraph(
      props.documentUuid,
      currentDepth.value
    );
    graphData.value = response;
    
    await nextTick();
    renderGraph();
  } catch (err: any) {
    console.error('Load link graph failed:', err);
    error.value = err.message || '加载链接图谱失败';
    graphData.value = { nodes: [], edges: [], centerUuid: props.documentUuid, depth: currentDepth.value };
  } finally {
    loading.value = false;
  }
}

function renderGraph() {
  if (!chartRef.value || graphData.value.nodes.length === 0) return;

  // 初始化或获取图表实例
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  // 转换节点数据
  const nodes = graphData.value.nodes.map((node: LinkGraphNodeDTO) => ({
    id: node.uuid,
    name: node.title,
    symbolSize: node.isCurrent ? 60 : 40 + Math.min(node.linkCount + node.backlinkCount, 20) * 2,
    value: node.linkCount + node.backlinkCount,
    itemStyle: {
      color: node.isCurrent ? '#1976d2' : '#90caf9',
    },
    label: {
      show: true,
      formatter: '{b}',
    },
  }));

  // 转换边数据
  const links = graphData.value.edges.map((edge: LinkGraphEdgeDTO) => ({
    source: edge.source,
    target: edge.target,
    label: {
      show: false,
      formatter: edge.linkText,
    },
  }));

  // 图表配置
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `${params.data.name}<br/>链接数: ${params.data.value}`;
        }
        return '';
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        draggable: true,
        force: {
          repulsion: 200,
          gravity: 0.1,
          edgeLength: 150,
          layoutAnimation: true,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3,
          },
        },
        lineStyle: {
          color: '#ccc',
          width: 2,
          curveness: 0.3,
        },
      },
    ],
  };

  chartInstance.setOption(option);

  // 监听节点点击事件
  chartInstance.off('click');
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      emit('nodeClick', params.data.id);
    }
  });
}

function refresh() {
  loadLinkGraph();
}

function resizeChart() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

// ==================== Watchers ====================
watch(() => props.documentUuid, () => {
  loadLinkGraph();
});

watch(currentDepth, () => {
  loadLinkGraph();
});

// ==================== Lifecycle ====================
onMounted(() => {
  loadLinkGraph();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.link-graph-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-container {
  width: 100%;
  height: 600px;
  min-height: 400px;
}

.graph-legend {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background-color: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
</style>

