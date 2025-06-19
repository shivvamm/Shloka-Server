const express = require('express');
const router = express.Router();
const path = require("path");
const chanakyaShloks = require('./../public/shlokas/shloksvalid')
const { getDataFromCache, setDataInCache } = require('../utils/redisCache')
const { registerFont, createCanvas } = require("canvas");
registerFont(
  path.join(
    __dirname,
    "../public/fonts/NotoSansDevanagari-VariableFont_wdth,wght.ttf"
  ),
  { family: "Noto Sans Devanagari" }
);

/* GET Single  Random Chanakya Slokas  */
router.get('/shloka/random', async (req, res,) => {
  try {
    const indexNo = Math.floor(Math.random() * (chanakyaShloks["Chanakya Slokas"].length - 1) + 1);
    // Check if the data is already cached in Redis
    const cacheKey = `Chanakya:random:${indexNo}`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      data = chanakyaShloks["Chanakya Slokas"][indexNo];
      // Store the fetched data in Redis cache
      await setDataInCache(cacheKey, data, 3600)
    }


    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    })
  }
});

/* GET All  Chanakya Slokas with pagination  */
router.get('/shloka', async (req, res) => {
  let { page, limit } = req.query;
  try {
    if (!page) page = 1;
    if (!limit) limit = 10;
    // Check if the data is already cached in Redis
    const cacheKey = `Chanakya:${page}:${limit}`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      const startIndex = parseInt((page - 1) * limit + 1);
      const endIndex = parseInt(page * limit);
      const logicalPage = parseInt(chanakyaShloks["Chanakya Slokas"].length / 10);
      const logicalLimit = 10;
      data = chanakyaShloks["Chanakya Slokas"].slice(startIndex, endIndex);
      if (data.length === 0) {
        return res.status(500).json({
          success: false,
          message: `Please select the page in range of ${logicalPage} with limit of ${logicalLimit} or you can modify becaue the total shloks is  is ${chanakyaShloks["Chanakya Slokas"].length}`
        })
      }

      // Store the fetched data in Redis cache
      await setDataInCache(cacheKey, data, 3600)
    }

    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    })
  }
});


/* GET All Chanakya Slokas  */
router.get('/all', async (req, res) => {
  try {
    // Check if the data is already cached in Redis
    const cacheKey = `Chanakya:all`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      data = chanakyaShloks["Chanakya Slokas"];
      // Store the fetched data in Redis cache
      await setDataInCache(cacheKey, data, 3600)
    }

    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    })
  }
});

/* GET Chanakya random shloka image with beautiful bhagwa styling */
router.get("/shloka/image", async (req, res) => {
  try {
    const indexNo = Math.floor(Math.random() * (chanakyaShloks["Chanakya Slokas"].length - 1) + 1);
    const shlok = chanakyaShloks["Chanakya Slokas"][indexNo];
    const shlokText = shlok["Sloka"];

    const width = 1200;
    const height = 300;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // Bhagwa gradient background
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#FF9933"); // Bhagwa orange
    gradient.addColorStop(0.5, "#FF7700"); // Deeper orange
    gradient.addColorStop(1, "#FF5500"); // Rich saffron
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    // Add subtle pattern/texture
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        context.fillRect(i, j, 2, 2);
      }
    }

    // Main text styling
    context.font = '28px "Noto Sans Devanagari"';
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.textBaseline = "middle";
    
    // Add text shadow
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.shadowBlur = 4;

    // Wrap text if too long
    const maxWidth = width - 100;
    const words = shlokText.split(' ');
    let line = '';
    let y = height / 2;
    
    if (context.measureText(shlokText).width > maxWidth) {
      const lines = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const lineHeight = 35;
      y = (height - (lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, index) => {
        context.fillText(line, width / 2, y + index * lineHeight);
      });
    } else {
      context.fillText(shlokText, width / 2, y);
    }

    // Add decorative elements
    context.shadowColor = "transparent";
    context.fillStyle = "rgba(255, 255, 255, 0.3)";
    context.font = "20px serif";
    context.textAlign = "left";
    context.fillText("॥ चाणक्य नीति ॥", 30, 40);
    context.textAlign = "right";
    context.fillText("आचार्य चाणक्य", width - 30, height - 30);

    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
