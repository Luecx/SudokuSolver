from django import template
from django.utils.safestring import mark_safe

register = template.Library()

@register.simple_tag
def render_starbar(rating):
    """
    Renders 5 stars with filled portion corresponding to the given rating (0–5).
    """
    if rating is None:
        return mark_safe('<span class="text-muted">—</span>')

    rating = max(0, min(float(rating), 5))
    percent = (rating / 5.0) * 100

    html = f"""
    <div class="starbar" style="position: relative; display: inline-block; font-size: 0.9rem; line-height: 1;">
      <div style="color: #ffc107; position: absolute; top: 0; left: 0; width: {percent}%; overflow: hidden; white-space: nowrap;">
        {'★' * 5}
      </div>
      <div style="color: #dee2e6;">
        {'★' * 5}
      </div>
    </div>
    """
    return mark_safe(html)
