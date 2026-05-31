package com.billbook.controller;

import com.billbook.model.BbUser;
import com.billbook.model.Invoice;
import com.billbook.model.InvoiceItem;
import com.billbook.repository.InvoiceRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

@RestController @RequestMapping("/api/bb/invoices") @RequiredArgsConstructor
public class InvoicePdfController {
    private final InvoiceRepository invoiceRepo;

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@AuthenticationPrincipal BbUser user, @PathVariable Long id) {
        return invoiceRepo.findById(id)
            .filter(inv -> inv.getUser().getId().equals(user.getId()))
            .map(inv -> {
                try {
                    byte[] pdf = generatePdf(inv);
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    headers.setContentDisposition(ContentDisposition.attachment()
                        .filename(inv.getInvoiceNumber() + ".pdf").build());
                    return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
                } catch (Exception e) {
                    return new ResponseEntity<byte[]>(HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }).orElse(ResponseEntity.notFound().build());
    }

    private byte[] generatePdf(Invoice inv) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf);

        // Header
        Paragraph title = new Paragraph("TAX INVOICE")
            .setBold().setFontSize(20).setTextAlignment(TextAlignment.CENTER)
            .setFontColor(ColorConstants.DARK_GRAY);
        doc.add(title);

        // Business info
        String bizName = inv.getUser().getBusinessName() != null ? inv.getUser().getBusinessName() : "My Business";
        doc.add(new Paragraph(bizName).setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
        if (inv.getUser().getGstin() != null)
            doc.add(new Paragraph("GSTIN: " + inv.getUser().getGstin()).setTextAlignment(TextAlignment.CENTER).setFontSize(10));

        doc.add(new Paragraph("\n"));

        // Invoice meta
        Table meta = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
        meta.addCell(cell("Invoice #: " + inv.getInvoiceNumber(), false));
        meta.addCell(cell("Date: " + inv.getInvoiceDate(), false));
        meta.addCell(cell("Bill To: " + inv.getCustomer().getName(), false));
        meta.addCell(cell("Status: " + inv.getPaymentStatus(), false));
        if (inv.getCustomer().getPhone() != null)
            meta.addCell(cell("Phone: " + inv.getCustomer().getPhone(), false));
        if (inv.getDueDate() != null)
            meta.addCell(cell("Due Date: " + inv.getDueDate(), false));
        doc.add(meta);
        doc.add(new Paragraph("\n"));

        // Items table
        Table table = new Table(UnitValue.createPercentArray(new float[]{35, 10, 10, 12, 10, 13})).useAllAvailableWidth();
        String[] headers = {"Item", "Qty", "Unit", "Price", "Disc%", "Total"};
        for (String h : headers)
            table.addHeaderCell(new Cell().add(new Paragraph(h).setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));

        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItem item : inv.getItems()) {
            table.addCell(cell(item.getProductName(), false));
            table.addCell(cell(item.getQuantity().toPlainString(), false));
            table.addCell(cell(item.getUnit(), false));
            table.addCell(cell("₹" + item.getUnitPrice().toPlainString(), false));
            table.addCell(cell(item.getDiscountPercent().toPlainString() + "%", false));
            table.addCell(cell("₹" + item.getTotalPrice().toPlainString(), false));
            subtotal = subtotal.add(item.getTotalPrice());
        }
        doc.add(table);
        doc.add(new Paragraph("\n"));

        // Totals
        Table totals = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
        totals.addCell(cell("Subtotal", false)); totals.addCell(cell("₹" + inv.getSubtotal(), false));
        if (inv.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            totals.addCell(cell("Discount", false)); totals.addCell(cell("-₹" + inv.getDiscountAmount(), false));
        }
        if (inv.getTotalTax().compareTo(BigDecimal.ZERO) > 0) {
            totals.addCell(cell("GST", false)); totals.addCell(cell("₹" + inv.getTotalTax(), false));
        }
        totals.addCell(new Cell().add(new Paragraph("TOTAL").setBold()));
        totals.addCell(new Cell().add(new Paragraph("₹" + inv.getTotalAmount()).setBold()));
        totals.addCell(cell("Paid", false)); totals.addCell(cell("₹" + inv.getPaidAmount(), false));
        totals.addCell(new Cell().add(new Paragraph("Balance Due").setBold().setFontColor(ColorConstants.RED)));
        totals.addCell(new Cell().add(new Paragraph("₹" + inv.getBalanceDue()).setBold().setFontColor(ColorConstants.RED)));
        doc.add(totals);

        if (inv.getNotes() != null && !inv.getNotes().isBlank()) {
            doc.add(new Paragraph("\nNotes: " + inv.getNotes()).setFontSize(10).setItalic());
        }

        doc.add(new Paragraph("\nThank you for your business!").setTextAlignment(TextAlignment.CENTER).setFontSize(10));

        doc.close();
        return baos.toByteArray();
    }

    private Cell cell(String text, boolean bold) {
        Paragraph p = new Paragraph(text).setFontSize(10);
        if (bold) p.setBold();
        return new Cell().add(p);
    }
}
