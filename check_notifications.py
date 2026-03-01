import psycopg2

try:
    conn = psycopg2.connect("postgresql://plantsocial_user:plantsocial_password@localhost:5433/plantsocial")
    cur = conn.cursor()
    cur.execute("SELECT id, user_id, message, is_read, created_at FROM notification ORDER BY created_at DESC LIMIT 5")
    rows = cur.fetchall()
    if rows:
        for row in rows:
            print(f"ID: {row[0]}, User: {row[1]}, Message: {row[2]}, Read: {row[3]}, Time: {row[4]}")
    else:
        print("No notifications found.")
    cur.close()
    conn.close()
except psycopg2.Error as e:
    print(f"Database error: {e}")
