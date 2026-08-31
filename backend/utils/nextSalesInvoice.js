// backend/utils/nextSalesInvoice.js
import SalesInvoice from "../model/SalesInvoice.js";

export async function nextSalesInvoice(locCode, prefix = "INV-") {
  try {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const invoices = await SalesInvoice.find({
      locCode: locCode,
      invoiceNumber: { $regex: `^${escapedPrefix}` }
    }, { invoiceNumber: 1 }).lean();

    let maxNumber = 0;
    for (const inv of invoices) {
      if (inv.invoiceNumber) {
        const numberPart = inv.invoiceNumber.replace(prefix, "");
        const currentNumber = parseInt(numberPart, 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    }

    let nextNumber = maxNumber + 1;
    let candidate = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

    while (await SalesInvoice.exists({ invoiceNumber: candidate })) {
      nextNumber++;
      candidate = `${prefix}${nextNumber.toString().padStart(6, '0')}`;
    }

    return candidate;
    
  } catch (error) {
    console.error("Error generating next sales invoice number:", error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
}

// Generate unique invoice number globally (across all locations)
export async function nextGlobalSalesInvoice(prefix = "INV-") {
  try {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const invoices = await SalesInvoice.find({
      invoiceNumber: { $regex: `^${escapedPrefix}` }
    }, { invoiceNumber: 1 }).lean();

    let maxNumber = 0;
    for (const inv of invoices) {
      if (inv.invoiceNumber) {
        const numberPart = inv.invoiceNumber.replace(prefix, "");
        const currentNumber = parseInt(numberPart, 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    }

    let nextNumber = maxNumber + 1;
    let candidate = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

    while (await SalesInvoice.exists({ invoiceNumber: candidate })) {
      nextNumber++;
      candidate = `${prefix}${nextNumber.toString().padStart(6, '0')}`;
    }

    return candidate;
    
  } catch (error) {
    console.error("Error generating next global sales invoice number:", error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
}

