import logging
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "../../apps/worker/templates/reports")

class PDFExporter:
    """Converts a report data dict into a formatted PDF using WeasyPrint + Jinja2."""
    
    def __init__(self):
        self.jinja = Environment(
            loader=FileSystemLoader(TEMPLATES_DIR),
            autoescape=select_autoescape(["html"])
        )
        
    def render_html(self, template_name: str, context: dict) -> str:
        tmpl = self.jinja.get_template(template_name)
        return tmpl.render(**context)
        
    def export(self, template_name: str, context: dict) -> bytes:
        """Renders HTML then converts to PDF bytes via WeasyPrint."""
        html_str = self.render_html(template_name, context)
        
        try:
            from weasyprint import HTML
            pdf_bytes = HTML(string=html_str).write_pdf()
            logger.info(f"PDF generated, size: {len(pdf_bytes)} bytes")
            return pdf_bytes
        except ImportError:
            logger.warning("WeasyPrint not installed — returning rendered HTML as bytes")
            return html_str.encode("utf-8")
