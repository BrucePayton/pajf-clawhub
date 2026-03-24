import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const sanitizeFileName = (value: string) => {
  const normalized = (value || 'case').replace(/[\\/:*?"<>|]/g, '_').trim();
  return normalized || 'case';
};

export const exportElementToPdf = async (element: HTMLElement, fileBaseName: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imageData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imageData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${sanitizeFileName(fileBaseName)}.pdf`);
};
