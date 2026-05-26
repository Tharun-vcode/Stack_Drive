# 📂 StackDrive

StackDrive is a simple cloud-style file storage web application built using Flask and SQLite.  
Users can register, log in, upload files, categorize them, preview supported files, and manage their uploads through a clean dashboard interface.

---

## 🚀 Features

- User Registration & Login Authentication
- Secure Password Hashing
- File Upload & Download
- File Delete Functionality
- File Categorization
  - Docs
  - Images
  - Others
- Search Files by Name
- Filter Files by Category
- Sort Files by:
  - Name
  - Size
  - Date
  - Category
- File Preview Support
  - TXT Preview
  - PDF Preview
  - DOCX Preview
  - Image Thumbnails
- File Size Restriction (10MB)
- Upload Date Formatting
- Total File Count & Storage Usage
- Responsive Dashboard UI

---

## 🛠️ Tech Stack

### Backend
- Flask
- Flask-Login
- Flask-SQLAlchemy
- SQLite

### Frontend
- HTML
- CSS

### Database
- SQLite

---

## 📁 Project Structure

```bash
project/
│
├── app.py
├── requirements.txt
├── Procfile
├── database.db
├── uploads/
│
├── templates/
│   ├── index.html
│   ├── login.html
│   └── register.html
│
├── static/
│   └── style.css
```

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone <your-repo-link>
cd project
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Application

```bash
python app.py
```

Application runs on:

```bash
http://127.0.0.1:5000
```

---

## ☁️ Deploying on Render

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
gunicorn app:app
```

---

## 📦 Allowed File Types

- PDF
- TXT
- DOCX
- JPG
- JPEG
- PNG

---

## 📏 Upload Limits

Maximum file size:

```bash
10 MB
```

---

## 🔒 Authentication

- Session-based authentication using Flask-Login
- Passwords securely hashed using Werkzeug

---

## 📸 Preview Support

| File Type | Preview |
|-----------|---------|
| TXT | ✅ |
| PDF | ✅ |
| DOCX | ✅ |
| JPG/PNG | ✅ |

---

## 🎯 Future Improvements

- Bulk Download as ZIP
- Bulk Delete
- Drag & Drop Upload
- User Storage Quotas
- Dark Mode
- File Sharing Links

---

## 👨‍💻 Author

Developed as a 3rd Year College Mini Project using Flask and SQLite.
