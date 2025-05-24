class DatabaseRouter:
    """
    A router to control all database operations on models for different
    databases
    """
    
    def db_for_read(self, model, **hints):
        """Suggest the database that should be read from."""
        if model._meta.app_label == 'sudoku':
            if model._meta.model_name == 'usersudokufinished':
                return 'finished_db'
            elif model._meta.model_name == 'usersudokuongoing':
                return 'ongoing_db'
        return None

    def db_for_write(self, model, **hints):
        """Suggest the database that should be written to."""
        if model._meta.app_label == 'sudoku':
            if model._meta.model_name == 'usersudokufinished':
                return 'finished_db'
            elif model._meta.model_name == 'usersudokuongoing':
                return 'ongoing_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if models are in the same app."""
        db_set = {'default', 'finished_db', 'ongoing_db'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that certain models get created on the right database."""
        if app_label == 'sudoku':
            if model_name == 'usersudokufinished':
                return db == 'finished_db'
            elif model_name == 'usersudokuongoing':
                return db == 'ongoing_db'
            else:
                # Sudoku and Tag models go to default database
                return db == 'default'
        
        # Allow auth and other Django apps on all databases
        if app_label in ['auth', 'contenttypes', 'sessions', 'admin']:
            return True
            
        return db == 'default'