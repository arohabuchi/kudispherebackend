const express = require("express");
const multer = require("multer");
const path = require("path");
const ImageModel = require("../models/adminCoinAddress"); // Corrected model import

const imageRouter = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the directory where uploaded files will be stored.
        // The 'uploads' folder must be created manually in the root directory.
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Create a unique filename for the uploaded image.
        // This prevents naming conflicts and makes filenames predictable.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Create a file filter function to restrict file types
const fileFilter = (req, file, cb) => {
    // Check the file's mimetype
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file with an error message
        cb(null, false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter // Apply the file filter to the multer middleware
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


// POST endpoint to upload a new image
imageRouter.post("/api/images", upload.single('testImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Invalid file type. Only JPEG and PNG are allowed." });
        }
        
        const { name, coinType, currentPrice, gasfee } = req.body;
        
        const newImage = new ImageModel({
            name: name,
            coinType: coinType,
            image: req.file.path, // Save the path to the uploaded image
            currentPrice: currentPrice,
            gasfee: gasfee
        });

        await newImage.save();
        res.status(201).json({ msg: 'Image uploaded successfully!', image: newImage });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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
imageRouter.put("/api/images/:id", upload.single('testImage'), async (req, res) => {
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
