import os
from flask import Flask, render_template, request, redirect, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask import send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
from werkzeug.exceptions import RequestEntityTooLarge
from flask import send_file
from docx import Document
from flask import Response
import zipfile
from io import BytesIO




app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  


db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


# ================= MODELS =================

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))


class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200))
    filepath = db.Column(db.String(300))
    size = db.Column(db.Integer)
    category = db.Column(db.String(50))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ================= AUTH =================

@app.route('/register', methods=['GET', 'POST'])

def register():
    if request.method == 'POST':
        hashed = generate_password_hash(request.form['password'])

        user = User(
            username=request.form['username'],
            password=hashed
        )
        db.session.add(user)
        db.session.commit()

        return redirect('/login')

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()

        if user and check_password_hash(user.password, request.form['password']):
            login_user(user)
            return redirect('/')

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')


# ================= FILE =================

@app.route('/')
@login_required
def index():
    files_query = File.query.filter_by(user_id=current_user.id)

    # Category filter
    category = request.args.get('filter_category')
    if category:
        files_query = files_query.filter_by(category=category)

    # Search by file name
    search = request.args.get('search')
    if search:
        files_query = files_query.filter(File.filename.ilike(f'%{search}%'))

    # Sorting
    sort = request.args.get('sort')
    if sort == 'name':
        files_query = files_query.order_by(File.filename.asc())
    elif sort == 'size':
        files_query = files_query.order_by(File.size.desc())
    elif sort == 'date':
        files_query = files_query.order_by(File.uploaded_at.desc())
    elif sort == 'category':
        files_query = files_query.order_by(File.category.asc())

    files = files_query.all()

    # Stats
    total_files = len(files)
    total_size = sum(file.size for file in files)

    return render_template('index.html', files=files,
                           total_files=total_files,
                           total_size=total_size,
                           username=current_user.username,
                           sort=sort)


ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'txt', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
@login_required
def upload():
    file = request.files['file']
    category = request.form['category']

    if not file or file.filename == '':
        return "No file selected", 400

    ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'txt', 'docx', 'doc'}

    if '.' not in file.filename:
        return "Invalid file type! File must have an extension.", 400

    extension = file.filename.rsplit('.', 1)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return f"Invalid file type '{extension}'! Only PDF, JPG, JPEG, PNG, TXT, DOCX allowed.", 400

    filename = secure_filename(file.filename)

    base, ext = os.path.splitext(filename)
    counter = 1
    while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
        filename = f"{base}_{counter}{ext}"
        counter += 1

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    file.save(filepath)

    new_file = File(
        filename=filename,
        filepath=filepath,
        size=os.path.getsize(filepath),
        category=category,
        user_id=current_user.id
    )

    db.session.add(new_file)
    db.session.commit()

    return redirect('/')

# Serve uploaded files
@app.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.errorhandler(RequestEntityTooLarge)
def file_too_large(e):
    return "File is too large! Max 10MB allowed.", 413

@app.route('/download/<int:file_id>')
@login_required
def download(file_id):
    file = File.query.get(file_id)
    return send_file(file.filepath, as_attachment=True)

@app.route('/preview/docx/<filename>')
@login_required
def preview_docx(filename):
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(path):
        return "File not found", 404

    try:
        doc = Document(path)
        full_text = "\n".join([para.text for para in doc.paragraphs])

        return Response(full_text, mimetype='text/plain')

    except Exception as e:
        return f"Error reading DOCX: {str(e)}", 500

@app.route('/delete/<int:file_id>')
@login_required
def delete(file_id):
    file = File.query.get(file_id)

    if file and file.user_id == current_user.id:
        os.remove(file.filepath)
        db.session.delete(file)
        db.session.commit()

    return redirect('/')


# ================= RUN =================

if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')

    with app.app_context():
        db.create_all()

    app.run(debug=True)