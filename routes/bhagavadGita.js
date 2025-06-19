var express = require("express");
var router = express.Router();
const path = require("path");
const gitaShloks = require("./../public/shlokas/gitashloks.json");
const { getDataFromCache, setDataInCache } = require("../utils/redisCache");
const { registerFont, createCanvas } = require("canvas");
registerFont(
  path.join(
    __dirname,
    "../public/fonts/NotoSansDevanagari-VariableFont_wdth,wght.ttf"
  ),
  { family: "Noto Sans Devanagari" }
);

/* GET Bhagavad_gita shoka by chapter no and verse  */
router.get("/shloka", async (req, res) => {
  const { chapter, verse } = req.query;
  if (!chapter || !verse) {
    return res.status(400).json({
      success: false,
      message: "Please provide Chapter and Verse",
    });
  }
  try {
    if (chapter > 18 || chapter < 1) {
      return res.status(400).json({
        success: false,
        message: "Please provide a Valid Chapter and Verse",
      });
    } else if (verse < 1 || verse > gitaShloks[chapter].length) {
      return res.status(400).json({
        success: false,
        message: "Please provide a Valid  Verse",
      });
    } else {
      // Check if the data is already cached in Redis
      const cacheKey = `Gita:${chapter}:${verse}`;
      let data = await getDataFromCache(cacheKey);

      if (!data) {
        data = gitaShloks[chapter][verse];
        data["Chapter"] = chapter;
        // Store the fetched data in Redis cache
        await setDataInCache(cacheKey, data, 3600);
      }

      // If not cached, fetch the data and store it in Redis cache

      return res.status(200).json(data);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/all", async (req, res) => {
  let { chapter, page, limit } = req.query;
  if (!chapter || chapter < 1 || chapter > 18) {
    return res.status(400).json({
      success: false,
      message: "Please provide a Valid Chapter",
    });
  }
  try {
    if (!page) page = 1;
    if (!limit) limit = 10;
    // Check if the data is already cached in Redis
    const cacheKey = `Gita:all:${chapter}:${page}:${limit}`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      const temp = gitaShloks[chapter];
      const chapterNo = {
        chapter: chapter,
      };
      const starIndex = parseInt((page - 1) * limit + 1);
      const endIndex = parseInt(page * limit);
      const logicalPage = parseInt(temp.length / 10);
      const logicalLimit = 10;
      data = temp.slice(starIndex - 1, endIndex);
      if (data.length == 0) {
        return res.status(500).json({
          success: false,
          message: `Please select the page in range of ${logicalPage} with limit of ${logicalLimit} or you can modify becaue the total verses in this chapter is ${temp.length}`,
        });
      }
      data.unshift(chapterNo);
      // Store the fetched data in Redis cache
      await setDataInCache(cacheKey, data, 3600);
    }

    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/random", async (req, res) => {
  try {
    let chapter = Math.floor(Math.random() * (18 - 1) + 1);
    let verse = Math.floor(
      Math.random() * (gitaShloks[chapter].length - 1) + 1
    );

    // Check if the data is already cached in Redis
    const cacheKey = `Gita:random:${chapter}:${verse}`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      data = gitaShloks[chapter][verse];
      data["Chapter"] = chapter;
      // Store the fetched data in Redis cache
      await setDataInCache(cacheKey, data, 3600);
    }

    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/random/by", async (req, res) => {
  const { chapter } = req.query;
  if (!chapter) {
    return res.status(400).json({
      success: false,
      message: "Please provide Chapter",
    });
  }
  try {
    if (chapter < 1 || chapter > 18) {
      return res.status(400).json({
        success: false,
        message: "Please provide a Valid Chapter",
      });
    } else {
      const verse = Math.floor(
        Math.random() * (gitaShloks[chapter].length - 1) + 1
      );
      // Check if the data is already cached in Redis
      const cacheKey = `Gita:randomBy:${chapter}:${verse}`;
      let data = await getDataFromCache(cacheKey);
      if (!data) {
        data = gitaShloks[chapter][verse];
        data["Chapter"] = chapter;

        // Store the fetched data in Redis cache
        await setDataInCache(cacheKey, data, 3600);
      }

      return res.status(200).json(data);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

/* GET Bhagavad_gita random shoka image with beautiful bhagwa styling */
router.get("/image", async (req, res) => {
  try {
    let chapter = Math.floor(Math.random() * (18 - 1) + 1);
    let verse = Math.floor(
      Math.random() * (gitaShloks[chapter].length - 1) + 1
    );
    data = gitaShloks[chapter][verse];
    shlokText = data["Shloka"];
    
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
    context.fillText("॥ श्रीमद्भगवद्गीता ॥", 30, 40);
    context.textAlign = "right";
    context.fillText(`अध्याय ${chapter}, श्लोक ${verse}`, width - 30, height - 30);

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
