import ExpenseTarget from "../model/ExpenseTarget.js";

// Save or Update Expense Target
export const saveExpenseTarget = async (req, res) => {
  try {
    const { storeCode, month, week, category, subCategory, targetAmount } = req.body;

    if (!storeCode || !month || !category || targetAmount === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const filter = {
      storeCode,
      month,
      week: week || "All",
      category,
      subCategory: subCategory || ""
    };

    const update = { targetAmount };

    // Upsert the target limit
    const target = await ExpenseTarget.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    return res.status(200).json({ success: true, target });
  } catch (error) {
    console.error("Error saving expense target:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Fetch Existing Target
export const getExpenseTarget = async (req, res) => {
  try {
    const { storeCode, month, week, category, subCategory } = req.query;

    const filter = {
      storeCode,
      month,
      week: week || "All",
      category,
      subCategory: subCategory || ""
    };

    const target = await ExpenseTarget.findOne(filter);

    if (target) {
      return res.status(200).json({ success: true, target });
    } else {
      return res.status(404).json({ success: false, message: "No target found" });
    }
  } catch (error) {
    console.error("Error fetching expense target:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Fetch All Targets (for dashboard aggregations)
export const getAllExpenseTargets = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = month ? { month } : {};
    
    const targets = await ExpenseTarget.find(filter);
    return res.status(200).json({ success: true, targets });
  } catch (error) {
    console.error("Error fetching all expense targets:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
