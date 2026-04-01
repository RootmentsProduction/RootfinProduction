// Example: Using MongoDB Data in PostgreSQL Models
// This shows how to handle interconnected models across databases

// ============================================
// EXAMPLE 1: Simple Reference
// ============================================

import Order from '../models/sequelize/Order.js';  // PostgreSQL
import User from '../model/UserModel.js';          // MongoDB

// Get order with user details
export const getOrderWithUser = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 1. Get order from PostgreSQL
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // 2. Get user from MongoDB using stored userId
    const user = await User.findById(order.userId);
    
    // 3. Return combined data
    res.json({
      order: order.toJSON(),
      user: user ? {
        id: user._id,
        username: user.username,
        email: user.email,
        locCode: user.locCode,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// EXAMPLE 2: Create Order with User Validation
// ============================================

export const createOrderWithUser = async (req, res) => {
  try {
    const { userId, ...orderData } = req.body;
    
    // 1. Validate user exists in MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 2. Create order in PostgreSQL with user reference
    const order = await Order.create({
      ...orderData,
      userId: user._id.toString(),  // Store MongoDB ObjectId as string
      userName: user.username,        // Denormalized for quick access
      userEmail: user.email,         // Denormalized
    });
    
    res.status(201).json(order.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// EXAMPLE 3: Get Multiple Orders with Users
// ============================================

export const getOrdersWithUsers = async (req, res) => {
  try {
    // 1. Get all orders from PostgreSQL
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    
    // 2. Get unique user IDs
    const userIds = [...new Set(orders.map(o => o.userId))];
    
    // 3. Get users from MongoDB in one query
    const users = await User.find({
      _id: { $in: userIds },
    });
    
    // 4. Create user lookup map
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

// ============================================
// EXAMPLE 4: Using MongoDB Transaction with PostgreSQL Order
// ============================================

import Transaction from '../model/Transaction.js';  // MongoDB

export const createOrderWithTransaction = async (req, res) => {
  try {
    const { userId, orderData, transactionData } = req.body;
    
    // 1. Validate user in MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 2. Create order in PostgreSQL
    const order = await Order.create({
      ...orderData,
      userId: user._id.toString(),
    });
    
    // 3. Create transaction in MongoDB (linked to order)
    const transaction = await Transaction.create({
      ...transactionData,
      userId: user._id,
      orderId: order.id,  // Reference PostgreSQL order ID
      invoiceNo: order.orderNumber,
    });
    
    res.status(201).json({
      order: order.toJSON(),
      transaction: {
        id: transaction._id,
        invoiceNo: transaction.invoiceNo,
        amount: transaction.amount,
      },
    });
  } catch (error) {
    // If order was created, you might want to delete it
    // (compensating transaction pattern)
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// EXAMPLE 5: Service Layer Pattern
// ============================================

// Create a service to handle cross-database operations
class OrderService {
  async createOrderWithValidation(orderData) {
    // Validate user exists
    const user = await User.findById(orderData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create order
    const order = await Order.create({
      ...orderData,
      userId: user._id.toString(),
      userName: user.username,
    });
    
    return order;
  }
  
  async getOrderWithFullDetails(orderId) {
    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Get user
    const user = await User.findById(order.userId);
    
    // Get related transactions
    const transactions = await Transaction.find({
      orderId: order.id,
    });
    
    return {
      order: order.toJSON(),
      user: user ? {
        id: user._id,
        username: user.username,
        email: user.email,
      } : null,
      transactions: transactions.map(t => ({
        id: t._id,
        invoiceNo: t.invoiceNo,
        amount: t.amount,
      })),
    };
  }
}

export const orderService = new OrderService();

// ============================================
// USAGE NOTES:
// ============================================

/*
1. Store MongoDB ObjectId as STRING in PostgreSQL
   - MongoDB: ObjectId("507f1f77bcf86cd799439011")
   - PostgreSQL: "507f1f77bcf86cd799439011" (as VARCHAR/TEXT)

2. When querying:
   - Get data from PostgreSQL first
   - Use stored IDs to query MongoDB
   - Combine results

3. Error Handling:
   - Always check if referenced data exists
   - Handle cases where MongoDB data might be deleted

4. Performance:
   - Batch MongoDB queries when possible
   - Use lookup maps for multiple references
   - Consider caching frequently accessed data

5. Data Consistency:
   - Can't enforce foreign keys across databases
   - Handle orphaned references gracefully
   - Consider sync strategies for critical data
*/

