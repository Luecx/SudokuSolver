# scripts/create_random_users.py
import random
import string
from django.contrib.auth.models import User

def random_username():
    return ''.join(random.choices(string.ascii_lowercase, k=8)) + str(random.randint(100, 999))

def run(n=20):
    created = 0
    for _ in range(n):
        username = random_username()
        if not User.objects.filter(username=username).exists():
            email = f"{username}@example.com"
            User.objects.create_user(username=username, email=email, password="test1234")
            created += 1
    print(f"✔️ Created {created} new users.")
