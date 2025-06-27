from sqlalchemy import create_engine, inspect
from app.core.config import settings

engine = create_engine(settings.database_url)
inspector = inspect(engine)
tables = inspector.get_table_names()
print('Tables:', tables)

if 'documents' in tables:
    columns = inspector.get_columns('documents')
    print('Documents table columns:')
    for col in columns:
        print(f'  {col["name"]}: {col["type"]}')
