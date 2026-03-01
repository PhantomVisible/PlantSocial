import psycopg2

conn = psycopg2.connect("postgresql://plantsocial_user:plantsocial_password@localhost:5433/plantsocial")
cur = conn.cursor()
cur.execute("SELECT id FROM _user LIMIT 1")
row = cur.fetchone()
print(row[0] if row else "NO_USERS_FOUND")
cur.close()
conn.close()
