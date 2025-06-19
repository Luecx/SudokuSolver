from django.core.management.base import BaseCommand
from sudoku.models import Tag, Sudoku  # ✅ Update this if your app name differs

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

        # Ensure the canonical tag exists
        canonical_tag, created = Tag.objects.get_or_create(name=canonical_name)
        if created:
            self.stdout.write(self.style.WARNING(f"🆕 Created new canonical tag: {canonical_name}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"✅ Found canonical tag: {canonical_tag.name}"))

        merged_count = 0

        for alias in aliases:
            if alias == canonical_name:
                continue

            try:
                alias_tag = Tag.objects.get(name=alias)
            except Tag.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"⚠️ Alias tag '{alias}' not found. Skipping."))
                continue

            # Reassign all sudokus
            sudokus = alias_tag.sudokus.all()
            for sudoku in sudokus:
                if not sudoku.tags.filter(id=canonical_tag.id).exists():
                    sudoku.tags.add(canonical_tag)
            merged_count += sudokus.count()

            alias_tag.delete()
            self.stdout.write(self.style.SUCCESS(f"🔁 Merged '{alias}' into '{canonical_name}' and deleted alias."))

        self.stdout.write(self.style.SUCCESS(f"\n🎉 Tag merge complete. Updated {merged_count} tag assignments."))
