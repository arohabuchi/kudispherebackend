const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ImageModel = require("../models/adminCoinAddress");

const imageRouter = express.Router();

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG and PNG allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// ✅ Upload endpoint
imageRouter.post("/api/images", upload.single("testImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "❌ No image file received." });
    }

    const { name, coinType, currentPrice, gasfee } = req.body;
    console.log("REQ BODY:", req.body);
    console.log("REQ FILE:", req.file);

    const newImage = new ImageModel({
      name,
      coinType,
      image: req.file.path,
      currentPrice,
      gasfee,
    });

    await newImage.save();
    res.status(201).json({ msg: "✅ Image uploaded successfully!", image: newImage });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to get a unique list of coin types, case-insensitive
imageRouter.get("/api/images/coin-types", async (req, res) => {
    try {
        // Use aggregation to find unique coin types, ignoring case
        const coinTypes = await ImageModel.aggregate([
            {
                $group: {
                    // Group by the lowercase version of the coinType to make it case-insensitive
                    _id: { $toLower: "$coinType" }
                }
            },
            {
                // Project the result to return the unique coin type list
                $project: {
                    _id: 0, // Exclude the _id field from the final result
                    coinType: "$_id"
                }
            },
            {
                // Sort the results alphabetically
                $sort: {
                    coinType: 1
                }
            }
        ]);

        // Map the aggregation result to a simple array of strings
        const uniqueCoinTypes = coinTypes.map(type => type.coinType);
        res.json(uniqueCoinTypes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET endpoint to fetch all coins (all images)
imageRouter.get("/api/images/all", async (req, res) => {
    try {
        const images = await ImageModel.find(); // Fetch all documents
        res.json(images);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST endpoint to upload a new image


// GET endpoint to retrieve all images
// GET endpoint to fetch the first item by coinType
imageRouter.get("/api/images/by-coin/:coinType", async (req, res) => {
  try {
    const { coinType } = req.params;

    // Find first document matching coinType (case-insensitive)
    const item = await ImageModel.findOne({
      coinType: { $regex: new RegExp(`^${coinType}$`, "i") }
    });

    if (!item) {
      return res.status(404).json({ message: `No item found for coinType: ${coinType}` });
    }

    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// GET endpoint to retrieve a single image by its ID
imageRouter.get("/api/images/:id", async (req, res) => {
    try {
        const image = await ImageModel.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ msg: "Image not found." });
        }
        res.json(image);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT endpoint to update an existing image
imageRouter.put("/images/:id", upload.single('testImage'), async (req, res) => {
    try {
        const updates = req.body;
        if (req.file) {
            updates.image = req.file.path; // Update the image path if a new file is uploaded
        }

        const updatedImage = await ImageModel.findByIdAndUpdate(req.params.id, updates, { new: true });
        
        if (!updatedImage) {
            return res.status(404).json({ msg: "Image not found." });
        }
        
        res.json(updatedImage);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
 
// DELETE endpoint to delete an image by its ID
imageRouter.delete("/api/images/:id", async (req, res) => {
    try {
        const deletedImage = await ImageModel.findByIdAndDelete(req.params.id);
        if (!deletedImage) {
            return res.status(404).json({ msg: "Image not found." });
        }
        res.json({ msg: "Image deleted successfully." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



module.exports = imageRouter;
