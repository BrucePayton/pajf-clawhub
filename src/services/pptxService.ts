import pptxgen from "pptxgenjs";
import { Case, CaseType } from "../types";
import { buildExportFileBaseName } from "./exportMeta";

const splitText = (text: string) => {
  if (!text) return [];
  const parts: { text: string; options: { fontFace: string } }[] = [];
  // Regex to split Chinese characters (and punctuation) from others
  const regex = /([\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+|[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const part = match[0];
    const isChinese = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(part);
    parts.push({
      text: part,
      options: { fontFace: isChinese ? "STKaiti" : "Times New Roman" }
    });
  }
  return parts;
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

const sanitizeCase = (caseData: Case) => {
  const safeType: CaseType = caseData.caseType || "openclaw_app";
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
      painPoints: (caseData.challenges?.painPoints || []).filter(Boolean).slice(0, 5),
      objectives: caseData.challenges?.objectives || "暂无目标描述",
    },
    implementation: {
      steps: (caseData.implementation?.steps || []).slice(0, 3),
    },
    businessValue: {
      metrics: (caseData.businessValue?.metrics || []).slice(0, 3),
      footerNote: caseData.businessValue?.footerNote || "",
    },
    roadmap: {
      items: (caseData.roadmap?.items || []).slice(0, 3),
    },
    caseTypeMeta: caseData.caseTypeMeta || {},
  };
};

export const exportToPptx = async (caseData: Case) => {
  const safeCase = sanitizeCase(caseData);
  const config = CASE_TYPE_PPTX_CONFIG[safeCase.caseType];
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";

  const slide = pptx.addSlide();

  // Background Color
  slide.background = { color: "F5F5F0" };

  // Header
  const versionStr = (typeof safeCase.version === 'number' && !isNaN(safeCase.version))
    ? safeCase.version.toFixed(1)
    : '0.1';
  
  const titleText = `${safeCase.title} (v${versionStr})`;
  slide.addText(splitText(titleText), {
    x: 0.5,
    y: 0.2,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "1A1A1A",
  });

  slide.addText(splitText(safeCase.subtitle), {
    x: 0.5,
    y: 0.6,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: "666666",
  });

  // Author & Organization Info
  const authorInfo = `${safeCase.organization} · ${safeCase.team} · ${safeCase.author} (${safeCase.umNumber})`;
  slide.addText(splitText(authorInfo), {
    x: 0.5,
    y: 0.85,
    w: 9,
    h: 0.2,
    fontSize: 10,
    color: "999999",
  });
  slide.addText(splitText(config.typeLabel), {
    x: 8.0,
    y: 0.2,
    w: 1.6,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: "EA580C",
    align: "right",
  });

  // Section 01: Challenges (Left Column)
  // Background for section
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4,
    y: 1.0,
    w: 2.8,
    h: 4.2,
    fill: { color: "FFFFFF" },
    line: { color: "E5E5E5", width: 1 },
  });

  slide.addText(splitText(config.sectionTitle1), {
    x: 0.6,
    y: 1.2,
    w: 2.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316", // Orange-500
  });

  slide.addText(splitText("BUSINESS BACKGROUND"), {
    x: 0.6,
    y: 1.5,
    w: 2.4,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: "CCCCCC",
  });

  slide.addText(splitText(safeCase.challenges.background), {
    x: 0.6,
    y: 1.8,
    w: 2.4,
    h: 0.8,
    fontSize: 10,
    color: "333333",
    valign: "top",
  });

  slide.addText(splitText("PAIN POINTS"), {
    x: 0.6,
    y: 2.7,
    w: 2.4,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: "CCCCCC",
  });

  const painPointsText = safeCase.challenges.painPoints.length
    ? safeCase.challenges.painPoints.map((p) => `• ${p}`).join("\n")
    : "• 暂无补充痛点";
  slide.addText(splitText(painPointsText), {
    x: 0.6,
    y: 2.9,
    w: 2.4,
    h: 1.2,
    fontSize: 9,
    color: "333333",
    valign: "top",
  });

  slide.addText(splitText("OBJECTIVES"), {
    x: 0.6,
    y: 4.2,
    w: 2.4,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: "CCCCCC",
  });

  slide.addText(splitText(`“${safeCase.challenges.objectives}”`), {
    x: 0.6,
    y: 4.4,
    w: 2.4,
    h: 0.6,
    fontSize: 10,
    italic: true,
    color: "9A3412", // Orange-900
    fill: { color: "FFF7ED" }, // Orange-50
  });

  // Section 02: Implementation (Middle Column)
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.4,
    y: 1.0,
    w: 3.8,
    h: 4.2,
    fill: { color: "FFFFFF" },
    line: { color: "E5E5E5", width: 1 },
  });

  slide.addText(splitText(config.sectionTitle2), {
    x: 3.6,
    y: 1.2,
    w: 3.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316",
  });

  safeCase.implementation.steps.forEach((step, index) => {
    const yOffset = 1.6 + index * 1.1;
    
    slide.addText(splitText(`Step 0${index + 1}`), {
      x: 3.6,
      y: yOffset,
      w: 1.0,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: "F97316",
    });

    slide.addText(splitText(step.title), {
      x: 3.6,
      y: yOffset + 0.2,
      w: 1.8,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "1A1A1A",
    });

    slide.addText(splitText(step.description), {
      x: 3.6,
      y: yOffset + 0.5,
      w: 1.8,
      h: 0.4,
      fontSize: 8,
      color: "666666",
    });

    if (step.imageUrl) {
      const imgData = step.imageUrl.startsWith("data:") ? step.imageUrl : step.imageUrl;
      slide.addImage({
        data: imgData,
        x: 5.5,
        y: yOffset,
        w: 1.5,
        h: 0.9,
      });
    }
  });

  // Section 03 & 04 (Right Column)
  // Section 03: Business Value
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4,
    y: 1.0,
    w: 2.2,
    h: 2.5,
    fill: { color: config.highlightSection === "value" ? "9A3412" : "1A1A1A" },
  });

  slide.addText(splitText(config.sectionTitle3), {
    x: 7.6,
    y: 1.2,
    w: 1.8,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316",
  });

  const metricsToRender = safeCase.businessValue.metrics.length
    ? safeCase.businessValue.metrics
    : [{ id: "m0", label: "效果指标", value: "-", subtext: "暂无指标数据", icon: "trending-up" as const }];

  metricsToRender.forEach((metric, index) => {
    const yOffset = 1.6 + index * 0.7;
    
    // Add icon if available
    let iconSymbol = "";
    switch(metric.icon) {
      case 'clock': iconSymbol = "⏰ "; break;
      case 'calendar': iconSymbol = "📅 "; break;
      case 'zap': iconSymbol = "⚡ "; break;
      case 'trending-up': iconSymbol = "📈 "; break;
    }

    slide.addText(splitText(iconSymbol + metric.label), {
      x: 7.6,
      y: yOffset,
      w: 1.8,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: "F97316",
    });
    slide.addText(splitText(metric.value), {
      x: 7.6,
      y: yOffset + 0.2,
      w: 1.0,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: "FFFFFF",
    });
    slide.addText(splitText(metric.subtext), {
      x: 8.6,
      y: yOffset + 0.2,
      w: 0.8,
      h: 0.4,
      fontSize: 7,
      color: "999999",
    });
  });

  // Section 04: Roadmap
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4,
    y: 3.7,
    w: 2.2,
    h: 1.5,
    fill: { color: "FFFFFF" },
    line: { color: "E5E5E5", width: 1 },
  });

  slide.addText(splitText(config.sectionTitle4), {
    x: 7.6,
    y: 3.9,
    w: 1.8,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316",
  });

  const roadmapToRender = safeCase.roadmap.items.length
    ? safeCase.roadmap.items
    : [{ id: "r0", task: "后续计划", content: "待补充", date: "TBD" }];

  roadmapToRender.forEach((item, index) => {
    const yOffset = 4.3 + index * 0.3;
    slide.addText(splitText(`[${item.task}] ${item.content}`), {
      x: 7.6,
      y: yOffset,
      w: 1.8,
      h: 0.2,
      fontSize: 8,
      color: "333333",
    });
  });

  // Footer
  slide.addText(splitText("平安财服应用价值案例库"), {
    x: 0.5,
    y: 5.3,
    w: 4,
    h: 0.2,
    fontSize: 8,
    color: "CCCCCC",
    bold: true,
  });

  // Save the Presentation with a more robust method for iframes
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
    // Fallback to library's internal method if blob fails
    await pptx.writeFile({ fileName: `${buildExportFileBaseName(safeCase)}.pptx` });
  }
};

