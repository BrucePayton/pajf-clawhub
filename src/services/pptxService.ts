import pptxgen from "pptxgenjs";
import { Case } from "../types";
import { FullAnalyticsData } from "./apiService";

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

export const exportToPptx = async (caseData: Case) => {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";

  const slide = pptx.addSlide();

  // Background Color
  slide.background = { color: "F5F5F0" };

  // Header
  const versionStr = (typeof caseData.version === 'number' && !isNaN(caseData.version)) 
    ? caseData.version.toFixed(1) 
    : '0.1';
  
  const titleText = `${caseData.title} (v${versionStr})`;
  slide.addText(splitText(titleText), {
    x: 0.5,
    y: 0.2,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "1A1A1A",
  });

  slide.addText(splitText(caseData.subtitle), {
    x: 0.5,
    y: 0.6,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: "666666",
  });

  // Author & Organization Info
  const authorInfo = `${caseData.organization} · ${caseData.team} · ${caseData.author} (${caseData.umNumber})`;
  slide.addText(splitText(authorInfo), {
    x: 0.5,
    y: 0.85,
    w: 9,
    h: 0.2,
    fontSize: 10,
    color: "999999",
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

  slide.addText(splitText("01. 业务背景与痛点"), {
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

  slide.addText(splitText(caseData.challenges.background), {
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

  const painPointsText = caseData.challenges.painPoints.map(p => `• ${p}`).join("\n");
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

  slide.addText(splitText(`“${caseData.challenges.objectives}”`), {
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

  slide.addText(splitText("02. 核心实施路径"), {
    x: 3.6,
    y: 1.2,
    w: 3.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316",
  });

  caseData.implementation.steps.forEach((step, index) => {
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
    fill: { color: "1A1A1A" },
  });

  slide.addText(splitText("03. 业务价值产出"), {
    x: 7.6,
    y: 1.2,
    w: 1.8,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316",
  });

  caseData.businessValue.metrics.forEach((metric, index) => {
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

  slide.addText(splitText("04. 下一步工作计划"), {
    x: 7.6,
    y: 3.9,
    w: 1.8,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "F97316",
  });

  caseData.roadmap.items.forEach((item, index) => {
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
  slide.addText(splitText("OpenClaw Value Canvas Framework v1.0"), {
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
    a.download = `${caseData.title.replace(/[\\/:*?"<>|]/g, '_')}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PPTX write error:", err);
    // Fallback to library's internal method if blob fails
    await pptx.writeFile({ fileName: `${caseData.title.replace(/[\\/:*?"<>|]/g, '_')}.pptx` });
  }
};

interface AnalyticsChartImage {
  key: string;
  title: string;
  imageDataUrl: string;
}

export const exportAnalyticsToPptx = async (
  analytics: FullAnalyticsData | null,
  chartImages: AnalyticsChartImage[]
) => {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  const now = new Date();
  const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const subtitle = analytics
    ? `总案例 ${analytics.totals.cases} ｜ 已发布 ${analytics.totals.published} ｜ 组织 ${analytics.totals.regions}`
    : "分析数据快照";

  const cover = pptx.addSlide();
  cover.background = { color: "F8FAFC" };
  cover.addText("OpenClaw 分析看板导出", {
    x: 0.6,
    y: 0.6,
    w: 12,
    h: 0.8,
    fontSize: 30,
    bold: true,
    color: "0F172A",
  });
  cover.addText(subtitle, {
    x: 0.6,
    y: 1.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: "475569",
  });
  cover.addText(`导出时间：${dateLabel}`, {
    x: 0.6,
    y: 1.95,
    w: 12,
    h: 0.3,
    fontSize: 11,
    color: "64748B",
  });

  for (const chart of chartImages) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(chart.title, {
      x: 0.5,
      y: 0.3,
      w: 12.3,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "111827",
    });
    slide.addText(`图表标识：${chart.key}`, {
      x: 0.5,
      y: 0.78,
      w: 12.3,
      h: 0.25,
      fontSize: 10,
      color: "6B7280",
    });
    slide.addImage({
      data: chart.imageDataUrl,
      x: 0.5,
      y: 1.1,
      w: 12.3,
      h: 5.7,
    });
  }

  const filename = `OpenClaw_Analytics_${dateLabel}.pptx`;
  try {
    const blob = await pptx.write({ outputType: "blob" });
    const url = window.URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Analytics PPTX write error:", err);
    await pptx.writeFile({ fileName: filename });
  }
};
