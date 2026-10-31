import os
from datetime import timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, session
import pymysql
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'employee-complaint-secret-key')
app.permanent_session_lifetime = timedelta(days=30)

# MySQL Configuration from environment variables
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'admin')
MYSQL_DB = os.environ.get('MYSQL_DB', 'employee_db')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))

def get_db_connection():
    passwords_to_try = [MYSQL_PASSWORD]
    for alt in ['admin', '']:
        if alt not in passwords_to_try:
            passwords_to_try.append(alt)

    last_err = None
    for pwd in passwords_to_try:
        try:
            return pymysql.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password=pwd,
                database=MYSQL_DB,
                port=MYSQL_PORT,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1045 and MYSQL_USER == 'root':
                last_err = e
                continue
            raise e
    if last_err:
        raise last_err

def init_db():
    try:
        passwords_to_try = [MYSQL_PASSWORD]
        for alt in ['admin', '']:
            if alt not in passwords_to_try:
                passwords_to_try.append(alt)

        conn = None
        for pwd in passwords_to_try:
            try:
                conn = pymysql.connect(
                    host=MYSQL_HOST,
                    user=MYSQL_USER,
                    password=pwd,
                    port=MYSQL_PORT,
                    autocommit=True
                )
                break
            except pymysql.err.OperationalError as e:
                if e.args[0] == 1045 and MYSQL_USER == 'root':
                    continue
                raise e

        if conn is None:
            return

        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}`")
        conn.close()

        # Create tables
        db_conn = get_db_connection()
        with db_conn.cursor() as cur:
            # Employees table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS employees (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id VARCHAR(50) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    position VARCHAR(100) DEFAULT '',
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Complaints table
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

            # Seed demo employee if not already present
            cur.execute("SELECT id FROM employees WHERE employee_id = 'EMP-2048' LIMIT 1")
            demo_user = cur.fetchone()
            if not demo_user:
                hashed_pw = generate_password_hash('password123')
                cur.execute("""
                    INSERT INTO employees (employee_id, first_name, last_name, email, department, position, password_hash)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, ('EMP-2048', 'Sarah', 'Jenkins', 'sarah.jenkins@company.com', 'Operations & Tech', 'Software Engineer', hashed_pw))
                print("[Init] Demo employee Sarah Jenkins (EMP-2048) seeded successfully.")

        db_conn.close()
    except Exception as e:
        print(f"[Warning] Could not initialize database on startup: {e}")

@app.route('/')
@app.route('/index.html')
@app.route('/complaint')
@app.route('/complaints')
def index():
    employee = session.get('employee')
    return render_template('index.html', employee=employee)

@app.route('/login', methods=['GET', 'POST'])
@app.route('/signin', methods=['GET', 'POST'])
@app.route('/login.html')
def login():
    if request.method in ['GET', 'HEAD']:
        if 'employee' in session:
            return redirect(url_for('index'))
        return render_template('login.html')

    # POST: Process Sign In
    identifier = request.form.get('identifier', '').strip()
    password = request.form.get('password', '')
    remember = request.form.get('remember') == 'yes'

    if not identifier or not password:
        flash("Please provide your Employee ID/Email and password.", "error")
        return redirect(url_for('login'))

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, employee_id, first_name, last_name, email, department, position, password_hash
                FROM employees
                WHERE employee_id = %s OR email = %s
                LIMIT 1
            """, (identifier, identifier))
            user = cur.fetchone()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            session.permanent = remember
            session['employee'] = {
                'id': user['id'],
                'employee_id': user['employee_id'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'email': user['email'],
                'department': user['department'],
                'position': user.get('position', '')
            }
            flash(f"Welcome back, {user['first_name']}! You are successfully signed in as {user['employee_id']}.", "success")
            return redirect(url_for('index'))
        else:
            flash("Invalid Employee ID/Email or password. Please verify your credentials.", "error")
            return redirect(url_for('login'))
    except Exception as e:
        flash(f"Sign in error: {str(e)}", "error")
        return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
@app.route('/signup.html')
@app.route('/register', methods=['GET', 'POST'])
def signup():
    if request.method in ['GET', 'HEAD']:
        if 'employee' in session:
            return redirect(url_for('index'))
        return render_template('signup.html')

    # POST: Process Sign Up / Registration
    first_name = request.form.get('first_name', '').strip()
    last_name = request.form.get('last_name', '').strip()
    employee_id = request.form.get('employee_id', '').strip().upper()
    email = request.form.get('email', '').strip().lower()
    department = request.form.get('department', '').strip()
    position = request.form.get('position', '').strip()
    password = request.form.get('password', '')
    confirm_password = request.form.get('confirm_password', '')
    declaration = request.form.get('declaration') == 'yes'

    if not all([first_name, last_name, employee_id, email, department, position, password, confirm_password]):
        flash("All fields are required to register your employee account.", "error")
        return redirect(url_for('signup'))

    if not declaration:
        flash("You must confirm compliance with the corporate code of ethics.", "error")
        return redirect(url_for('signup'))

    if len(password) < 6:
        flash("Password must be at least 6 characters long.", "error")
        return redirect(url_for('signup'))

    if password != confirm_password:
        flash("Passwords do not match. Please re-enter them carefully.", "error")
        return redirect(url_for('signup'))

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Check for existing employee ID or Email
            cur.execute("SELECT id FROM employees WHERE employee_id = %s OR email = %s LIMIT 1", (employee_id, email))
            existing = cur.fetchone()
            if existing:
                conn.close()
                flash("An account with this Employee ID or Email is already registered. Please sign in.", "error")
                return redirect(url_for('login'))

            hashed_pw = generate_password_hash(password)
            cur.execute("""
                INSERT INTO employees (employee_id, first_name, last_name, email, department, position, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (employee_id, first_name, last_name, email, department, position, hashed_pw))
            new_id = cur.lastrowid
        conn.close()

        # Automatically sign the new employee in
        session['employee'] = {
            'id': new_id,
            'employee_id': employee_id,
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'department': department,
            'position': position
        }
        flash(f"Account registered successfully! Welcome to the portal, {first_name}.", "success")
        return redirect(url_for('index'))
    except Exception as e:
        flash(f"Registration error: {str(e)}", "error")
        return redirect(url_for('signup'))

@app.route('/logout')
def logout():
    session.pop('employee', None)
    flash("You have been signed out safely.", "success")
    return redirect(url_for('login'))

@app.route('/style.css')
@app.route('/complaint/style.css')
@app.route('/complaints/style.css')
def serve_css():
    return send_from_directory(os.path.join(app.root_path, 'templates'), 'style.css')

@app.route('/script.js')
@app.route('/complaint/script.js')
@app.route('/complaints/script.js')
def serve_js():
    return send_from_directory(os.path.join(app.root_path, 'templates'), 'script.js')

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

    # Fallback to session values if user is logged in and form field was omitted
    employee = session.get('employee')
    if employee:
        first_name = first_name or employee.get('first_name')
        last_name = last_name or employee.get('last_name')
        employee_id = employee_id or employee.get('employee_id')
        department = department or employee.get('department')
        position = position or employee.get('position')

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
        flash("Thank you! Your complaint has been submitted successfully to HR Ethics.", "success")
    except Exception as e:
        flash(f"Database error: {str(e)}", "error")

    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
