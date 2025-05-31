import re
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Delete users matching a regex pattern, with optional exclusion regex."

    def add_arguments(self, parser):
        parser.add_argument("--match-regex", type=str, help="Regex to match usernames for deletion.")
        parser.add_argument("--exclude-regex", type=str, help="Regex to exclude certain usernames.")
        parser.add_argument("--dry-run", action="store_true", help="Only show what would be deleted.")

    def handle(self, *args, **options):
        match_pattern = options["match_regex"]
        exclude_pattern = options["exclude_regex"]
        dry_run = options["dry_run"]

        if not match_pattern:
            self.stderr.write("❌ Please specify --match-regex.")
            return

        try:
            match_re = re.compile(match_pattern)
        except re.error as e:
            self.stderr.write(f"❌ Invalid match regex: {e}")
            return

        exclude_re = None
        if exclude_pattern:
            try:
                exclude_re = re.compile(exclude_pattern)
            except re.error as e:
                self.stderr.write(f"❌ Invalid exclude regex: {e}")
                return

        all_users = User.objects.all()
        to_delete = []

        for user in all_users:
            if match_re.search(user.username):
                if exclude_re and exclude_re.search(user.username):
                    continue
                to_delete.append(user)

        if dry_run:
            self.stdout.write(f"[DRY RUN] {len(to_delete)} users would be deleted:")
            for u in to_delete:
                self.stdout.write(f" - {u.username}")
        else:
            usernames = [u.username for u in to_delete]
            User.objects.filter(username__in=usernames).delete()
            self.stdout.write(f"✅ Deleted {len(usernames)} users.")
