import os
from flask import Flask, render_template, request, redirect, url_for, flash
import pymysql

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'employee-complaint-secret-key')

# MySQL Configuration from environment variables
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
MYSQL_DB = os.environ.get('MYSQL_DB', 'employee_db')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))

def get_db_connection():
    try:
        return pymysql.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            port=MYSQL_PORT,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
    except pymysql.err.OperationalError as e:
        if e.args[0] == 1045 and MYSQL_USER == 'root' and MYSQL_PASSWORD != '':
            return pymysql.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password='',
                database=MYSQL_DB,
                port=MYSQL_PORT,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
        raise e

def init_db():
    try:
        try:
            conn = pymysql.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                port=MYSQL_PORT,
                autocommit=True
            )
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1045 and MYSQL_USER == 'root' and MYSQL_PASSWORD != '':
                conn = pymysql.connect(
                    host=MYSQL_HOST,
                    user=MYSQL_USER,
                    password='',
                    port=MYSQL_PORT,
                    autocommit=True
                )
            else:
                raise e
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}`")
        conn.close()

        # Create table if it doesn't exist
        db_conn = get_db_connection()
        with db_conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS complaints (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    employee_id VARCHAR(50) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    position VARCHAR(100) NOT NULL,
                    incident_date DATE NOT NULL,
                    nature_of_complaint VARCHAR(100) NOT NULL,
                    incident_description TEXT NOT NULL,
                    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        db_conn.close()
    except Exception as e:
        print(f"[Warning] Could not initialize database on startup: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    first_name = request.form.get('first_name', '').strip()
    last_name = request.form.get('last_name', '').strip()
    employee_id = request.form.get('employee_id', '').strip()
    department = request.form.get('department', '').strip()
    position = request.form.get('position', '').strip()
    incident_date = request.form.get('incident_date', '').strip()
    nature_of_complaint = request.form.get('nature_of_complaint', '').strip()
    incident_description = request.form.get('incident_description', '').strip()
    acknowledgement = request.form.get('acknowledgement') == 'yes'

    # Validation
    if not all([first_name, last_name, employee_id, department, position, incident_date, nature_of_complaint, incident_description]):
        flash("Please fill in all required fields.", "error")
        return redirect(url_for('index'))

    if not acknowledgement:
        flash("You must acknowledge that the information is true and accurate.", "error")
        return redirect(url_for('index'))

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = """
                INSERT INTO complaints (
                    first_name, last_name, employee_id, department, position,
                    incident_date, nature_of_complaint, incident_description, acknowledged
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(query, (
                first_name, last_name, employee_id, department, position,
                incident_date, nature_of_complaint, incident_description, acknowledgement
            ))
        conn.close()
        flash("Thank you! Your complaint has been submitted successfully.", "success")
    except Exception as e:
        flash(f"Database error: {str(e)}", "error")

    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
