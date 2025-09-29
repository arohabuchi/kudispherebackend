const express = require("express");
const AdminBankDetail = require("../models/adminBankDetail"); // adjust path if needed
// const { checkAdminRole } = require("../middleware/authMiddleware"); // import your admin middleware


const adminBankRoute = express.Router();



const checkAdminRole = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// ✅ CREATE bank detail (Admin only)
adminBankRoute.post("/admin/bank-details", checkAdminRole, async (req, res) => {
  try {
    const { userId, bankDetails } = req.body;

    if (!userId || !bankDetails) {
      return res.status(400).json({ error: "userId and bankDetails are required" });
    }

    const newDetail = new AdminBankDetail({
      userId,
      bankDetails,
    });

    await newDetail.save();

    res.status(201).json({
      message: "Admin bank detail created successfully",
      data: newDetail,
    });
  } catch (err) {
    console.error("Create AdminBankDetail error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Get the very first AdminBankDetail document
adminBankRoute.get("/admin/bank-details/first", async (req, res) => {
  try {
    // Just fetch the first document in the collection
    const detail = await AdminBankDetail.findOne();

    if (!detail) {
      return res.status(404).json({ error: "No bank detail found" });
    }

    res.status(200).json(detail);
  } catch (err) {
    console.error("Error fetching first AdminBankDetail:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ GET all bank details (Admin only)
adminBankRoute.get("/api/admin/bank-details", checkAdminRole, async (req, res) => {
  try {
    const details = await AdminBankDetail.find().populate("userId", "name email role");
    res.status(200).json(details);
  } catch (err) {
    console.error("Fetch AdminBankDetails error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ GET single bank detail by ID (Admin only)
adminBankRoute.get("/api/admin/bank-details/:id", checkAdminRole, async (req, res) => {
  try {
    const detail = await AdminBankDetail.findById(req.params.id).populate("userId", "name email role");
    if (!detail) {
      return res.status(404).json({ error: "Bank detail not found" });
    }
    res.status(200).json(detail);
  } catch (err) {
    console.error("Fetch single AdminBankDetail error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ UPDATE bank detail by ID (Admin only)
adminBankRoute.put("/api/admin/bank-details/:id", checkAdminRole, async (req, res) => {
  try {
    const { bankDetails } = req.body;

    const updatedDetail = await AdminBankDetail.findByIdAndUpdate(
      req.params.id,
      { bankDetails },
      { new: true, runValidators: true }
    );

    if (!updatedDetail) {
      return res.status(404).json({ error: "Bank detail not found" });
    }

    res.status(200).json({
      message: "Bank detail updated successfully",
      data: updatedDetail,
    });
  } catch (err) {
    console.error("Update AdminBankDetail error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ DELETE bank detail by ID (Admin only)
adminBankRoute.delete("/api/admin/bank-details/:id", checkAdminRole, async (req, res) => {
  try {
    const deletedDetail = await AdminBankDetail.findByIdAndDelete(req.params.id);
    if (!deletedDetail) {
      return res.status(404).json({ error: "Bank detail not found" });
    }
    res.status(200).json({ message: "Bank detail deleted successfully" });
  } catch (err) {
    console.error("Delete AdminBankDetail error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = adminBankRoute;
