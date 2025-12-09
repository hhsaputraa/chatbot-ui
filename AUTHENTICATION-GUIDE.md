# Authentication System - Implementation Guide

## Overview

Sistem autentikasi lengkap telah diimplementasikan untuk BPR Supra Chatbot menggunakan JWT (JSON Web Token). Sistem ini melindungi semua halaman aplikasi dan memastikan hanya user yang terautentikasi yang dapat mengakses fitur chatbot dan admin.

---

## 📁 File Structure

```
src/
├── composables/
│   └── useAuth.js                 # Authentication composable (login, register, logout, token management)
├── views/
│   ├── Auth/
│   │   ├── Login.vue              # Login page
│   │   ├── Register.vue           # Registration page
│   │   └── auth.css               # Shared auth styling
│   ├── Chat/
│   │   ├── index.vue              # Chat page (updated with auth)
│   │   └── style.css              # Chat styling (updated with logout button)
│   ├── ImproveQuery/
│   │   └── index.vue              # Admin page (updated with auth)
│   └── ImproveKnowledge/
│       └── index.vue              # Admin page (updated with auth)
├── router/
│   └── index.js                   # Router with navigation guards
└── main.js                        # App entry point (auth initialization)
```

---

## 🔐 Features Implemented

### 1. **Authentication Pages**

#### **Login Page (`/login`)**
- Username dan password input fields
- Password visibility toggle
- Form validation
- Error message display
- Auto-redirect jika sudah login
- Redirect ke halaman yang dituju setelah login
- Link ke halaman register

#### **Register Page (`/register`)**
- Full name, username, email, password, confirm password fields
- Client-side validation:
  - Username minimal 3 karakter, hanya huruf/angka/underscore
  - Email format validation
  - Password minimal 6 karakter
  - Password confirmation match
- Real-time field validation
- Error message display
- Auto-redirect jika sudah login
- Link ke halaman login

---

### 2. **Route Protection**

#### **Protected Routes (Require Authentication)**
- `/` - Chat page
- `/testing` - Testing page
- `/pdftesting` - PDF Testing page
- `/improve_query` - Improve Query admin page
- `/improve_knowledge` - Improve Knowledge admin page

#### **Public Routes (No Authentication Required)**
- `/login` - Login page
- `/register` - Register page

#### **Navigation Guard Logic**
```javascript
// If user tries to access protected route without token
→ Redirect to /login with return URL

// If user tries to access /login or /register while logged in
→ Redirect to / (chat page)
```

---

### 3. **Token Management**

#### **Storage**
- JWT token disimpan di `localStorage` dengan key `jwt_token`
- User data disimpan di `localStorage` dengan key `user_data`

#### **Authorization Header**
Semua API requests sekarang include Authorization header:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <jwt_token>'
}
```

#### **Token Expiration Handling**
- Jika API returns 401 Unauthorized:
  - Clear token dari localStorage
  - Redirect ke /login
  - Show error message "Sesi Anda telah berakhir"

---

### 4. **API Integration**

#### **Backend Endpoints (Assumed)**
```
POST /auth/login
  Request: { username, password }
  Response: { token, user }

POST /auth/register
  Request: { fullname, username, email, password }
  Response: { message }
```

#### **Updated API Calls**
- `src/views/Chat/index.vue` - `/api/query` endpoint
- `src/views/ImproveQuery/index.vue` - All admin endpoints
- `src/views/ImproveKnowledge/index.vue` - All admin endpoints

---

### 5. **User Interface**

#### **Sidebar Updates**
- **User Info Display**: Shows logged-in username/fullname
- **Logout Button**: Red button with logout icon
- **Improve AI Button**: Existing button maintained

#### **Styling**
- Dark theme consistent dengan aplikasi
- Gradient backgrounds untuk buttons
- Smooth transitions dan hover effects
- Responsive design untuk mobile dan desktop
- Loading states untuk semua actions

---

## 🚀 Usage Guide

### **For Users**

#### **1. Register New Account**
1. Buka aplikasi di browser
2. Click "Daftar di sini" di halaman login
3. Isi form registrasi:
   - Nama Lengkap
   - Username (minimal 3 karakter)
   - Email (format valid)
   - Password (minimal 6 karakter)
   - Konfirmasi Password
4. Click "Daftar"
5. Redirect ke login page dengan success message

#### **2. Login**
1. Masukkan username dan password
2. Click "Login"
3. Redirect ke chat page
4. Token tersimpan otomatis

#### **3. Using the App**
- Semua fitur chatbot dan admin tersedia
- Token otomatis included di semua API requests
- Session persistent sampai logout atau token expired

#### **4. Logout**
1. Click tombol "Logout" di sidebar (bottom)
2. Token cleared dari localStorage
3. Redirect ke login page

---

## 🔧 Configuration

### **Backend API Endpoints**

Update di `.env` jika backend endpoints berbeda:
```env
VITE_API_BASE_URL=http://localhost:8097
```

### **Backend Response Format**

#### **Login Response (Expected)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "fullname": "John Doe",
    "email": "john@example.com"
  }
}
```

**Alternative formats supported**:
- `access_token` instead of `token`
- `jwt` instead of `token`

#### **Register Response (Expected)**
```json
{
  "message": "Registrasi berhasil"
}
```

#### **Error Response (Expected)**
```json
{
  "error": "Invalid credentials",
  "message": "Username atau password salah"
}
```

---

## 🧪 Testing Checklist

### **Authentication Flow**
- [ ] Register new user dengan data valid
- [ ] Register dengan username yang sudah ada (should fail)
- [ ] Register dengan email invalid (should fail)
- [ ] Register dengan password tidak match (should fail)
- [ ] Login dengan credentials yang benar
- [ ] Login dengan credentials yang salah (should fail)
- [ ] Access protected route tanpa login (should redirect to /login)
- [ ] Access /login saat sudah login (should redirect to /)
- [ ] Logout dan verify token cleared

### **Token Management**
- [ ] Token tersimpan di localStorage setelah login
- [ ] Token included di API requests
- [ ] 401 response triggers logout
- [ ] Token persistent setelah refresh page
- [ ] Multiple tabs share same auth state

### **UI/UX**
- [ ] Login page styling sesuai dark theme
- [ ] Register page styling sesuai dark theme
- [ ] Password visibility toggle works
- [ ] Form validation shows errors
- [ ] Loading states during API calls
- [ ] Error messages displayed correctly
- [ ] Success messages displayed correctly
- [ ] Logout button visible di sidebar
- [ ] User info displayed di sidebar
- [ ] Responsive di mobile dan desktop

---

## 📝 Code Examples

### **Using Auth in Components**

```javascript
import { useAuth } from '@/composables/useAuth'

const { 
  currentUser,      // Current logged-in user
  isAuthenticated,  // Boolean: is user logged in?
  login,            // Function: login(username, password)
  register,         // Function: register(userData)
  logout,           // Function: logout()
  getAuthHeaders    // Function: get headers with token
} = useAuth()

// Check if authenticated
if (isAuthenticated.value) {
  console.log('User is logged in:', currentUser.value)
}

// Make authenticated API call
const response = await fetch(`${API_BASE_URL}/api/endpoint`, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
})
```

---

## 🔒 Security Considerations

### **Current Implementation**
- ✅ JWT token stored in localStorage
- ✅ Token included in Authorization header
- ✅ Protected routes with navigation guards
- ✅ 401 handling with auto-logout
- ✅ Client-side validation

### **Recommendations for Production**
1. **HTTPS Only**: Ensure backend uses HTTPS in production
2. **Token Expiration**: Implement token refresh mechanism
3. **CSRF Protection**: Add CSRF tokens for state-changing operations
4. **Rate Limiting**: Implement rate limiting on login/register endpoints
5. **Password Strength**: Enforce stronger password requirements
6. **Session Timeout**: Add automatic logout after inactivity
7. **Secure Storage**: Consider using httpOnly cookies instead of localStorage

---

## 🐛 Troubleshooting

### **Problem: Login tidak berhasil**
**Solution**:
1. Check backend server is running
2. Verify API endpoint di `.env`
3. Check browser console for errors
4. Verify backend response format matches expected format

### **Problem: Token tidak tersimpan**
**Solution**:
1. Check localStorage is enabled di browser
2. Check browser console for errors
3. Verify backend returns token in response

### **Problem: Redirect loop**
**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Login again

### **Problem: 401 errors setelah login**
**Solution**:
1. Verify token format di Authorization header
2. Check backend expects `Bearer <token>` format
3. Verify token is valid and not expired

---

## 📚 API Documentation

### **Backend Endpoints Required**

#### **POST /auth/login**
```
Request:
{
  "username": "string",
  "password": "string"
}

Response (Success - 200):
{
  "token": "string",
  "user": {
    "id": number,
    "username": "string",
    "fullname": "string",
    "email": "string"
  }
}

Response (Error - 401):
{
  "error": "string",
  "message": "string"
}
```

#### **POST /auth/register**
```
Request:
{
  "fullname": "string",
  "username": "string",
  "email": "string",
  "password": "string"
}

Response (Success - 201):
{
  "message": "string"
}

Response (Error - 400):
{
  "error": "string",
  "message": "string"
}
```

---

## ✅ Summary

Sistem autentikasi lengkap telah diimplementasikan dengan fitur:

1. ✅ **Login & Register Pages** - UI lengkap dengan validation
2. ✅ **Route Protection** - Navigation guards untuk protected routes
3. ✅ **Token Management** - JWT storage dan auto-include di API calls
4. ✅ **Logout Functionality** - Button di sidebar dengan clear token
5. ✅ **Error Handling** - 401 handling dengan auto-logout
6. ✅ **User Info Display** - Show logged-in user di sidebar
7. ✅ **Dark Theme Styling** - Consistent dengan aplikasi
8. ✅ **Responsive Design** - Mobile dan desktop support

**Status**: ✅ Ready for Testing  
**Next Steps**: Test dengan backend API dan adjust sesuai response format

---

**Date**: 2025-12-03  
**Developer**: AI Assistant (Augment Agent)

