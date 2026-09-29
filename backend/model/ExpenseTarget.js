import mongoose from 'mongoose';

const expenseTargetSchema = new mongoose.Schema({
  storeCode: {
    type: String,
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  week: {
    type: String,
    default: "All",
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    default: "",
  },
  targetAmount: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

// Create a compound index to ensure uniqueness per store, month, week, category, subCategory
expenseTargetSchema.index({ storeCode: 1, month: 1, week: 1, category: 1, subCategory: 1 }, { unique: true });

const ExpenseTarget = mongoose.model('ExpenseTarget', expenseTargetSchema);
export default ExpenseTarget;
