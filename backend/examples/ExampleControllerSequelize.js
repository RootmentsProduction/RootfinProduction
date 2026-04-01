// Example: How to Update Controllers to Use Sequelize (PostgreSQL)
// This file shows how to convert MongoDB/Mongoose code to Sequelize

// ============================================
// OLD WAY (MongoDB with Mongoose)
// ============================================
/*
import User from '../model/UserModel.js';

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ locCode: req.query.locCode });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/

// ============================================
// NEW WAY (PostgreSQL with Sequelize)
// ============================================

import { User } from '../models/sequelize/index.js';

// Get user by ID
export const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Convert to plain object (Sequelize returns model instance)
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const [updatedRows] = await User.update(req.body, {
      where: { id: req.params.id },
      returning: true, // Return updated rows (PostgreSQL specific)
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch updated user
    const user = await User.findByPk(req.params.id);
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const deletedRows = await User.destroy({
      where: { id: req.params.id },
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users with filtering
export const getAllUsers = async (req, res) => {
  try {
    const whereClause = {};
    
    // Add filters
    if (req.query.locCode) {
      whereClause.locCode = req.query.locCode;
    }
    if (req.query.power) {
      whereClause.power = req.query.power;
    }
    
    const users = await User.findAll({
      where: whereClause,
      // Optional: Add ordering
      order: [['createdAt', 'DESC']],
      // Optional: Add pagination
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
    });
    
    // Convert array of instances to plain objects
    res.json(users.map(user => user.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find user by email (example)
export const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email },
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// KEY DIFFERENCES TO REMEMBER:
// ============================================

/*
1. ID FIELD:
   - MongoDB: _id (ObjectId)
   - PostgreSQL: id (UUID)

2. FIND BY ID:
   - MongoDB: User.findById(id)
   - PostgreSQL: User.findByPk(id)

3. FIND ONE:
   - MongoDB: User.findOne({ email: '...' })
   - PostgreSQL: User.findOne({ where: { email: '...' } })

4. FIND ALL:
   - MongoDB: User.find({ locCode: '...' })
   - PostgreSQL: User.findAll({ where: { locCode: '...' } })

5. UPDATE:
   - MongoDB: User.updateOne({ _id: id }, { field: value })
   - PostgreSQL: User.update({ field: value }, { where: { id } })

6. DELETE:
   - MongoDB: User.deleteOne({ _id: id })
   - PostgreSQL: User.destroy({ where: { id } })

7. RESPONSE FORMAT:
   - MongoDB: Returns plain objects
   - PostgreSQL: Returns model instances, use .toJSON() for plain object

8. WHERE CLAUSES:
   - MongoDB: Direct object { field: value }
   - PostgreSQL: Nested in where: { field: value }

9. COMPLEX QUERIES:
   - Both support similar patterns, but syntax differs
   - Sequelize has powerful query builder for complex queries

10. TRANSACTIONS:
    - PostgreSQL supports ACID transactions
    - Use sequelize.transaction() for multiple operations
*/

// ============================================
// TRANSACTION EXAMPLE (PostgreSQL benefit)
// ============================================

import { sequelize, Transaction, User } from '../models/sequelize/index.js';

export const transferTransaction = async (req, res) => {
  // PostgreSQL supports transactions - great for financial operations!
  const t = await sequelize.transaction();
  
  try {
    // Multiple operations that must succeed together
    const transaction = await Transaction.create(req.body, { transaction: t });
    await User.update(
      { lastTransactionDate: new Date() },
      { where: { id: req.body.userId }, transaction: t }
    );
    
    // Commit transaction
    await t.commit();
    
    res.json(transaction.toJSON());
  } catch (error) {
    // Rollback on error
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

