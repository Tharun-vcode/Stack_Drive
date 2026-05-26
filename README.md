# 📂 StackDrive

StackDrive – A secure file management web application enabling user authentication, file upload/download, category-based organization, multi-format preview (PDF, DOCX, TXT, images), search/filter/sort functionality, and real-time storage analytics using Flask and SQLite.

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

## ScreenShots: 


<img width="951" height="501" alt="image" src="https://github.com/user-attachments/assets/23c28e2e-2e1a-4ea8-990f-42ec8e211cb0" />
<img width="950" height="501" alt="image" src="https://github.com/user-attachments/assets/12302dc4-2dbc-4597-a4af-57a36a545c25" />
<img width="948" height="503" alt="image" src="https://github.com/user-attachments/assets/4032151f-ed26-4205-85e8-6c53d135c188" />

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
