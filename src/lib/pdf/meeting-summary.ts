import { jsPDF } from "jspdf";

export type MeetingPdfData = {
  committeeName: string;
  meetingDate: string;
  authorName: string;
  summary: string | null;
  actionItems: {
    description: string;
    ownerName: string | null;
    dueDate: string | null;
    status: string;
  }[];
};

export function generateMeetingSummaryPdf(data: MeetingPdfData): Uint8Array {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.text("IEEE CMU — Meeting Summary", margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`${data.committeeName} · ${data.meetingDate}`, margin, y);
  y += 6;
  doc.text(`Author: ${data.authorName}`, margin, y);
  y += 12;

  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text("Summary", margin, y);
  y += 8;

  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(
    data.summary?.trim() || "(No summary recorded)",
    170,
  );
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 6 + 8;

  doc.setFontSize(13);
  doc.text("Action Items", margin, y);
  y += 8;

  doc.setFontSize(11);
  if (data.actionItems.length === 0) {
    doc.text("None", margin, y);
  } else {
    for (const item of data.actionItems) {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      const owner = item.ownerName ? ` — ${item.ownerName}` : "";
      const due = item.dueDate ? ` (due ${item.dueDate})` : "";
      const status = item.status === "done" ? " [done]" : "";
      const lines = doc.splitTextToSize(
        `• ${item.description}${owner}${due}${status}`,
        170,
      );
      doc.text(lines, margin, y);
      y += lines.length * 6 + 4;
    }
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

export type SignaturePdfRow = {
  committee: string;
  templateName: string;
  completed: boolean;
  eventTitle: string | null;
};

export function generateSignatureReportPdf(
  semesterLabel: string,
  rows: SignaturePdfRow[],
): Uint8Array {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text(`Signature Events — ${semesterLabel}`, 20, y);
  y += 12;

  doc.setFontSize(11);
  for (const row of rows) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const mark = row.completed ? "[x]" : "[ ]";
    const detail = row.eventTitle ? ` — ${row.eventTitle}` : "";
    doc.text(`${mark} ${row.committee}: ${row.templateName}${detail}`, 20, y);
    y += 7;
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
