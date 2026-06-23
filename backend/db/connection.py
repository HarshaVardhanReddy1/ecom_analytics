import os
import logging
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

def build_database_url():
    encoded_user = quote_plus(DB_USER)
    encoded_password = quote_plus(DB_PASSWORD)
    url = f"mysql+pymysql://{encoded_user}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.info(f"MySQL URL: mysql+pymysql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    return url

try:
    DATABASE_URL = build_database_url()
    engine = create_engine(DATABASE_URL, echo=False)
    logger.info("SQLAlchemy engine created successfully for MySQL")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}", exc_info=True)
    raise

def run_query(sql: str):
    try:
        logger.debug(f"Query: {sql[:200]}..." if len(sql) > 200 else f"Query: {sql}")

        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]

            logger.info(f"Query executed successfully - Rows returned: {len(rows)}")
            return {"columns": columns, "rows": rows}
    except Exception as e:
        logger.error(f"Query execution failed: {str(e)}", exc_info=True)
        raise

def get_schema():
    try:
        logger.info(f"Fetching schema from database '{DB_NAME}'")
        with engine.connect() as conn:
            cols_result = conn.execute(text("""
                SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = :db
                ORDER BY TABLE_NAME, ORDINAL_POSITION
            """), {"db": DB_NAME})

            schema = {}
            for table, column, col_type, data_type in cols_result:
                if table not in schema:
                    schema[table] = []
                display_type = col_type if data_type == "enum" else data_type
                schema[table].append(f"{column} ({display_type})")

            fk_result = conn.execute(text("""
                SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = :db
                AND REFERENCED_TABLE_NAME IS NOT NULL
            """), {"db": DB_NAME})

            fks = [
                f"  {table}.{col} → {ref_table}.{ref_col}"
                for table, col, ref_table, ref_col in fk_result
            ]

            schema_str = "\n".join(
                f"Table: {table}\n" + "\n".join(f"  - {c}" for c in cols)
                for table, cols in schema.items()
            )

            if fks:
                schema_str += "\n\nForeign Keys:\n" + "\n".join(fks)

            logger.info(f"Schema fetched successfully - Found {len(schema)} tables")
            return schema_str
    except Exception as e:
        logger.error(f"Failed to fetch schema: {str(e)}", exc_info=True)
        raise