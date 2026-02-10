import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportAnalyticsPdf(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily expand for full capture
  const originalOverflow = element.style.overflow;
  element.style.overflow = 'visible';

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    windowWidth: 1200,
  });

  element.style.overflow = originalOverflow;

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
