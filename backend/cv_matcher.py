"""
CV Matcher Engine for Abbas Saifee.
Analyzes job requirements against Abbas's exact qualifications from his CV.
Computes a granular match score (80% - 98%) and identifies exact matching pillars.
"""
import re
import json

CV_PILLARS = [
    {
        "id": "aviation_gse",
        "name": "Aviation & GSE Sourcing",
        "keywords": ["aviation", "aircraft", "aerospace", "aog", "gse", "mro", "airline", "rotables", "otar", "fleet"],
        "reason": "Matches Abbas's 3+ yrs at Gulf Aircraft & Engineering Services managing AOG parts & OEM distributors"
    },
    {
        "id": "technical_plant",
        "name": "Technical & Plant Sourcing",
        "keywords": ["technical", "plant", "machinery", "spares", "equipment", "maintenance", "engineering buyer", "industrial", "oem"],
        "reason": "Matches Abbas's engineering procurement at PepsiCo for high-speed machinery & OEM spare parts"
    },
    {
        "id": "sap_erp",
        "name": "SAP MM & ERP Inventory",
        "keywords": ["sap", "mm", "s/4hana", "erp", "inventory", "replenishment", "materials management", "pr", "po", "wings"],
        "reason": "Matches Abbas's mastery of SAP PRO HANA (MM) & Wings ERP MSL automated replenishment"
    },
    {
        "id": "capex_opex_negotiation",
        "name": "CAPEX/OPEX & Supplier Negotiation",
        "keywords": ["capex", "opex", "strategic sourcing", "negotiation", "tender", "rfp", "rfq", "contract", "cost reduction", "cost analysis", "savings", "budget"],
        "reason": "Matches Abbas's direction of AED 12-15M CAPEX/OPEX budgets & proven 85% project cost savings"
    },
    {
        "id": "general_procurement",
        "name": "End-to-End Procurement Lifecycle",
        "keywords": ["procurement", "purchasing", "buyer", "supply chain", "vendor", "supplier", "sourcing", "category manager"],
        "reason": "Matches Abbas's 6+ years directing the full procurement lifecycle from sourcing to vendor KPIs"
    },
    {
        "id": "engineering_boq",
        "name": "Engineering Degree & BOQs",
        "keywords": ["engineer", "electronics", "instrumentation", "boq", "technical drawing", "autocad", "specifications"],
        "reason": "Matches Abbas's BE Electronics degree from NED University & BOQ supplier evaluation expertise"
    }
]

def analyze_cv_match(job_title: str, job_description: str = "", company_industry: str = "") -> dict:
    """
    Computes matching percentage and extracted reasons based on Abbas's CV.
    """
    combined_text = f"{job_title} {job_description} {company_industry}".lower()

    matched_pillars = []
    base_score = 75  # Base match for any procurement role in target countries

    for pillar in CV_PILLARS:
        hits = [kw for kw in pillar["keywords"] if kw in combined_text]
        if hits:
            matched_pillars.append({
                "pillar_id": pillar["id"],
                "name": pillar["name"],
                "reason": pillar["reason"],
                "matched_keywords": hits
            })
            base_score += 4

    # Cap score realistically between 82% and 98%
    match_score = min(max(base_score, 82), 98)

    reasons = [p["reason"] for p in matched_pillars]
    pillar_names = [p["name"] for p in matched_pillars]

    return {
        "score": match_score,
        "score_label": f"{match_score}% Match",
        "reasons": reasons[:3],  # Top 3 matching reasons
        "pillar_names": pillar_names
    }
