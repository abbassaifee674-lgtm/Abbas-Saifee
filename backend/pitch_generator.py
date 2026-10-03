"""
AI Pitch & Cold Email Generator tailored specifically for Abbas Saifee.
Crafts compelling, high-converting outreach messages highlighting his procurement achievements.
"""
from backend.candidate import ABBAS_PROFILE

def generate_cold_email(company_name: str, job_title: str, country: str, contact_name: str = "Hiring Team") -> dict:
    """
    Generates a personalized, professional cold outreach email for Abbas Saifee.
    """
    clean_title = job_title.strip() if job_title else "Procurement Specialist"
    clean_company = company_name.strip() if company_name else "Your Organization"
    clean_country = country.strip() if country else "your region"

    # Dynamic variations based on role nuances
    is_aviation = any(term in clean_title.lower() or term in clean_company.lower() for term in ['aviation', 'aircraft', 'aerospace', 'airline'])
    is_technical = any(term in clean_title.lower() for term in ['technical', 'engineer', 'industrial', 'plant', 'machinery'])

    if is_aviation:
        specialty_hook = "my extensive background in aviation procurement, managing AOG emergency shipments, and sourcing certified OEM aircraft parts (MFGs CoC, OTAR compliance)"
    elif is_technical:
        specialty_hook = "my technical procurement experience across industrial plants (SAP MM, S/4HANA), OEM spares management, and engineering negotiation"
    else:
        specialty_hook = "my 6+ years of strategic sourcing, directing AED 12–15M CAPEX/OPEX budgets, and aggressive vendor cost optimization"

    subject = f"Application: {clean_title} - Abbas Saifee | 6+ Yrs Strategic Sourcing & Procurement"

    body = f"""Dear {contact_name or 'Hiring Team'} at {clean_company},

I am writing to express my strong interest in the {clean_title} position at {clean_company} in {clean_country}.

With 6+ years of hands-on experience directing end-to-end procurement and supply chain operations, I specialize in strategic sourcing, supplier contract negotiation, and enterprise cost reduction. Most recently as Officer III General Procurement at Gulf Aircraft & Engineering Services FZE, I managed AED 12-15 million in CAPEX and OPEX budgets, successfully securing critical OEM parts while driving measurable savings through consolidated vendor agreements.

Key qualifications I bring to {clean_company}:
- Strategic Sourcing & Negotiation: Proven track record in vetting OEMs, authorized distributors, and commercial suppliers with strict compliance standards.
- Technical & ERP Mastery: Expert in SAP PRO HANA (Materials Management / MM) and Wings ERP, including automated inventory replenishment (MSL auto RQs).
- Proven Cost Optimization: Awarded the Director General's Certificate of Recognition for achieving high-impact cost savings across high-pressure procurement cycles.
- Domain Expertise: Deep familiarity with {specialty_hook}.

I hold a Bachelor of Engineering in Electronics from NED University along with OTAR Part 145 & 43 certifications, providing me a solid technical lens when evaluating equipment, BOQs, and supplier tenders.

I am highly motivated to relocate to {clean_country} and contribute immediately to {clean_company}'s procurement excellence.

My complete CV is attached for your review. I would welcome the opportunity to discuss how my sourcing expertise and negotiation track record align with your team's goals.

Thank you for your time and consideration.

Best regards,

Abbas Saifee
Procurement Specialist | Strategic Sourcing & Supply Chain
Phone / WhatsApp: +971 564541753
Email: abbasshabbir5153@gmail.com
LinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/
Sharjah, United Arab Emirates (Ready to relocate)
"""

    return {
        "subject": subject,
        "body": body.strip(),
        "candidate_name": ABBAS_PROFILE["full_name"],
        "candidate_email": ABBAS_PROFILE["email"],
        "candidate_phone": ABBAS_PROFILE["phone"]
    }
