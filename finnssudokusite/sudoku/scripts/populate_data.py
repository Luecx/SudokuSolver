import os
import sys
import django
import random
import json
import zlib
from datetime import datetime, timedelta

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoku_site.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth.models import User
from sudoku.models import Sudoku, Tag, UserSudokuOngoing, UserSudokuFinished

def create_sample_puzzle_data():
    """Creates a sample 9x9 Sudoku puzzle as compressed JSON."""
    # Sample incomplete puzzle (0 represents empty cells)
    puzzle_grid = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ]
    
    puzzle_data = {
        'grid': puzzle_grid,
        'constraints': [],
        'regions': [],
        'given_digits': sum(1 for row in puzzle_grid for cell in row if cell != 0)
    }
    
    # Compress and return
    json_data = json.dumps(puzzle_data)
    compressed_data = zlib.compress(json_data.encode('utf-8'))
    return compressed_data


def create_sample_board_state(completion_percentage=50):
    """Creates a sample board state for ongoing/finished puzzles."""
    # Sample board state with some cells filled
    board_state = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ]
    
    # Randomly remove some cells based on completion percentage
    if completion_percentage < 100:
        cells_to_remove = int(81 * (100 - completion_percentage) / 100)
        for _ in range(cells_to_remove):
            row = random.randint(0, 8)
            col = random.randint(0, 8)
            board_state[row][col] = 0
    
    board_data = {
        'grid': board_state,
        'moves': [],
        'notes': {},
        'completion': completion_percentage
    }
    
    json_data = json.dumps(board_data)
    compressed_data = zlib.compress(json_data.encode('utf-8'))
    return compressed_data


def create_tags():
    """Create sample tags."""
    tag_names = [
        'Standard', 'Diagonal', 'Killer', 'Thermo', 'Arrow', 'Sandwich',
        'Diagonal Sums', 'Kropki', 'Palindrome',
        'Whisper', 'Renban', 'XV', 'Anti-Chess'
    ]
    
    tags = []
    for name in tag_names:
        tag, created = Tag.objects.get_or_create(name=name)
        tags.append(tag)
        if created:
            print(f"Created tag: {name}")
    
    return tags


def create_users(count=20):
    """Create sample users."""
    users = []
    for i in range(count):
        username = f"user{i+1}"
        email = f"user{i+1}@example.com"
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            users.append(User.objects.get(username=username))
            continue
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password="password123",  # Set a default password
            first_name=f"User{i+1}",
            last_name="Test"
        )
        users.append(user)
        print(f"Created user: {username} (password: password123)")
    
    return users


def create_sudokus(users, tags, count=30):
    """Create random Sudoku puzzles."""
    puzzle_titles = [
        'Classic Challenge', 'Morning Puzzle', 'Brain Teaser', 'Quick Solve',
        'Advanced Logic', 'Daily Special', 'Expert Level', 'Beginner Friendly',
        'Time Trial', 'Pattern Master', 'Logic Grid', 'Number Dance',
        'Mind Bender', 'Puzzle Paradise', 'Grid Master', 'Number Quest',
        'Logic Challenge', 'Brain Workout', 'Sudoku Supreme', 'Grid Genius'
    ]
    
    sudokus = []
    compressed_puzzle = create_sample_puzzle_data()
    
    for i in range(count):
        title = f"{random.choice(puzzle_titles)} #{random.randint(100, 9999)}"
        creator = random.choice(users)
        
        sudoku = Sudoku.objects.create(
            title=title,
            created_by=creator,
            puzzle=compressed_puzzle,
            is_public=random.choice([True, True, True, False]),  # 75% public
            attempts=random.randint(1, 100),
            solves=random.randint(0, 50),
            total_time=random.randint(300, 7200),  # 5 minutes to 2 hours
            average_time=random.randint(600, 3600),  # 10 minutes to 1 hour
            average_rating=random.uniform(3.0, 5.0),
            ratings_count=random.randint(1, 20)
        )
        
        # Add random tags
        num_tags = random.randint(1, 4)
        selected_tags = random.sample(tags, min(num_tags, len(tags)))
        sudoku.tags.set(selected_tags)
        
        sudokus.append(sudoku)
        print(f"Created Sudoku: {title}")
    
    return sudokus


def create_ongoing_puzzles(users, sudokus, count=50):
    """Create ongoing puzzle records."""
    for i in range(count):
        user = random.choice(users)
        sudoku = random.choice(sudokus)
        
        # Check if this combination already exists
        if UserSudokuOngoing.objects.using('ongoing_db').filter(user_id=user.id, sudoku_id=sudoku.id).exists():
            continue
        
        completion_pct = random.randint(10, 95)
        total_time = random.randint(300, 5400)
        
        ongoing = UserSudokuOngoing(
            user_id=user.id,
            sudoku_id=sudoku.id,
            attempts=random.randint(1, 5),
            current_time=random.randint(60, 1800),
            total_time=total_time,
            first_attempt=timezone.now() - timedelta(days=random.randint(1, 30)),
            saved_board_state=create_sample_board_state(completion_pct),
            completion_percentage=completion_pct
        )
        
        ongoing.save(using='ongoing_db')
        print(f"Created ongoing puzzle for user {user.id}: sudoku {sudoku.id}")


def create_finished_puzzles(users, sudokus, count=80):
    """Create finished puzzle records."""
    
    for i in range(count):
        user = random.choice(users)
        sudoku = random.choice(sudokus)
        
        completion_time = random.randint(300, 3600)
        started_time = timezone.now() - timedelta(days=random.randint(1, 60))
        
        finished = UserSudokuFinished(
            user_id=user.id,
            sudoku_id=sudoku.id,
            attempts_to_solve=random.randint(1, 3),
            completion_time=completion_time,
            total_time_spent=completion_time + random.randint(0, 600),
            started_at=started_time,
            rating=random.randint(3, 5) if random.random() > 0.3 else None,
            comment="",
        )
        
        finished.save(using='finished_db')
        print(f"Created finished puzzle for user {user.id}: sudoku {sudoku.id}")

def main():
    """Main function to populate the database."""
    print("Starting database population...")
    
    # Create tags
    print("\n1. Creating tags...")
    tags = create_tags()
    
    # Create users
    print("\n2. Creating users...")
    users = create_users(20)
    
    # Create sudokus
    print("\n3. Creating Sudoku puzzles...")
    sudokus = create_sudokus(users, tags, 30)
    
    # Create ongoing puzzles
    print("\n4. Creating ongoing puzzles...")
    create_ongoing_puzzles(users, sudokus, 50)
    
    # Create finished puzzles
    print("\n5. Creating finished puzzles...")
    create_finished_puzzles(users, sudokus, 80)
    
    print("\nDatabase population completed!")
    print(f"Created:")
    print(f"- {len(tags)} tags")
    print(f"- {len(users)} users")
    print(f"- {len(sudokus)} Sudoku puzzles")
    print(f"- {UserSudokuOngoing.objects.using('ongoing_db').count()} ongoing puzzles")
    print(f"- {UserSudokuFinished.objects.using('finished_db').count()} finished puzzles")


if __name__ == "__main__":
    main()