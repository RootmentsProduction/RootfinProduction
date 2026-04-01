# Cross-Database Relationships: MongoDB ↔ PostgreSQL

## Scenario: Using MongoDB Data in PostgreSQL (and vice versa)

When you need to reference or use data from MongoDB in PostgreSQL models, here are the best approaches:

---

## 🎯 Common Scenarios

### Scenario 1: Reference MongoDB Data in PostgreSQL
- PostgreSQL model needs to reference a MongoDB document
- Example: PostgreSQL `Order` references MongoDB `User`

### Scenario 2: Sync Data Between Databases
- Keep certain data synchronized
- Example: User data in both databases

### Scenario 3: Query Across Databases
- Need data from both databases in one operation
- Example: Get user from MongoDB, get orders from PostgreSQL

---

## ✅ Solution 1: Store Reference ID (Recommended)

**Store the MongoDB ObjectId as a string in PostgreSQL**

### Example: PostgreSQL Order References MongoDB User

```javascript
// backend/models/sequelize/Order.js
import { DataTypes } from 'sequelize';
import { getSequelize } from '../../db/postgresql.js';

const Order = getSequelize().define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Store MongoDB User ID as string reference
  userId: {
    type: DataTypes.STRING,  // Stores MongoDB ObjectId as string
    allowNull: false,
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  // ... other fields
}, {
  tableName: 'orders',
  timestamps: true,
});

export default Order;
```

### Controller: Get Data from Both Databases

```javascript
// backend/controllers/OrderController.js
import Order from '../models/sequelize/Order.js';
import User from '../model/UserModel.js';  // MongoDB model

export const getOrderWithUser = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 1. Get order from PostgreSQL
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // 2. Get user from MongoDB using the stored userId
    const user = await User.findById(order.userId);
    
    // 3. Combine data
    res.json({
      order: order.toJSON(),
      user: user ? {
        id: user._id,
        username: user.username,
        email: user.email,
        // ... other user fields
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## ✅ Solution 2: Hybrid Approach - Store Key Data in Both

**Store essential reference data in PostgreSQL, full data in MongoDB**

### Example: User Data in Both Databases

```javascript
// PostgreSQL: Store minimal user reference
// backend/models/sequelize/Order.js
const Order = sequelize.define('Order', {
  // Store MongoDB user ID
  userId: {
    type: DataTypes.STRING,  // MongoDB ObjectId
    allowNull: false,
  },
  // Store user name for quick access (denormalized)
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userEmail: {
    type: DataTypes.STRING,
  },
  // ... order fields
});
```

### Controller: Use Both Sources

```javascript
export const createOrder = async (req, res) => {
  try {
    const { userId, ...orderData } = req.body;
    
    // 1. Get user from MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 2. Create order in PostgreSQL with user reference
    const order = await Order.create({
      ...orderData,
      userId: user._id.toString(),  // Store MongoDB ID
      userName: user.username,      // Denormalized for quick access
      userEmail: user.email,        // Denormalized
    });
    
    res.status(201).json(order.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## ✅ Solution 3: Service Layer Pattern (Best for Complex Cases)

**Create a service layer that handles cross-database operations**

### Service Layer

```javascript
// backend/services/OrderService.js
import Order from '../models/sequelize/Order.js';
import User from '../model/UserModel.js';  // MongoDB
import Transaction from '../model/Transaction.js';  // MongoDB

class OrderService {
  // Create order with user validation
  async createOrder(orderData) {
    // 1. Validate user exists in MongoDB
    const user = await User.findById(orderData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // 2. Create order in PostgreSQL
    const order = await Order.create({
      ...orderData,
      userId: user._id.toString(),
      userName: user.username,
    });
    
    // 3. Create transaction in MongoDB (if needed)
    if (orderData.createTransaction) {
      await Transaction.create({
        userId: user._id,
        orderId: order.id,
        amount: order.total,
        // ... other fields
      });
    }
    
    return order;
  }
  
  // Get order with full user details
  async getOrderWithUser(orderId) {
    // 1. Get order from PostgreSQL
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // 2. Get user from MongoDB
    const user = await User.findById(order.userId);
    
    // 3. Get related transactions from MongoDB
    const transactions = await Transaction.find({
      orderId: order.id,
    });
    
    return {
      order: order.toJSON(),
      user: user ? {
        id: user._id,
        username: user.username,
        email: user.email,
        locCode: user.locCode,
      } : null,
      transactions: transactions,
    };
  }
}

export default new OrderService();
```

### Controller Using Service

```javascript
// backend/controllers/OrderController.js
import OrderService from '../services/OrderService.js';

export const createOrder = async (req, res) => {
  try {
    const order = await OrderService.createOrder(req.body);
    res.status(201).json(order.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await OrderService.getOrderWithUser(orderId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## ✅ Solution 4: Data Synchronization (For Critical Data)

**Keep certain data synchronized between both databases**

### Sync Service

```javascript
// backend/services/UserSyncService.js
import { User as PGUser } from '../models/sequelize/index.js';
import User from '../model/UserModel.js';  // MongoDB

class UserSyncService {
  // Sync user from MongoDB to PostgreSQL
  async syncUserToPostgreSQL(mongoUserId) {
    // 1. Get user from MongoDB
    const mongoUser = await User.findById(mongoUserId);
    if (!mongoUser) {
      throw new Error('User not found in MongoDB');
    }
    
    // 2. Check if exists in PostgreSQL
    let pgUser = await PGUser.findOne({
      where: { email: mongoUser.email },
    });
    
    // 3. Create or update in PostgreSQL
    if (pgUser) {
      await pgUser.update({
        username: mongoUser.username,
        locCode: mongoUser.locCode,
        power: mongoUser.power,
      });
    } else {
      pgUser = await PGUser.create({
        id: mongoUser._id.toString(),  // Use MongoDB ID
        username: mongoUser.username,
        email: mongoUser.email,
        password: mongoUser.password,  // If needed
        locCode: mongoUser.locCode,
        power: mongoUser.power,
      });
    }
    
    return pgUser;
  }
  
  // Get user from either database
  async getUser(userId) {
    // Try PostgreSQL first
    let user = await PGUser.findByPk(userId);
    
    if (!user) {
      // Fallback to MongoDB
      const mongoUser = await User.findById(userId);
      if (mongoUser) {
        // Sync to PostgreSQL for future use
        user = await this.syncUserToPostgreSQL(userId);
      }
    }
    
    return user;
  }
}

export default new UserSyncService();
```

---

## 📊 Real-World Example: Order System

### Scenario:
- Users stored in MongoDB (existing)
- Orders stored in PostgreSQL (new feature)
- Need to show orders with user details

### Implementation:

```javascript
// backend/controllers/OrderController.js
import Order from '../models/sequelize/Order.js';
import User from '../model/UserModel.js';  // MongoDB

// Get all orders with user details
export const getOrdersWithUsers = async (req, res) => {
  try {
    // 1. Get all orders from PostgreSQL
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
    });
    
    // 2. Get unique user IDs
    const userIds = [...new Set(orders.map(o => o.userId))];
    
    // 3. Get users from MongoDB
    const users = await User.find({
      _id: { $in: userIds },
    });
    
    // 4. Create user map for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        id: user._id,
        username: user.username,
        email: user.email,
        locCode: user.locCode,
      };
    });
    
    // 5. Combine orders with user data
    const ordersWithUsers = orders.map(order => ({
      ...order.toJSON(),
      user: userMap[order.userId] || null,
    }));
    
    res.json(ordersWithUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 🎯 Best Practices

### ✅ DO:

1. **Store reference IDs** - Store MongoDB ObjectId as string in PostgreSQL
2. **Use service layer** - For complex cross-database operations
3. **Denormalize when needed** - Store frequently accessed data in both
4. **Handle errors** - Check if referenced data exists
5. **Cache when possible** - Reduce cross-database queries

### ❌ DON'T:

1. **Don't create foreign keys** - Can't enforce across databases
2. **Don't duplicate all data** - Only sync what's needed
3. **Don't make synchronous calls** - Can slow down operations
4. **Don't ignore data consistency** - Handle sync failures

---

## 🔄 Transaction Handling

**Note:** You can't have ACID transactions across both databases. Use these patterns:

### Pattern 1: Compensating Transactions

```javascript
async function createOrderWithTransaction(orderData) {
  let order = null;
  let transaction = null;
  
  try {
    // 1. Create order in PostgreSQL
    order = await Order.create(orderData);
    
    // 2. Create transaction in MongoDB
    transaction = await Transaction.create({
      orderId: order.id,
      // ... other fields
    });
    
    return { order, transaction };
  } catch (error) {
    // Rollback: Delete order if transaction failed
    if (order) {
      await Order.destroy({ where: { id: order.id } });
    }
    throw error;
  }
}
```

### Pattern 2: Event-Driven Sync

```javascript
// After creating order in PostgreSQL
order.on('created', async (order) => {
  // Async: Create related data in MongoDB
  await Transaction.create({
    orderId: order.id,
    // ...
  });
});
```

---

## 📝 Summary

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| **Reference ID** | Simple references | Simple, flexible | Need to query both DBs |
| **Hybrid Storage** | Frequently accessed together | Fast reads | Data duplication |
| **Service Layer** | Complex operations | Clean code, reusable | More code |
| **Synchronization** | Critical data | Consistent data | Sync complexity |

---

## ✅ Recommended Approach

**For most cases, use Solution 1 (Reference ID) + Service Layer:**

1. Store MongoDB IDs as strings in PostgreSQL
2. Create service layer for cross-database operations
3. Query both databases when needed
4. Handle errors gracefully

**This gives you flexibility without over-complicating!** 🚀

