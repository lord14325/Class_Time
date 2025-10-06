// src/hooks/useExportPDF.js
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const useExportPDF = () => {
  const exportToPDF = async (elementId, filename = "schedule.pdf") => {
    const element = document.getElementById(elementId);

    if (!element) {
      console.error("Element not found for PDF export");
      alert("Could not find schedule to export.");
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape", // Better for tables
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 297; // Landscape A4 width
      const pageHeight = 210; // Landscape A4 height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return { exportToPDF };
};

export default useExportPDF;