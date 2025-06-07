# sudoku/management/commands/dbexport.py

from django.core.management.base import BaseCommand
from django.apps import apps
from django.db.models import (
    BinaryField, DateTimeField, DateField, ForeignKey, ManyToManyField
)
import base64
import json

class Command(BaseCommand):
    help = "Exports all DB content including BinaryField, DateTimeField, ForeignKey, and ManyToManyField to export_with_binary.json"

    def handle(self, *args, **kwargs):
        data = []

        for model in apps.get_models():
            model_label = f"{model._meta.app_label}.{model.__name__}"
            for obj in model.objects.all():
                fields = {}
                m2m = {}

                for field in model._meta.fields:
                    val = getattr(obj, field.name)

                    if isinstance(field, BinaryField):
                        fields[field.name] = base64.b64encode(val).decode("utf-8") if val else None
                    elif isinstance(field, (DateTimeField, DateField)):
                        fields[field.name] = val.isoformat() if val else None
                    elif isinstance(field, ForeignKey):
                        fields[field.name] = val.pk if val else None
                    else:
                        fields[field.name] = val

                for field in model._meta.many_to_many:
                    m2m[field.name] = list(getattr(obj, field.name).values_list("pk", flat=True))

                data.append({
                    "model": model_label,
                    "pk": obj.pk,
                    "fields": fields,
                    "m2m": m2m,
                })

        with open("export_with_binary.json", "w") as f:
            json.dump(data, f, indent=2)

        self.stdout.write(self.style.SUCCESS("✅ Export complete: export_with_binary.json"))
