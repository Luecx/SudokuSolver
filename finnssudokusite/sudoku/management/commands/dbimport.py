# sudoku/management/commands/dbimport.py

from django.core.management.base import BaseCommand
from django.apps import apps
from django.db.models import BinaryField, ForeignKey
import base64
import json

class Command(BaseCommand):
    help = "Imports full DB content from export_with_binary.json, resolving BinaryFields, ForeignKeys, M2Ms, and skipping protected system models."

    def handle(self, *args, **kwargs):
        with open("export_with_binary.json", "r") as f:
            raw_data = json.load(f)

        # Step 1: group by model label
        model_entries = {}
        for entry in raw_data:
            label = entry["model"]
            model_entries.setdefault(label, []).append(entry)

        # Step 2: sort models to resolve dependencies first (User before others)
        sorted_labels = sorted(model_entries.keys(), key=lambda l: (l != "auth.User", l))

        # Step 3: import field data (excluding protected models)
        for label in sorted_labels:
            if label in {"contenttypes.ContentType", "auth.Permission"}:
                continue  # skip system-managed models

            model = apps.get_model(label)
            if not model:
                self.stderr.write(f"⚠️ Model {label} not found. Skipping.")
                continue

            for entry in model_entries[label]:
                fields = entry["fields"]
                resolved_fields = {}

                for field in model._meta.fields:
                    val = fields.get(field.name)

                    if isinstance(field, BinaryField):
                        resolved_fields[field.name] = base64.b64decode(val) if val else None
                    elif isinstance(field, ForeignKey):
                        if val is not None:
                            rel_model = field.remote_field.model
                            try:
                                resolved_fields[field.name] = rel_model.objects.get(pk=val)
                            except rel_model.DoesNotExist:
                                self.stderr.write(f"❌ FK missing: {rel_model.__name__} pk={val} in {label}")
                                raise
                        else:
                            resolved_fields[field.name] = None
                    else:
                        resolved_fields[field.name] = val

                model.objects.update_or_create(pk=entry["pk"], defaults=resolved_fields)

        # Step 4: apply ManyToMany relationships
        for label in sorted_labels:
            if label in {"contenttypes.ContentType", "auth.Permission"}:
                continue

            model = apps.get_model(label)
            if not model:
                continue

            for entry in model_entries[label]:
                m2m = entry.get("m2m", {})
                if not m2m:
                    continue

                instance = model.objects.get(pk=entry["pk"])
                for field_name, pks in m2m.items():
                    getattr(instance, field_name).set(pks)

        self.stdout.write(self.style.SUCCESS("✅ Full DB import complete."))
