from django.core.management.base import BaseCommand
from yourapp.models import Tag


class Command(BaseCommand):
    help = "Merge tag variants into a canonical tag name"

    def add_arguments(self, parser):
        parser.add_argument(
            '--canonical',
            type=str,
            required=True,
            help='The canonical name to keep (e.g. "Dutch-Flat")'
        )
        parser.add_argument(
            '--aliases',
            nargs='+',
            type=str,
            required=True,
            help='List of tag names to merge into the canonical one (e.g. "DutchFlat Dutch_Flat")'
        )

    def handle(self, *args, **options):
        canonical_name = options['canonical']
        aliases = options['aliases']

        try:
            canonical_tag = Tag.objects.get(name=canonical_name)
            self.stdout.write(self.style.SUCCESS(f"✅ Found canonical tag: {canonical_tag.name}"))
        except Tag.DoesNotExist:
            canonical_tag = Tag.objects.create(name=canonical_name)
            self.stdout.write(self.style.WARNING(f"🆕 Created new canonical tag: {canonical_name}"))

        for alias in aliases:
            if alias == canonical_name:
                continue
            try:
                alias_tag = Tag.objects.get(name=alias)
            except Tag.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"⚠️ Alias tag '{alias}' not found. Skipping."))
                continue

            sudokus = alias_tag.sudokus.all()
            for sudoku in sudokus:
                sudoku.tags.add(canonical_tag)
            alias_tag.delete()
            self.stdout.write(self.style.SUCCESS(f"🔁 Merged '{alias}' into '{canonical_name}'"))

        self.stdout.write(self.style.SUCCESS("🎉 Tag fix complete."))
