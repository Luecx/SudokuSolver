# sudoku/templatetags/formatting.py

from django import template

register = template.Library()

@register.filter
def humantime(seconds):
    seconds = int(float(seconds))
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        minutes = seconds // 60
        sec = seconds % 60
        return f"{minutes}m {sec}s"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}h {minutes}m"
