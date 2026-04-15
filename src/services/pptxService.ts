import pptxgen from "pptxgenjs";
import { Case, CaseStep, CaseType } from "../types";
import { buildExportFileBaseName } from "./exportMeta";

const FONT_ZH = "STKaiti";
const FONT_EN = "Times New Roman";

const BASE_COLORS = {
  bg: "FFF8F3",
  surface: "FFFFFF",
  accent: "EA580C",
  accentLight: "F97316",
  accentBand: "FFEDD5",
  accentSoft: "FFF7ED",
  text: "1C1917",
  textMuted: "57534E",
  textSoft: "78716C",
  border: "FED7AA",
  borderLight: "E5E5E5",
  footer: "A8A29E",
  dark: "1A1A1A",
  darkAccent: "9A3412",
};
const C = { ...BASE_COLORS };

export type PptxTemplateId = 'sunrise_orange' | 'amber_modern' | 'tech_orange';

export const pptxTemplateOptions: Array<{ id: PptxTemplateId; name: string; description: string }> = [
  { id: 'sunrise_orange', name: '晨曦橙', description: '柔和浅橙，适合通用汇报' },
  { id: 'amber_modern', name: '琥珀现代', description: '高对比橙金，强调指标卡片' },
  { id: 'tech_orange', name: '科技橙', description: '冷暖融合，科技感更强' },
];

const TEMPLATE_COLOR_OVERRIDES: Record<PptxTemplateId, Partial<typeof C>> = {
  sunrise_orange: {},
  amber_modern: {
    bg: "FFF7ED",
    accent: "D97706",
    accentLight: "F59E0B",
    accentBand: "FEF3C7",
    accentSoft: "FFFBEB",
    darkAccent: "92400E",
    border: "FCD34D",
  },
  tech_orange: {
    bg: "FFF8F2",
    accent: "F97316",
    accentLight: "FB923C",
    accentBand: "FFE7D6",
    accentSoft: "FFF4EC",
    textMuted: "4B5563",
    darkAccent: "7C2D12",
    border: "FDBA74",
  },
};

const STEPS_PER_MULTI_PAGE = 3;
const MAX_STEPS = 48;

const splitText = (text: string) => {
  if (!text) return [];
  const parts: { text: string; options: { fontFace: string } }[] = [];
  const regex =
    /([\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+|[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const part = match[0];
    const isChinese = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(part);
    parts.push({
      text: part,
      options: { fontFace: isChinese ? FONT_ZH : FONT_EN },
    });
  }
  return parts;
};

const clamp = (s: string, max: number) => {
  const t = (s || "").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
};

const iconFor = (icon?: string) => {
  switch (icon) {
    case "clock": return "⏱ ";
    case "calendar": return "📅 ";
    case "zap": return "⚡ ";
    case "trending-up": return "📈 ";
    default: return "";
  }
};

type CaseTypePptxConfig = {
  typeLabel: string;
  sectionTitle1: string;
  sectionTitle2: string;
  sectionTitle3: string;
  sectionTitle4: string;
  highlightSection: "implementation" | "value";
};

const CASE_TYPE_PPTX_CONFIG: Record<CaseType, CaseTypePptxConfig> = {
  openclaw_app: {
    typeLabel: "OpenClaw应用案例",
    sectionTitle1: "01. 业务背景与痛点",
    sectionTitle2: "02. 实施步骤与方法",
    sectionTitle3: "03. 价值效果",
    sectionTitle4: "04. 下一步计划",
    highlightSection: "implementation",
  },
  tool_app: {
    typeLabel: "小工具应用案例",
    sectionTitle1: "01. 设计背景与需求",
    sectionTitle2: "02. 设计实现过程",
    sectionTitle3: "03. 应用效果",
    sectionTitle4: "04. 迭代计划",
    highlightSection: "value",
  },
  rpa_app: {
    typeLabel: "RPA应用案例",
    sectionTitle1: "01. 流程背景与痛点",
    sectionTitle2: "02. 自动化步骤方法",
    sectionTitle3: "03. 上下游与收益",
    sectionTitle4: "04. 持续优化",
    highlightSection: "implementation",
  },
  agent_app: {
    typeLabel: "Agent案例",
    sectionTitle1: "01. 任务背景与挑战",
    sectionTitle2: "02. Agent执行步骤",
    sectionTitle3: "03. 关键点与效果",
    sectionTitle4: "04. 能力演进计划",
    highlightSection: "implementation",
  },
  dashboard_app: {
    typeLabel: "看板案例",
    sectionTitle1: "01. 分析目标与口径",
    sectionTitle2: "02. 看板构建过程",
    sectionTitle3: "03. 指标分析结果",
    sectionTitle4: "04. 用法与推广",
    highlightSection: "value",
  },
};

type SafeCase = ReturnType<typeof sanitizeCase>;

function sanitizeCase(caseData: Case) {
  const safeType: CaseType = caseData.caseType || "openclaw_app";
  const rawSteps = (caseData.implementation?.steps || []).filter(
    (s) => s && s.id
  );
  return {
    ...caseData,
    caseType: safeType,
    title: caseData.title || "未命名案例",
    subtitle: caseData.subtitle || "",
    author: caseData.author || "未命名",
    team: caseData.team || "未分配团队",
    umNumber: caseData.umNumber || "-",
    challenges: {
      background: caseData.challenges?.background || "暂无背景描述",
      painPoints: (caseData.challenges?.painPoints || []).filter(Boolean).slice(0, 10),
      objectives: caseData.challenges?.objectives || "暂无目标描述",
    },
    implementation: {
      steps: rawSteps.slice(0, MAX_STEPS),
    },
    businessValue: {
      metrics: (caseData.businessValue?.metrics || []).slice(0, 4),
      footerNote: caseData.businessValue?.footerNote || "",
    },
    roadmap: {
      items: (caseData.roadmap?.items || []).slice(0, 5),
    },
    caseTypeMeta: caseData.caseTypeMeta || {},
  };
}

function versionStr(v?: number): string {
  return typeof v === "number" && !isNaN(v) ? v.toFixed(1) : "0.1";
}

function addFooter(slide: pptxgen.Slide, typeLabel?: string) {
  slide.addText(splitText("平安财服应用价值案例库"), {
    x: 0.5, y: 5.3, w: 4, h: 0.2,
    fontSize: 8, color: C.footer, bold: true,
  });
  if (typeLabel) {
    slide.addText(splitText(typeLabel), {
      x: 6.5, y: 5.3, w: 3, h: 0.2,
      fontSize: 8, color: C.footer, align: "right",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE-PAGE MODE (steps <= 4) — preserves original three-column layout
// ─────────────────────────────────────────────────────────────────────────────

function addSinglePageSlide(
  pptx: pptxgen,
  sc: SafeCase,
  config: CaseTypePptxConfig
) {
  const slide = pptx.addSlide();
  slide.background = { color: C.bg };

  // Header
  slide.addText(splitText(`${sc.title} (v${versionStr(sc.version)})`), {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: 24, bold: true, color: C.dark,
  });
  slide.addText(splitText(sc.subtitle), {
    x: 0.5, y: 0.6, w: 9, h: 0.3,
    fontSize: 14, color: "666666",
  });
  const authorInfo = `${sc.organization} · ${sc.team} · ${sc.author} (${sc.umNumber})`;
  slide.addText(splitText(authorInfo), {
    x: 0.5, y: 0.85, w: 9, h: 0.2,
    fontSize: 10, color: "999999",
  });
  slide.addText(splitText(config.typeLabel), {
    x: 8.0, y: 0.2, w: 1.6, h: 0.25,
    fontSize: 10, bold: true, color: C.accent, align: "right",
  });

  // Section 01 – Left Column
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.0, w: 2.8, h: 4.2,
    fill: { color: C.surface }, line: { color: C.borderLight, width: 1 },
  });
  slide.addText(splitText(config.sectionTitle1), {
    x: 0.6, y: 1.2, w: 2.4, h: 0.3,
    fontSize: 12, bold: true, color: C.accentLight,
  });
  slide.addText(splitText("BUSINESS BACKGROUND"), {
    x: 0.6, y: 1.5, w: 2.4, h: 0.2,
    fontSize: 8, bold: true, color: "CCCCCC",
  });
  slide.addText(splitText(clamp(sc.challenges.background, 400)), {
    x: 0.6, y: 1.8, w: 2.4, h: 0.8,
    fontSize: 10, color: "333333", valign: "top",
  });
  slide.addText(splitText("PAIN POINTS"), {
    x: 0.6, y: 2.7, w: 2.4, h: 0.2,
    fontSize: 8, bold: true, color: "CCCCCC",
  });
  const painText = sc.challenges.painPoints.length
    ? sc.challenges.painPoints.map((p) => `• ${p}`).join("\n")
    : "• 暂无补充痛点";
  slide.addText(splitText(clamp(painText, 600)), {
    x: 0.6, y: 2.9, w: 2.4, h: 1.2,
    fontSize: 9, color: "333333", valign: "top",
  });
  slide.addText(splitText("OBJECTIVES"), {
    x: 0.6, y: 4.2, w: 2.4, h: 0.2,
    fontSize: 8, bold: true, color: "CCCCCC",
  });
  slide.addText(splitText(`"${clamp(sc.challenges.objectives, 200)}"`), {
    x: 0.6, y: 4.4, w: 2.4, h: 0.6,
    fontSize: 10, italic: true, color: C.darkAccent,
    fill: { color: C.accentSoft },
  });

  // Section 02 – Middle Column (steps)
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.4, y: 1.0, w: 3.8, h: 4.2,
    fill: { color: C.surface }, line: { color: C.borderLight, width: 1 },
  });
  slide.addText(splitText(config.sectionTitle2), {
    x: 3.6, y: 1.2, w: 3.4, h: 0.3,
    fontSize: 12, bold: true, color: C.accentLight,
  });

  const steps = sc.implementation.steps.slice(0, 4);
  const stepSpacing = steps.length <= 3 ? 1.1 : 0.92;
  steps.forEach((step, index) => {
    const yOff = 1.6 + index * stepSpacing;
    slide.addText(splitText(`Step 0${index + 1}`), {
      x: 3.6, y: yOff, w: 1.0, h: 0.2,
      fontSize: 8, bold: true, color: C.accentLight,
    });
    slide.addText(splitText(clamp(step.title, 80)), {
      x: 3.6, y: yOff + 0.2, w: 1.8, h: 0.28,
      fontSize: 11, bold: true, color: C.dark,
    });
    slide.addText(splitText(clamp(step.description, 180)), {
      x: 3.6, y: yOff + 0.48, w: 1.8, h: 0.35,
      fontSize: 8, color: "666666", valign: "top",
    });
    if (step.imageUrl) {
      try {
        slide.addImage({
          data: step.imageUrl, x: 5.5, y: yOff, w: 1.5, h: 0.82,
        });
      } catch { /* skip broken image */ }
    }
  });

  // Section 03 – Right Column (Business Value)
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 1.0, w: 2.2, h: 2.5,
    fill: { color: C.darkAccent },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 1.0, w: 0.08, h: 2.5,
    fill: { color: C.accent },
  });
  slide.addText(splitText(config.sectionTitle3), {
    x: 7.6, y: 1.12, w: 1.8, h: 0.3,
    fontSize: 12, bold: true, color: C.accentBand,
  });
  const metrics = sc.businessValue.metrics.length
    ? sc.businessValue.metrics.slice(0, 3)
    : [{ id: "m0", label: "效果指标", value: "-", subtext: "暂无指标数据", icon: "trending-up" as const }];
  metrics.forEach((m, i) => {
    const yOff = 1.55 + i * 0.72;
    slide.addText(splitText(iconFor(m.icon) + m.label), {
      x: 7.6, y: yOff, w: 1.8, h: 0.2,
      fontSize: 8, bold: true, color: C.border,
    });
    slide.addText(splitText(m.value), {
      x: 7.6, y: yOff + 0.2, w: 1.0, h: 0.4,
      fontSize: 18, bold: true, color: "FFFFFF",
    });
    slide.addText(splitText(m.subtext), {
      x: 8.55, y: yOff + 0.2, w: 0.85, h: 0.4,
      fontSize: 7, color: C.border,
    });
  });

  // Section 04 – Right Column (Roadmap)
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 3.7, w: 2.2, h: 1.5,
    fill: { color: C.accentSoft }, line: { color: C.border, width: 1 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 3.7, w: 0.08, h: 1.5,
    fill: { color: C.accentLight },
  });
  slide.addText(splitText(config.sectionTitle4), {
    x: 7.6, y: 3.82, w: 1.8, h: 0.3,
    fontSize: 12, bold: true, color: C.accent,
  });
  const roadmap = sc.roadmap.items.length
    ? sc.roadmap.items.slice(0, 3)
    : [{ id: "r0", task: "后续计划", content: "待补充", date: "TBD" }];
  roadmap.forEach((item, i) => {
    const yOff = 4.22 + i * 0.3;
    slide.addText(splitText(`▸ ${clamp(item.task, 20)}`), {
      x: 7.6, y: yOff, w: 0.85, h: 0.2,
      fontSize: 8, bold: true, color: C.darkAccent,
    });
    slide.addText(splitText(clamp(item.content, 60)), {
      x: 8.45, y: yOff, w: 1.05, h: 0.2,
      fontSize: 7, color: C.textMuted,
    });
  });

  addFooter(slide, config.typeLabel);
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-PAGE MODE (steps >= 5) — unified template across all case types
// ─────────────────────────────────────────────────────────────────────────────

function multiSlideBackground(slide: pptxgen.Slide) {
  slide.background = { color: C.bg };
}

function multiAccentBar(slide: pptxgen.Slide, pptx: pptxgen, y: number) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y, w: 1.2, h: 0.06,
    fill: { color: C.accent },
  });
}

// Slide 1: Cover
function addCoverSlide(pptx: pptxgen, sc: SafeCase, config: CaseTypePptxConfig) {
  const slide = pptx.addSlide();
  multiSlideBackground(slide);

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 3.15, h: 5.625,
    fill: { color: C.accentBand },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: C.accent },
  });

  slide.addText(splitText("VALUE CASE STUDY"), {
    x: 3.45, y: 0.85, w: 6, h: 0.3,
    fontSize: 9, color: C.accent, bold: true, fontFace: FONT_EN, charSpacing: 1,
  });
  slide.addText(splitText(`${sc.title}（v${versionStr(sc.version)}）`), {
    x: 3.45, y: 1.2, w: 6.2, h: 1.1,
    fontSize: 28, bold: true, color: C.text, valign: "top",
  });
  slide.addText(splitText(sc.subtitle || "—"), {
    x: 3.45, y: 2.45, w: 6.2, h: 0.55,
    fontSize: 14, color: C.textMuted, valign: "top",
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.45, y: 3.15, w: 2.85, h: 0.42,
    fill: { color: C.surface }, line: { color: C.border, width: 1 },
    rectRadius: 0.08,
  });
  slide.addText(splitText(config.typeLabel), {
    x: 3.55, y: 3.22, w: 2.65, h: 0.3,
    fontSize: 11, bold: true, color: C.accent, align: "center", fontFace: FONT_ZH,
  });

  const meta = `${sc.organization} · ${sc.team} · ${sc.author}（${sc.umNumber}）`;
  slide.addText(splitText(meta), {
    x: 3.45, y: 3.85, w: 6.2, h: 0.65,
    fontSize: 11, color: C.textSoft, valign: "top",
  });

  slide.addText(splitText("Smart · Efficient · Data-driven"), {
    x: 3.45, y: 4.85, w: 6, h: 0.25,
    fontSize: 8, color: C.border, italic: true, fontFace: FONT_EN,
  });

  addFooter(slide);
}

// Slide 2: Challenges
function addChallengesSlide(pptx: pptxgen, sc: SafeCase, config: CaseTypePptxConfig) {
  const slide = pptx.addSlide();
  multiSlideBackground(slide);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.45, y: 0.45, w: 9.1, h: 4.75,
    fill: { color: C.surface }, line: { color: C.border, width: 1 },
    rectRadius: 0.12,
  });

  multiAccentBar(slide, pptx, 0.62);
  slide.addText(splitText(config.sectionTitle1), {
    x: 0.65, y: 0.52, w: 8.5, h: 0.45,
    fontSize: 18, bold: true, color: C.accent, fontFace: FONT_ZH,
  });
  slide.addText(splitText("CONTEXT & CHALLENGE"), {
    x: 0.65, y: 0.92, w: 8, h: 0.22,
    fontSize: 8, color: C.textSoft, fontFace: FONT_EN,
  });

  slide.addText(splitText("背景综述"), {
    x: 0.65, y: 1.22, w: 2.2, h: 0.22,
    fontSize: 9, bold: true, color: C.darkAccent, fontFace: FONT_ZH,
  });
  slide.addText(splitText(clamp(sc.challenges.background, 800)), {
    x: 0.65, y: 1.44, w: 8.7, h: 1.05,
    fontSize: 11, color: C.text, valign: "top", fontFace: FONT_ZH,
  });

  slide.addText(splitText("痛点摘要"), {
    x: 0.65, y: 2.55, w: 2.2, h: 0.22,
    fontSize: 9, bold: true, color: C.darkAccent, fontFace: FONT_ZH,
  });
  const painText = sc.challenges.painPoints.length
    ? sc.challenges.painPoints.map((p) => `• ${p}`).join("\n")
    : "• 暂无补充痛点";
  slide.addText(splitText(clamp(painText, 1200)), {
    x: 0.65, y: 2.78, w: 4.1, h: 1.4,
    fontSize: 10, color: C.textMuted, valign: "top", fontFace: FONT_ZH,
  });

  slide.addText(splitText("目标与诉求"), {
    x: 5.0, y: 2.55, w: 2.2, h: 0.22,
    fontSize: 9, bold: true, color: C.darkAccent, fontFace: FONT_ZH,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.0, y: 2.78, w: 4.35, h: 1.4,
    fill: { color: C.accentSoft }, line: { color: C.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(splitText(`「${clamp(sc.challenges.objectives, 400)}」`), {
    x: 5.15, y: 2.92, w: 4.05, h: 1.15,
    fontSize: 11, italic: true, color: C.darkAccent, valign: "top", fontFace: FONT_ZH,
  });

  addFooter(slide, config.typeLabel);
}

// Slides 3..N: Implementation Steps (3 per page)
function addStepsSlides(
  pptx: pptxgen,
  sc: SafeCase,
  config: CaseTypePptxConfig
) {
  const steps = sc.implementation.steps;
  const totalPages = Math.ceil(steps.length / STEPS_PER_MULTI_PAGE);

  for (let page = 0; page < totalPages; page++) {
    const slide = pptx.addSlide();
    multiSlideBackground(slide);

    const pageSteps = steps.slice(
      page * STEPS_PER_MULTI_PAGE,
      (page + 1) * STEPS_PER_MULTI_PAGE
    );
    const suffix = totalPages > 1 ? `（${page + 1}/${totalPages}）` : "";

    multiAccentBar(slide, pptx, 0.5);
    slide.addText(splitText(`${config.sectionTitle2}${suffix}`), {
      x: 0.5, y: 0.42, w: 8.5, h: 0.42,
      fontSize: 18, bold: true, color: C.accent, fontFace: FONT_ZH,
    });
    slide.addText(splitText("IMPLEMENTATION STEPS"), {
      x: 0.5, y: 0.82, w: 8, h: 0.2,
      fontSize: 8, color: C.textSoft, fontFace: FONT_EN,
    });

    const bandTop = 1.12;
    const bandH = Math.min(1.38, 4.0 / Math.max(pageSteps.length, 1));

    pageSteps.forEach((step, i) => {
      const globalIdx = page * STEPS_PER_MULTI_PAGE + i + 1;
      const y = bandTop + i * bandH;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.45, y: y - 0.02, w: 9.1, h: bandH - 0.08,
        fill: { color: i % 2 === 0 ? C.accentSoft : C.surface },
        line: { color: C.border, width: 0.5 },
        rectRadius: 0.1,
      });

      slide.addText(splitText(`STEP ${String(globalIdx).padStart(2, "0")}`), {
        x: 0.65, y: y + 0.08, w: 1.1, h: 0.22,
        fontSize: 8, bold: true, color: C.accent, fontFace: FONT_EN,
      });

      const hasImg = !!step.imageUrl;
      const textW = hasImg ? 5.5 : 8.4;

      slide.addText(splitText(clamp(step.title, 120)), {
        x: 0.65, y: y + 0.3, w: textW, h: 0.35,
        fontSize: 13, bold: true, color: C.text, valign: "top", fontFace: FONT_ZH,
      });
      slide.addText(splitText(clamp(step.description, 500)), {
        x: 0.65, y: y + 0.62, w: textW, h: bandH - 0.72,
        fontSize: 10, color: C.textMuted, valign: "top", fontFace: FONT_ZH,
      });

      if (hasImg) {
        try {
          slide.addImage({
            data: step.imageUrl,
            x: 6.45, y: y + 0.1, w: 2.95, h: Math.min(bandH - 0.2, 1.15),
          });
        } catch { /* skip broken image */ }
      }
    });

    addFooter(slide, config.typeLabel);
  }
}

// Final Slide: Value (left) + Roadmap (right)
function addValueAndRoadmapSlide(
  pptx: pptxgen,
  sc: SafeCase,
  config: CaseTypePptxConfig
) {
  const slide = pptx.addSlide();
  multiSlideBackground(slide);

  // Left panel – warm orange background for value metrics
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.45, y: 0.45, w: 6.35, h: 4.75,
    fill: { color: C.darkAccent },
    rectRadius: 0.14,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.45, y: 0.45, w: 0.1, h: 4.75,
    fill: { color: C.accent },
  });

  multiAccentBar(slide, pptx, 0.62);
  slide.addText(splitText(config.sectionTitle3), {
    x: 0.75, y: 0.55, w: 5.8, h: 0.42,
    fontSize: 18, bold: true, color: C.accentBand, fontFace: FONT_ZH,
  });
  slide.addText(splitText("BUSINESS VALUE"), {
    x: 0.75, y: 0.95, w: 5, h: 0.2,
    fontSize: 8, color: C.border, fontFace: FONT_EN,
  });

  const metrics = sc.businessValue.metrics.length
    ? sc.businessValue.metrics
    : [{ id: "m0", label: "效果指标", value: "-", subtext: "暂无指标数据", icon: "trending-up" as const }];

  const cardW = 2.75;
  const cardH = 1.45;
  metrics.slice(0, 4).forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 0.85 + col * (cardW + 0.22);
    const by = 1.35 + row * (cardH + 0.18);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: bx, y: by, w: cardW, h: cardH,
      fill: { color: C.accent, transparency: 35 },
      line: { color: C.accentLight, width: 0.5 },
      rectRadius: 0.12,
    });
    slide.addText(splitText(iconFor(m.icon) + m.label), {
      x: bx + 0.15, y: by + 0.12, w: cardW - 0.3, h: 0.28,
      fontSize: 9, bold: true, color: C.accentBand, fontFace: FONT_ZH,
    });
    slide.addText(splitText(m.value), {
      x: bx + 0.15, y: by + 0.42, w: cardW * 0.48, h: 0.55,
      fontSize: 22, bold: true, color: "FFFFFF", fontFace: FONT_EN,
    });
    slide.addText(splitText(clamp(m.subtext, 80)), {
      x: bx + 0.15, y: by + 0.98, w: cardW - 0.3, h: 0.38,
      fontSize: 8, color: C.border, valign: "top", fontFace: FONT_ZH,
    });
  });

  if (sc.businessValue.footerNote) {
    slide.addText(splitText(clamp(sc.businessValue.footerNote, 200)), {
      x: 0.75, y: 4.35, w: 5.9, h: 0.55,
      fontSize: 9, color: C.accentBand, italic: true, valign: "top", fontFace: FONT_ZH,
    });
  }

  // Right panel – Roadmap (light orange tone)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.95, y: 0.45, w: 2.6, h: 4.75,
    fill: { color: C.accentSoft }, line: { color: C.border, width: 1 },
    rectRadius: 0.12,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.95, y: 0.45, w: 0.08, h: 4.75,
    fill: { color: C.accentLight },
  });
  slide.addText(splitText(config.sectionTitle4), {
    x: 7.15, y: 0.6, w: 2.25, h: 0.55,
    fontSize: 12, bold: true, color: C.accent, fontFace: FONT_ZH,
  });

  const roadmap = sc.roadmap.items.length
    ? sc.roadmap.items
    : [{ id: "r0", task: "后续计划", content: "待补充", date: "TBD" }];

  roadmap.slice(0, 5).forEach((item, i) => {
    const y = 1.25 + i * 0.72;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.15, y, w: 2.2, h: 0.62,
      fill: { color: C.surface },
      line: { color: C.border, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText(splitText(`▸ ${clamp(item.task, 40)}`), {
      x: 7.25, y, w: 2.0, h: 0.22,
      fontSize: 9, bold: true, color: C.darkAccent, fontFace: FONT_ZH,
    });
    slide.addText(splitText(clamp(item.content, 100)), {
      x: 7.25, y: y + 0.22, w: 2.0, h: 0.35,
      fontSize: 8, color: C.textMuted, valign: "top", fontFace: FONT_ZH,
    });
  });

  addFooter(slide, config.typeLabel);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export const exportToPptx = async (caseData: Case, options?: { templateId?: PptxTemplateId }) => {
  const templateId = options?.templateId || 'sunrise_orange';
  Object.assign(C, BASE_COLORS, TEMPLATE_COLOR_OVERRIDES[templateId] || {});
  const rawStepCount = (caseData.implementation?.steps || []).length;
  const safeCase = sanitizeCase(caseData);
  const config = CASE_TYPE_PPTX_CONFIG[safeCase.caseType];
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = safeCase.author;
  pptx.title = safeCase.title;
  pptx.subject = config.typeLabel;

  const stepCount = safeCase.implementation.steps.length;
  console.log(`[PPTX] raw steps: ${rawStepCount}, valid steps: ${stepCount}, mode: ${stepCount <= 4 ? 'single-page' : 'multi-page'}`, safeCase.implementation.steps.map(s => s.title || '(untitled)'));

  if (stepCount <= 4) {
    addSinglePageSlide(pptx, safeCase, config);
  } else {
    addCoverSlide(pptx, safeCase, config);
    addChallengesSlide(pptx, safeCase, config);
    addStepsSlides(pptx, safeCase, config);
    addValueAndRoadmapSlide(pptx, safeCase, config);
  }

  try {
    const blob = await pptx.write({ outputType: "blob" });
    const url = window.URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildExportFileBaseName(safeCase)}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PPTX write error:", err);
    await pptx.writeFile({ fileName: `${buildExportFileBaseName(safeCase)}.pptx` });
  }
};
