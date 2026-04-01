# Example: Creating a New Feature with PostgreSQL

This guide shows you how to create a new feature using PostgreSQL **without affecting** your existing MongoDB features.

---

## Example: Add "Notifications" Feature

### Step 1: Create PostgreSQL Model

```javascript
// backend/models/sequelize/Notification.js
import { DataTypes } from 'sequelize';
import { getSequelize } from '../../db/postgresql.js';

const sequelize = getSequelize();

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  type: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'success'),
    defaultValue: 'info',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

export default Notification;
```

### Step 2: Add to Models Index

```javascript
// backend/models/sequelize/index.js
import Notification from './Notification.js';

export {
  // ... existing exports
  Notification,
};
```

### Step 3: Create Controller (NEW - Uses PostgreSQL)

```javascript
// backend/controllers/NotificationController.js
import { Notification } from '../models/sequelize/index.js';

// Create notification
export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all notifications for user
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications.map(n => n.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.update(
      { isRead: true },
      { where: { id } }
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Step 4: Create Routes (NEW)

```javascript
// backend/route/NotificationRoutes.js
import express from 'express';
import {
  createNotification,
  getNotifications,
  markAsRead,
} from '../controllers/NotificationController.js';

const router = express.Router();

router.post('/notifications', createNotification);
router.get('/notifications/user/:userId', getNotifications);
router.patch('/notifications/:id/read', markAsRead);

export default router;
```

### Step 5: Add to Server

```javascript
// backend/server.js
import NotificationRoutes from './route/NotificationRoutes.js';

// ... existing routes
app.use('/api', NotificationRoutes);
```

---

## ✅ What Happens?

### Existing Features (MongoDB) - **UNCHANGED**

```javascript
// backend/controllers/LoginAndSignup.js - STILL WORKS
import User from '../model/UserModel.js';  // MongoDB

export const SignUp = async (req, res) => {
  const user = await User.findOne({ email });  // MongoDB query
  // ... existing code unchanged
};
```

### New Feature (PostgreSQL) - **SEPARATE**

```javascript
// backend/controllers/NotificationController.js - NEW
import { Notification } from '../models/sequelize/index.js';  // PostgreSQL

export const createNotification = async (req, res) => {
  const notification = await Notification.create(req.body);  // PostgreSQL query
  // ... new code
};
```

**Both work independently!** ✅

---

## 🧪 Testing

### Test Existing Feature (MongoDB)
```bash
# Existing endpoint - still works
POST /user/signup
# Uses MongoDB - unchanged
```

### Test New Feature (PostgreSQL)
```bash
# New endpoint - uses PostgreSQL
POST /api/notifications
GET /api/notifications/user/:userId
# Uses PostgreSQL - separate
```

---

## 📊 Result

- ✅ **Existing MongoDB features**: Working (unchanged)
- ✅ **New PostgreSQL feature**: Working (separate)
- ✅ **No conflicts**: Different code paths
- ✅ **Both databases**: Active simultaneously

---

## 🎯 Key Points

1. **New model** in `backend/models/sequelize/`
2. **New controller** (don't modify existing ones)
3. **New routes** (separate from existing)
4. **Existing code** remains untouched

**That's it!** Your new PostgreSQL feature works alongside existing MongoDB features! 🚀

