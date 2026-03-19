import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a comprehensive audit report for risk zones
 * @param {Array} zones - Array of risk zone objects with id, name, lat, lng, risk, date
 * @param {Array} dateStats - Array of date-based statistics
 * @param {Object} stats - KPI statistics object with total, highRisk, avgRisk, safeZones
 */
export function exportAuditReport(zones, dateStats, stats) {
  try {
    // Create PDF instance
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    // Generate report date
    const reportDate = new Date().toLocaleString();

  // Color definitions
  const colors = {
    primary: [25, 118, 210],      // Blue
    critical: [211, 47, 47],      // Red
    warning: [245, 127, 23],      // Orange
    safe: [56, 142, 60],           // Green
    headerBg: [30, 40, 60],        // Dark blue
    headerText: [255, 255, 255],   // White
    text: [50, 50, 50],            // Dark gray
    lightText: [150, 150, 150],    // Light gray
  };

  // ===== PAGE 1: TITLE PAGE & OVERVIEW =====
  
  // Header background
  doc.setFillColor(...colors.headerBg);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Title
  doc.setTextColor(...colors.headerText);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text('SECURITY AUDIT REPORT', margin, 25);
  
  // Subtitle
  doc.setTextColor(...colors.lightText);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Risk Zones & Strategic Intelligence Assessment', margin, 35);

  yPosition = 60;

  // Report metadata
  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  const metadataText = `Report Generated: ${reportDate}`;
  doc.text(metadataText, margin, yPosition);
  yPosition += 8;

  // Executive Summary box
  doc.setFillColor(240, 248, 255);
  doc.rect(margin, yPosition, contentWidth, 30, 'F');
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1);
  doc.rect(margin, yPosition, contentWidth, 30);
  
  doc.setTextColor(...colors.primary);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('EXECUTIVE SUMMARY', margin + 5, yPosition + 7);
  
  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const summaryText = `This comprehensive audit report documents ${stats.total} identified security sectors across the operational area. The assessment identifies ${stats.highRisk} critical risk zones requiring immediate attention, while ${stats.safeZones} sectors maintain secure status.`;
  doc.text(summaryText, margin + 5, yPosition + 15, { maxWidth: contentWidth - 10 });
  
  yPosition += 40;

  // ===== KPI STATISTICS SECTION =====
  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('KEY PERFORMANCE INDICATORS', margin, yPosition);
  yPosition += 12;

  // KPI boxes
  const kpiBoxWidth = (contentWidth - 9) / 4;
  const kpiBoxHeight = 25;
  const kpiData = [
    { label: 'Total Sectors', value: stats.total, color: colors.primary },
    { label: 'Critical Alerts', value: stats.highRisk, color: colors.critical },
    { label: 'Average Risk', value: stats.avgRisk, color: colors.warning },
    { label: 'Secure Zones', value: stats.safeZones, color: colors.safe },
  ];

  kpiData.forEach((kpi, index) => {
    const xPos = margin + index * (kpiBoxWidth + 2.25);
    
    // Background
    doc.setFillColor(240, 245, 250);
    doc.rect(xPos, yPosition, kpiBoxWidth, kpiBoxHeight, 'F');
    
    // Border
    doc.setDrawColor(...kpi.color);
    doc.setLineWidth(0.5);
    doc.rect(xPos, yPosition, kpiBoxWidth, kpiBoxHeight);
    
    // Value
    doc.setTextColor(...kpi.color);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(18);
    doc.text(String(kpi.value), xPos + kpiBoxWidth / 2, yPosition + 12, { align: 'center' });
    
    // Label
    doc.setTextColor(...colors.lightText);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text(kpi.label, xPos + kpiBoxWidth / 2, yPosition + 20.5, { align: 'center' });
  });

  yPosition += kpiBoxHeight + 12;

  // ===== RISK DISTRIBUTION TABLE =====
  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('RISK LEVEL DISTRIBUTION', margin, yPosition);
  yPosition += 8;

  const riskLevels = [
    { name: 'Secure (0-4)', count: stats.safeZones, color: colors.safe },
    { name: 'Elevated (5-7)', count: zones.filter(z => z.risk >= 5 && z.risk < 8).length, color: colors.warning },
    { name: 'Critical (8-10)', count: stats.highRisk, color: colors.critical },
  ];

  const distributionData = riskLevels.map(level => [
    level.name,
    level.count,
    ((level.count / stats.total) * 100).toFixed(1) + '%'
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Risk Category', 'Count', 'Percentage']],
    body: distributionData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: colors.headerBg,
      textColor: colors.headerText,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: colors.text,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 250],
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.4 },
      1: { cellWidth: contentWidth * 0.3, halign: 'center' },
      2: { cellWidth: contentWidth * 0.3, halign: 'center' },
    },
  });

  yPosition = doc.lastAutoTable.finalY + 12;

  // ===== PAGE 2: TIMELINE ANALYSIS =====
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('TIMELINE ANALYSIS', margin, yPosition);
  yPosition += 10;

  // Timeline data table
  const timelineData = dateStats.map(item => [
    item.date,
    item.count,
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Date', 'Incidents Recorded']],
    body: timelineData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.headerText,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: colors.text,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 250],
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.4 },
      1: { cellWidth: contentWidth * 0.6, halign: 'center' },
    },
  });

  yPosition = doc.lastAutoTable.finalY + 12;

  // ===== PAGE 3: DETAILED ZONE LISTING =====
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('DETAILED ZONE ASSESSMENT', margin, yPosition);
  yPosition += 10;

  // Sort zones by risk level (highest first)
  const sortedZones = [...zones].sort((a, b) => b.risk - a.risk);

  // Create detailed table
  const zoneTableData = sortedZones.map(zone => {
    let riskLevel = 'Secure';
    let riskColor = colors.safe;
    if (zone.risk >= 8) {
      riskLevel = 'CRITICAL';
      riskColor = colors.critical;
    } else if (zone.risk >= 5) {
      riskLevel = 'ELEVATED';
      riskColor = colors.warning;
    }
    
    return [
      zone.id,
      zone.name || 'Unknown Zone',
      `${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}`,
      zone.risk,
      riskLevel,
    ];
  });

  doc.autoTable({
    startY: yPosition,
    head: [['ID', 'Zone Name', 'Coordinates', 'Risk Score', 'Risk Level']],
    body: zoneTableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: colors.headerBg,
      textColor: colors.headerText,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: colors.text,
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 250],
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: contentWidth * 0.35 },
      2: { cellWidth: contentWidth * 0.25 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: contentWidth * 0.2, halign: 'center' },
    },
    didDrawPage: function(data) {
      // Add page number at bottom
      const pageCount = doc.internal.pages.length - 1;
      doc.setTextColor(...colors.lightText);
      doc.setFontSize(9);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
    },
  });

  // ===== FINAL PAGE: RECOMMENDATIONS & SUMMARY =====
  const lastY = doc.lastAutoTable.finalY;
  if (lastY > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  } else {
    yPosition = lastY + 15;
  }

  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('RECOMMENDATIONS', margin, yPosition);
  yPosition += 10;

  const criticalCount = stats.highRisk;
  const elevatedCount = zones.filter(z => z.risk >= 5 && z.risk < 8).length;

  const recommendations = [
    `IMMEDIATE ACTION: Deploy enhanced patrols to ${criticalCount} critical zones identified with risk scores of 8-10.`,
    `MEDIUM PRIORITY: Conduct targeted operations in ${elevatedCount} elevated-risk zones to prevent escalation.`,
    `ONGOING MONITORING: Maintain surveillance protocols for all ${stats.safeZones} secure zones to sustain low-risk status.`,
    `DATA ANALYSIS: Review timeline trends to identify patterns and implement predictive risk modeling.`,
    `RESOURCE ALLOCATION: Optimize patrol distribution based on high-density risk clusters identified in this report.`,
  ];

  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);

  recommendations.forEach((rec, index) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    
    const text = `${index + 1}. ${rec}`;
    const splitText = doc.splitTextToSize(text, contentWidth - 20);
    doc.text(splitText, margin + 5, yPosition);
    yPosition += splitText.length * 5 + 4;
  });

  // Footer
  if (yPosition < pageHeight - 20) {
    yPosition = pageHeight - 30;
  }

  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  doc.setTextColor(...colors.lightText);
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.text(
    'This is a confidential security document. Unauthorized distribution is prohibited.',
    pageWidth / 2,
    yPosition + 8,
    { align: 'center' }
  );
  doc.text(
    `Generated on ${reportDate}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save PDF
  const filename = `Security-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  console.log('✓ Audit report generated and downloaded successfully:', filename);
  return true;
  } catch (error) {
    console.error('✗ Error generating audit report:', error);
    alert('Error generating report. Check console for details.');
    return false;
  }
}
