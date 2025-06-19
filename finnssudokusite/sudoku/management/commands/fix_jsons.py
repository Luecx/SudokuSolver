import zlib
import json
import re

from django.core.management.base import BaseCommand
from sudoku.models import Sudoku, Tag


def normalize_type(s):
    return re.sub(r'[^a-z]', '', s.lower())


def fix_field_stringtolist(field_value):
    if isinstance(field_value, str) and field_value.strip() == "":
        return []
    return field_value


class Command(BaseCommand):
    help = "Unzips Sudoku JSONs and optionally fixes malformed fields in rules."

    def add_arguments(self, parser):
        parser.add_argument('--tag', type=str, required=True, help="Filter sudokus by tag name")
        parser.add_argument('--fix-field', type=str, help="Field fix in the form fieldname:stringtolist")

    def handle(self, *args, **options):
        tag_name = options['tag']
        fix_field_arg = options.get("fix_field")

        try:
            tag = Tag.objects.get(name=tag_name)
        except Tag.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"❌ Tag '{tag_name}' not found."))
            return

        # Parse fix spec
        fix_field = None
        fix_type = None
        if fix_field_arg:
            try:
                fix_field, fix_type = fix_field_arg.split(":")
                if fix_type != "stringtolist":
                    raise ValueError()
            except ValueError:
                self.stderr.write(self.style.ERROR("❌ Invalid --fix-field. Use format like: sums:stringtolist"))
                return

        normalized_tag = normalize_type(tag_name)
        sudokus = Sudoku.objects.filter(tags=tag)
        total = sudokus.count()
        updated = 0

        for sudoku in sudokus:
            if not sudoku.puzzle:
                continue

            try:
                raw = zlib.decompress(sudoku.puzzle)
                data = json.loads(raw.decode("utf-8"))
            except Exception as e:
                self.stderr.write(f"❌ Failed to load Sudoku {sudoku.id}: {e}")
                continue

            changed = False

            rules = data.get("rules", [])
            for rule in rules:
                rule_type = normalize_type(rule.get("type", ""))
                if rule_type != normalized_tag:
                    continue

                for subrule in rule.get("rules", []):
                    fields = subrule.get("fields", {})
                    if fix_field and fix_field in fields:
                        old_value = fields[fix_field]

                        if fix_type == "stringtolist":
                            new_value = fix_field_stringtolist(old_value)
                            if new_value != old_value:
                                fields[fix_field] = new_value
                                changed = True
                                self.stdout.write(
                                    self.style.NOTICE(
                                        f"✔ Changed {fix_field} in Sudoku {sudoku.id} ('{sudoku.title}')"
                                    )
                                )

            if changed:
                try:
                    sudoku.puzzle = zlib.compress(json.dumps(data).encode("utf-8"))
                    sudoku.save(update_fields=["puzzle"])
                    updated += 1
                except Exception as e:
                    self.stderr.write(f"❌ Failed to update Sudoku {sudoku.id}: {e}")

        self.stdout.write(self.style.SUCCESS(f"\n✅ Done. Scanned {total}, updated {updated} sudokus."))
