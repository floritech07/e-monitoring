import logging
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)

_jinja_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "../../apps/worker/templates")),
    autoescape=select_autoescape(["html"])
)

class EmailNotifier:
    """Async SMTP email dispatcher using aiosmtplib with Jinja2 template rendering."""
    
    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "smtp.mailgun.org")
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.user = os.getenv("SMTP_USER", "")
        self.password = os.getenv("SMTP_PASSWORD", "")
        
    async def send(self, to_addr: str, subject: str, body_html: str) -> bool:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.user
        msg["To"] = to_addr
        msg.attach(MIMEText(body_html, "html"))
        
        try:
            await aiosmtplib.send(
                msg,
                hostname=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                start_tls=True
            )
            logger.info(f"Email dispatched: {subject} → {to_addr}")
            return True
        except Exception as e:
            logger.error(f"Email dispatch failed: {e}")
            return False
            
    async def send_alert_email(self, to_addr: str, alert: dict) -> bool:
        try:
            tmpl = _jinja_env.get_template("reports/base.html")
            body = tmpl.render(alert=alert)
        except Exception:
            body = f"<b>{alert.get('title', 'Alert')}</b><br>{alert.get('message', '')}"
        return await self.send(to_addr, f"[NexusMonitor] {alert.get('severity')} — {alert.get('title')}", body)
