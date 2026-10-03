"""
Script to generate Abbas Saifee's Professional Procurement CV as an executive ATS-friendly PDF.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def generate_abbas_cv(output_pdf_path="assets/Abbas_Saifee_Procurement_CV.pdf"):
    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    name_style = ParagraphStyle(
        'DocName',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1A202C"),
        alignment=TA_LEFT
    )

    contact_style = ParagraphStyle(
        'DocContact',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#4A5568"),
        alignment=TA_LEFT
    )

    section_header_style = ParagraphStyle(
        'DocSectionHeader',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0D3B66"),
        spaceAfter=4,
        spaceBefore=8,
    )

    job_title_style = ParagraphStyle(
        'DocJobTitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1A202C")
    )

    job_meta_style = ParagraphStyle(
        'DocJobMeta',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2B6CB0"),
        alignment=TA_RIGHT
    )

    body_style = ParagraphStyle(
        'DocBody',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2D3748")
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#2D3748"),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2
    )

    story = []

    # Header
    story.append(Paragraph("ABBAS SAIFEE", name_style))
    contact_text = (
        "Sharjah, United Arab Emirates &nbsp;|&nbsp; "
        "+971 564541753 &nbsp;|&nbsp; "
        '<font color="#0D3B66"><u>abbasshabbir5153@gmail.com</u></font> &nbsp;|&nbsp; '
        '<font color="#0D3B66"><u>linkedin.com/in/abbas-saifee-75a52213a</u></font>'
    )
    story.append(Spacer(1, 3))
    story.append(Paragraph(contact_text, contact_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D3B66"), spaceAfter=8))

    # Professional Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", section_header_style))
    summary_text = (
        "A motivated and dedicated procurement specialist with <b>6+ years of experience</b> in procurement, supply chain, "
        "and maintenance. Expertise in procurement methods, strategic sourcing, supply chain management, high-value supplier negotiation, "
        "and cost analysis. Proven record directing AED 12–15M CAPEX/OPEX budgets in aviation and technical manufacturing environments. "
        "Seeking an opportunity to deliver commercial value, vendor optimization, and substantial bottom-line savings."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 6))

    # Professional Experience
    story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_header_style))

    # Role 1: GAES FZE
    role1_table_data = [
        [
            Paragraph("<b>OFFICER III GENERAL PROCUREMENT</b> &nbsp;|&nbsp; GULF AIRCRAFT & ENGINEERING SERVICES FZE", job_title_style),
            Paragraph("MAY 2023 – PRESENT", job_meta_style)
        ]
    ]
    t1 = Table(role1_table_data, colWidths=[5.4 * inch, 2.1 * inch])
    t1.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t1)
    story.append(Spacer(1, 3))

    gaes_bullets = [
        "Responsible for the day-to-day replenishment of stock for internal teams (Facilities Management, GSE, Material Management & Commercial Items related to Aircrafts).",
        "Directed end-to-end procurement for AED 12–15 million in CAPEX and OPEX budgets, achieving measurable cost savings through strategic sourcing, supplier negotiations, and contract management.",
        "Sourced, negotiated, and purchased parts/components from OEMs, authorized distributors, and approved vendors, ensuring competitive pricing and compliance with quality standards (MFGs CoC, calibration certificates, and regulatory paperwork).",
        "Responded to urgent and AOG (Aircraft On Ground) requests under high-pressure conditions, securing critical parts within tight deadlines through global vendor networks and dedicated freight forwarders.",
        "Maintained vendor relationships and monitored KPIs to ensure strict adherence to GAES FZE service-level agreements and quality standards.",
        "Implemented cost reduction initiatives including consolidated purchasing and strategic supplier agreements.",
        "Compared and evaluated tenders/quotations from suppliers, creating and tracking purchase orders to guarantee on-time delivery.",
        "Prepared comprehensive lifecycle tracking and executive reports from sourcing to contract closure and vendor performance evaluation.",
        "Provided mentorship and guidance to junior procurement team members on sourcing best practices, vendor compliance, and aviation standards."
    ]
    for b in gaes_bullets:
        story.append(Paragraph(f"• &nbsp;{b}", bullet_style))

    story.append(Spacer(1, 3))
    story.append(Paragraph("<b>Key Achievements:</b>", ParagraphStyle('AchHead', fontName='Helvetica-Bold', fontSize=8.5, leading=12, textColor=colors.HexColor("#0D3B66"), leftIndent=12)))
    story.append(Paragraph("• &nbsp;Implemented MSL auto RQs in Wings ERP system, strengthening inventory replenishment for consumables and eliminating production delays.", bullet_style))
    story.append(Paragraph("• &nbsp;Awarded Certificate of Recognition by the Director General for achieving significant cost savings across multiple critical projects.", bullet_style))
    story.append(Spacer(1, 6))

    # Role 2: PepsiCo / PBL
    role2_table_data = [
        [
            Paragraph("<b>E & I ENGINEER & TECHNICAL PROCUREMENT</b> &nbsp;|&nbsp; PAKISTAN BEVERAGE LIMITED (PEPSICO)", job_title_style),
            Paragraph("SEPT 2020 – JAN 2023", job_meta_style)
        ]
    ]
    t2 = Table(role2_table_data, colWidths=[5.4 * inch, 2.1 * inch])
    t2.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t2)
    story.append(Spacer(1, 3))

    pepsi_bullets = [
        "Operated extensively on SAP PRO HANA (MM) for Purchase Requisitions (PRs), creating POs, downtime reports, and monthly/annual inventory consumption and costing.",
        "Executed technical procurement of OEM and local spares for high-speed bottling plants using SAP MM, optimizing inventory turnover and maintaining centralized audit documentation.",
        "Managed maintenance, troubleshooting, and parts sourcing for PET bottle lines including Sidel, Krones, Ektam, Techlong, and industrial water treatment plants (ICE, Aquamatch).",
        "Programmed and maintained Siemens PLC, HMI, I/O Cards, FM Cards, AS-I systems, VFDs, and servo drives.",
        "Performed calibration and procurement of precision instruments (flow meters, pressure transmitters, HART 375 Communicators)."
    ]
    for b in pepsi_bullets:
        story.append(Paragraph(f"• &nbsp;{b}", bullet_style))

    story.append(Spacer(1, 3))
    story.append(Paragraph("<b>Key Achievements:</b>", ParagraphStyle('AchHead2', fontName='Helvetica-Bold', fontSize=8.5, leading=12, textColor=colors.HexColor("#0D3B66"), leftIndent=12)))
    story.append(Paragraph("• &nbsp;Successfully saved OEM quoted costs by 85% by leading in-house buffer conveyor engineering and procurement project.", bullet_style))
    story.append(Paragraph("• &nbsp;Removed synchronization bottlenecks of filler & labeler machines, reducing line wastage by 90%.", bullet_style))
    story.append(Spacer(1, 6))

    # Role 3: Hatimi
    role3_table_data = [
        [
            Paragraph("<b>SITE ELECTRICAL ENGINEER & PROCUREMENT</b> &nbsp;|&nbsp; HATIMI BUILDING MAINTENANCE CO.", job_title_style),
            Paragraph("JAN 2020 – JULY 2020", job_meta_style)
        ]
    ]
    t3 = Table(role3_table_data, colWidths=[5.4 * inch, 2.1 * inch])
    t3.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t3)
    story.append(Spacer(1, 3))
    hatimi_bullets = [
        "Supervised technical procurement, material requisitions, and daily site maintenance operations across commercial construction sites.",
        "Negotiated pricing and contract terms with electrical suppliers to secure highest quality at optimal project budget.",
        "Managed contractor compliance, tender drawings, and electrical BOQs (Bill of Quantities)."
    ]
    for b in hatimi_bullets:
        story.append(Paragraph(f"• &nbsp;{b}", bullet_style))

    story.append(Spacer(1, 6))

    # Skills & Education in 2 columns
    story.append(Paragraph("SKILLS & EXPERTISE", section_header_style))
    skills_text = (
        "<b>Core Competencies:</b> Strategic Sourcing • Supplier Negotiation • Vendor Performance & Relationship Management • "
        "CAPEX & OPEX Budget Management (AED 12-15M) • Contract & Tender Management • Supply Chain Logistics • AOG Emergency Purchasing<br/>"
        "<b>Technical & ERP Systems:</b> SAP PRO HANA (MM Module) • Wings ERP • Bill of Quantities (BOQ) • Inventory Optimization (MSL auto RQs) • "
        "Technical Drawing Review (AutoCAD) • Industrial & Aviation Compliance (MFGs CoC, OTAR Regulations)"
    )
    story.append(Paragraph(skills_text, body_style))
    story.append(Spacer(1, 6))

    # Education & Certifications
    story.append(Paragraph("EDUCATION & CERTIFICATIONS", section_header_style))
    edu_text = (
        "<b>Bachelor of Engineering, Electronics</b> &nbsp;|&nbsp; NED University of Engineering and Technology (2019)<br/>"
        "<b>OTAR Part 145 & Part 43 Foundation</b> &nbsp;|&nbsp; SOFEMA Aviation Services (2023)<br/>"
        "<b>Industrial Automation & PLC</b> &nbsp;|&nbsp; Usman Institute of Technology (2019)"
    )
    story.append(Paragraph(edu_text, body_style))

    doc.build(story)
    print(f"Generated CV successfully at: {output_pdf_path}")

if __name__ == "__main__":
    generate_abbas_cv()
