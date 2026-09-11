# test_connection.py
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mssql+pyodbc://@localhost/employeedata"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&trusted_connection=yes"
    "&TrustServerCertificate=yes",
)

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT TOP 5 * FROM employees"))
        for row in result:
            print(row)
    print("✅ Connection successful")
except Exception as e:
    print("❌ Connection failed:")
    print(e)