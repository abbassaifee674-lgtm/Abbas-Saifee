"""
Email extraction and domain resolution utility.
"""
import re
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup

EMAIL_REGEX = re.compile(
    r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
)

IGNORED_DOMAINS = {
    'example.com', 'yourcompany.com', 'domain.com', 'email.com',
    'sentry.io', 'wixpress.com', 'github.com', 'schema.org'
}

IGNORED_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js')

def clean_email(email_str: str) -> str:
    if not email_str:
        return ""
    email_str = email_str.strip().lower()
    # Strip trailing dots or punctuation
    email_str = re.sub(r'[\s,.;:)>]+$', '', email_str)
    email_str = re.sub(r'^[<(\s]+', '', email_str)
    return email_str

def is_valid_email(email_str: str) -> bool:
    if not email_str:
        return False
    email_str = clean_email(email_str)
    if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email_str):
        return False
    domain = email_str.split('@')[-1]
    if domain in IGNORED_DOMAINS:
        return False
    if any(email_str.endswith(ext) for ext in IGNORED_EXTENSIONS):
        return False
    return True

def extract_emails_from_text(text: str) -> list[str]:
    if not text:
        return []
    raw_emails = EMAIL_REGEX.findall(text)
    valid_emails = []
    for em in raw_emails:
        cleaned = clean_email(em)
        if is_valid_email(cleaned) and cleaned not in valid_emails:
            valid_emails.append(cleaned)
    return valid_emails

def extract_domain_from_url(url: str) -> str:
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc or parsed.path
        netloc = netloc.split(':')[0]
        # Remove www.
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.strip()
    except Exception:
        return ""

def guess_recruitment_emails(company_name: str, domain: str = "") -> list[str]:
    """Generate high-probability talent acquisition / procurement emails for a company."""
    if not domain and company_name:
        clean_name = re.sub(r'[^a-zA-Z0-9]', '', company_name.lower())
        domain = f"{clean_name}.com"
    
    if not domain:
        return []
    
    clean_domain = domain.lower().replace("www.", "").strip()
    
    # Priority HR & Talent emails
    return [
        f"careers@{clean_domain}",
        f"jobs@{clean_domain}",
        f"recruitment@{clean_domain}",
        f"hr@{clean_domain}",
        f"talent@{clean_domain}",
        f"procurement@{clean_domain}",
        f"info@{clean_domain}"
    ]

async def scrape_emails_from_page(url: str, timeout: float = 6.0) -> list[str]:
    """Attempt to fetch a job posting page or career page and extract public contact emails."""
    if not url or not url.startswith(('http://', 'https://')):
        return []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=False) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                text = resp.text
                emails = extract_emails_from_text(text)
                return emails
    except Exception as e:
        # Silently handle connection or timeout error
        pass
    return []
