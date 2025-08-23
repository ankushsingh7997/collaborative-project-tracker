# 📌 Collaborative Project Tracker - Backend

A **real-time collaborative project management system** with authentication, project & task management, file uploads, and live updates via WebSockets.

---

## 🏗️ System Architecture

### **Tech Stack**
- **Frontend**: Next.js 14+ (JavaScript, React)  
- **Backend**: Node.js with Express.js (JavaScript)  
- **Database**: MongoDB with Mongoose ODM  
- **Authentication**: JWT-based authentication  
- **Real-time**: Socket.io for WebSocket connections  
- **File Upload**: Multer for handling file attachments  
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend)  

---

## 🗄️ Database Schema

### **Users Collection**
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  avatar: String (URL),
  createdAt: Date,
  updatedAt: Date
}
```

### **Project Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  deadline: Date,
  owner: ObjectId (ref: User),
  members: [ObjectId] (ref: User),
  inviteCode: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```
### **Task Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String (enum: 'todo', 'in-progress', 'done'),
  priority: String (enum: 'low', 'medium', 'high'),
  assignee: ObjectId (ref: User),
  project: ObjectId (ref: Project),
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: ObjectId (ref: User),
    uploadedAt: Date
  }],
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### **Comment Collection**
```javascript
{
  _id: ObjectId,
  content: String,
  author: ObjectId (ref: User),
  task: ObjectId (ref: Task),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 API Endpoints

### 🟢 Authentication
- **POST** `/api/auth/register` → User registration  
- **POST** `/api/auth/login` → User login  
- **GET** `/api/auth/me` → Get current user info  

### 📁 Projects
- **GET** `/api/projects` → Get user's projects  
- **POST** `/api/projects` → Create new project  
- **GET** `/api/projects/:id` → Get project details  
- **PUT** `/api/projects/:id` → Update project (owner only)  
- **DELETE** `/api/projects/:id` → Delete project (owner only)  
- **POST** `/api/projects/join` → Join project via invite code  

### ✅ Tasks
- **GET** `/api/projects/:projectId/tasks` → Get project tasks  
- **POST** `/api/projects/:projectId/tasks` → Create new task  
- **PUT** `/api/tasks/:id` → Update task  
- **DELETE** `/api/tasks/:id` → Delete task  
- **POST** `/api/tasks/:id/upload` → Upload task attachment  

### 💬 Comments
- **GET** `/api/tasks/:taskId/comments` → Get task comments  
- **POST** `/api/tasks/:taskId/comments` → Create comment  
- **PUT** `/api/comments/:id` → Update comment (author only)  
- **DELETE** `/api/comments/:id` → Delete comment (author/owner only)  
## 🔗 API Endpoints

### 🟢 Authentication
- **POST** `/api/auth/register` → User registration  
- **POST** `/api/auth/login` → User login  
- **GET** `/api/auth/me` → Get current user info  

### 📁 Projects
- **GET** `/api/projects` → Get user's projects  
- **POST** `/api/projects` → Create new project  
- **GET** `/api/projects/:id` → Get project details  
- **PUT** `/api/projects/:id` → Update project (owner only)  
- **DELETE** `/api/projects/:id` → Delete project (owner only)  
- **POST** `/api/projects/join` → Join project via invite code  

### ✅ Tasks
- **GET** `/api/projects/:projectId/tasks` → Get project tasks  
- **POST** `/api/projects/:projectId/tasks` → Create new task  
- **PUT** `/api/tasks/:id` → Update task  
- **DELETE** `/api/tasks/:id` → Delete task  
- **POST** `/api/tasks/:id/upload` → Upload task attachment  

### 💬 Comments
- **GET** `/api/tasks/:taskId/comments` → Get task comments  
- **POST** `/api/tasks/:taskId/comments` → Create comment  
- **PUT** `/api/comments/:id` → Update comment (author only)  
- **DELETE** `/api/comments/:id` → Delete comment (author/owner only)  

## ⚡ WebSocket Events

### 🟢 Client → Server
- **joinProject** → Join project room for real-time updates  
- **leaveProject** → Leave project room  
- **taskStatusUpdate** → Notify task status change  
- **typingComment** → User is typing a comment  
- **stopTypingComment** → User stopped typing  

### 🔵 Server → Client
- **taskCreated** → New task created  
- **taskUpdated** → Task updated  
- **taskDeleted** → Task deleted  
- **commentCreated** → New comment added  
- **commentUpdated** → Comment updated  
- **commentDeleted** → Comment deleted  
- **userTyping** → User is typing  
- **userStoppedTyping** → User stopped typing  


## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone <repository-url>
cd project-tracker/backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.production .env
```

4. Update environment variables in `.env`:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `CLIENT_URL`: Your frontend URL (for CORS)

5. Create uploads directory
```bash
mkdir uploads
```

6. Start the development server
```bash
npm run dev
```

The server will start on http://localhost:5000

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user info

### Project Endpoints  
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (owner only)
- `DELETE /api/projects/:id` - Delete project (owner only)
- `POST /api/projects/join` - Join project via invite code

### Task Endpoints
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks/project/:projectId` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/upload` - Upload task attachment

### Comment Endpoints
- `GET /api/comments/task/:taskId` - Get task comments
- `POST /api/comments/task/:taskId` - Create comment
- `PUT /api/comments/:id` - Update comment (author only)
- `DELETE /api/comments/:id` - Delete comment (author/owner only)

## WebSocket Events

### Client to Server
- `joinProject` - Join project room for real-time updates
- `leaveProject` - Leave project room
- `taskStatusUpdate` - Notify task status change
- `typingComment` - User is typing a comment
- `stopTypingComment` - User stopped typing

### Server to Client
- `taskCreated` - New task created
- `taskUpdated` - Task updated
- `taskDeleted` - Task deleted
- `commentCreated` - New comment added
- `commentUpdated` - Comment updated
- `commentDeleted` - Comment deleted
- `userTyping` - User is typing
- `userStoppedTyping` - User stopped typing

## Security Features
- JWT authentication
- Password hashing with bcrypt
- Input validation
- Rate limiting
- CORS configuration
- File upload restrictions
- MongoDB injection prevention

## Testing
```bash
npm run production
