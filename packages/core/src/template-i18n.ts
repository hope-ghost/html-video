/**
 * Centralized template metadata translations (RFC-02 i18n).
 * Studio locale `zh` maps here; English stays in each template.yaml.
 */

import type { TemplateMetadata } from './types/index.js';

export type TemplateDisplayLocale = 'en' | 'zh';

export interface TemplateLocaleFields {
  name?: string;
  description?: string;
  best_for?: string[];
}

/** zh display strings keyed by template id */
const ZH: Record<string, TemplateLocaleFields> = {
  'frame-bold-poster': {
    name: '大胆海报',
    description:
      '1970s 欧洲社论海报风：红线划过、巨型倾斜大字、标题逐行升起、衬线副题淡入。响亮、自信、极具印刷海报感。',
    best_for: ['品牌宣言 / 愿景陈述', '社论或文化提案开场', '几个字就要有杂志封面感'],
  },
  'frame-bold-signal': {
    name: '大胆信号卡',
    description: '大胆色卡章节分隔：大编号 + 导航面包屑 + 鲜橙卡片从右滑入 + 标题升起。',
    best_for: ['章节分隔', '导航式标题卡', '高对比品牌段落'],
  },
  'frame-build-minimal': {
    name: '奢华极简留白',
    description: '奢华极简留白 hero：超细字重单词逐字浮现 + 暖金细线 + 呼吸感指示器。',
    best_for: ['奢侈品牌开场', '极简宣言', '高端产品亮相'],
  },
  'frame-creative-voltage': {
    name: '创意电压分屏',
    description: '能量感分屏揭示：电光蓝与暗色面板错位滑入 + 描边电光词 + 手写体自描入。',
    best_for: ['创意机构提案', '能量感标题', '分屏对比揭示'],
  },
  'frame-data-chart-nyt': {
    name: 'NYT 风数据图表',
    description: 'NYT newsroom 排版 + 错峰揭示动画 + 编辑级图表（折线 / 柱 / 范围带）。',
    best_for: ['数据新闻短片', '编辑风图表揭示', '报告关键趋势'],
  },
  'frame-data-rollup': {
    name: '数据滚动',
    description: 'Remotion 原生数据帧：柱子从 0 生长、数字滚动到目标值。适合周/月指标汇总。',
    best_for: ['周指标汇总', 'KPI 柱状对比', '需要数字「活起来」的数据帧'],
  },
  'frame-decision-tree': {
    name: '决策树',
    description: '带动画的分支流程图，路径逐条揭示，适合讲解选择与流程。',
    best_for: ['操作指南流程', '决策分支说明', '过程图解'],
  },
  'frame-electric-studio': {
    name: '电光工作室分屏',
    description: '双屏开合揭示：白色上屏 + 电光蓝下屏从中心开合 + 接缝黑条生长 + 引言逐行浮现。',
    best_for: ['引言 / 金句', '工作室风格分屏', '高能量开场'],
  },
  'frame-glitch-title': {
    name: '故障艺术标题',
    description: '数字故障、像散偏移、数据腐败感标题动画，赛博朋克气质。',
    best_for: ['转场标题', 'Cyberpunk hero', '科技 / 游戏风开场'],
  },
  'frame-kinetic-type': {
    name: '动感字体',
    description: '大胆动感排版宣传片风格，文字作为主要视觉主角。',
    best_for: ['宣传标题', '大胆陈述', '有力开场'],
  },
  'frame-light-leak-cinema': {
    name: '胶片漏光电影',
    description: '胶片漏光 + 颗粒噪点 + 16:9 letterbox + 衬线大字，电影感开场 / 章节卡。',
    best_for: ['电影感开场', '章节分隔', '文艺品牌短片'],
  },
  'frame-liquid-bg-hero': {
    name: '流体背景 Hero',
    description: 'WebGL 风流体置换背景 + 顶部金句叠加，适合片头 / landing hero。',
    best_for: ['视频片头', 'Landing hero', '流体视觉海报'],
  },
  'frame-logo-outro': {
    name: '品牌 Logo 收尾',
    description: 'Logo 分块组装入场 + glow bloom + tagline 揭示，适合片尾 / 品牌闭幕。',
    best_for: ['视频片尾', '品牌闭幕', 'Logo 亮相收尾'],
  },
  'frame-nyt-graph': {
    name: 'NYT 图表',
    description: '纽约时报风格数据图表动画，编辑排版 + 图表错峰入场。',
    best_for: ['数据可视化短片', '新闻风图表', '报告插图动效'],
  },
  'frame-pentagram-stat': {
    name: '瑞士网格数据',
    description: '瑞士风数据揭示：巨大数字锚点 + 红色强调 + 生长条形图 + 黑色数据底栏。',
    best_for: ['关键指标展示', '瑞士网格数据卡', '年报数字亮点'],
  },
  'frame-play-mode': {
    name: '玩乐模式',
    description: '俏皮弹性动效，轻松活泼的社交短视频气质。',
    best_for: ['俏皮社交广告', '轻松开场', '趣味产品展示'],
  },
  'frame-product-promo': {
    name: '产品宣传',
    description: '多场景产品推广动画，适合功能亮点与品牌展示混剪。',
    best_for: ['产品功能展示', 'App 宣传片', 'SaaS 介绍'],
  },
  'frame-product-promo-30s': {
    name: '产品宣传 · 30秒',
    description: '完整 30 秒产品宣传片结构，多镜头串联的功能与品牌叙事。',
    best_for: ['完整产品 TVC', '发布会预告', '30 秒广告位'],
  },
  'frame-swiss-grid': {
    name: '瑞士网格',
    description: '瑞士国际主义网格排版，严谨秩序感与编辑美学。',
    best_for: ['设计机构展示', '编辑风标题', '网格系统演示'],
  },
  'frame-takram-organic': {
    name: '东方柔和有机',
    description: '柔和科技感放射节点图：毛玻璃圆角卡 + 曲线连接描入 + 节点围绕核心弹出。',
    best_for: ['概念图解', '生态系统图', '东方科技感视觉'],
  },
  'frame-vignelli': {
    name: 'Vignelli',
    description: '现代主义极简排版，受 Vignelli 设计传统启发的秩序与字体层次。',
    best_for: ['设计史致敬', '极简品牌卡', '现代主义开场'],
  },
  'frame-warm-grain': {
    name: '暖颗粒',
    description: '奶油色调 + 颗粒质感，杂志式温暖编辑美学。',
    best_for: ['产品发布', '生活方式品牌', '杂志风开场'],
  },
  'vfx-text-cursor': {
    name: 'VFX 文字光标',
    description: '光标拖光 + 彩色像散射线 + 定向光斑，适合片头逐字揭示金句。',
    best_for: ['逐字揭示标题', '片头金句', '光标 VFX 开场'],
  },
};

function normalizeLocale(locale?: string | null): TemplateDisplayLocale {
  if (!locale) return 'en';
  const l = locale.toLowerCase();
  if (l === 'zh' || l.startsWith('zh-')) return 'zh';
  return 'en';
}

/**
 * Return localized name / description / best_for for gallery & studio UI.
 * Falls back to English fields from the template metadata.
 */
export function localizeTemplateFields(
  meta: TemplateMetadata,
  locale?: string | null,
): Pick<TemplateMetadata, 'name' | 'description' | 'best_for'> {
  const loc = normalizeLocale(locale);
  if (loc === 'en') {
    return { name: meta.name, description: meta.description, best_for: meta.best_for };
  }
  const inline = meta.i18n?.zh;
  const central = ZH[meta.id];
  const src = { ...central, ...inline };
  return {
    name: src.name ?? meta.name,
    description: src.description ?? meta.description,
    best_for: src.best_for ?? meta.best_for,
  };
}
