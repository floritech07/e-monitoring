import aiosmtplib
from email.message import EmailMessage
import os
import logging
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

# Preload Jinja env
_templates_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
try:
    env = Environment(loader=FileSystemLoader(_templates_dir))
    alert_template = env.get_template("email_alert.html")
except Exception:
    alert_template = None
    logger.warning("Could not load email alert template")


async def send_email_alert(alert, recipients: list[str]):
    """Sends HTML email using aiosmtplib and Jinja2 templates."""
    try:
        smtp_host = os.getenv("SMTP_HOST", "localhost")
        smtp_port = int(os.getenv("SMTP_PORT", "1025")) # MailHog default
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASSWORD")

        message = EmailMessage()
        message["From"] = "nexusmonitor@mycompany.local"
        message["To"] = ", ".join(recipients)
        message["Subject"] = f"[{alert.severity}] Alert: {alert.message}"
        
        # Default body if no template
        body = f"An alert has been triggered for Asset ID {alert.asset_id}.\nSeverity: {alert.severity}\nMessage: {alert.message}\nTime: {alert.fired_at}"
        
        if alert_template:
            body = alert_template.render(alert=alert)
            message.set_content(body, subtype="html")
        else:
            message.set_content(body)

        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_pass,
            use_tls=bool(smtp_user)
        )
        logger.info(f"Email dispatched to {recipients}")
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")
