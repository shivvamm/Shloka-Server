const express = require("express");
const router = express.Router();
const path = require("path");
const sanskritSlogan = require("./../public/shlokas/shloksvalid");
const { getDataFromCache, setDataInCache } = require("../utils/redisCache");
const { registerFont, createCanvas } = require("canvas");
registerFont(
  path.join(
    __dirname,
    "../public/fonts/NotoSansDevanagari-VariableFont_wdth,wght.ttf"
  ),
  { family: "Noto Sans Devanagari" }
);

/* GET Single  Random Sanskrit Slogan  */
router.get("/slogan/random", async (req, res) => {
  try {
    const indexNo = Math.floor(
      Math.random() * (sanskritSlogan["sanskrit-slogan"].length - 1) + 1
    );
    // Check if the data is already cached in Redis
    const cacheKey = `Slogan:random:${indexNo}`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      data = sanskritSlogan["sanskrit-slogan"][indexNo];
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

/* GET All  Sanskrit Slogan with pagination  */
router.get("/slogan", async (req, res) => {
  let { page, limit } = req.query;
  try {
    if (!page) page = 1;
    if (!limit) limit = 10;
    // Check if the data is already cached in Redis
    const cacheKey = `Slogan:${page}:${limit}`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      const startIndex = parseInt((page - 1) * limit + 1);
      const endIndex = parseInt(page * limit);
      const logicalPage = parseInt(
        sanskritSlogan["sanskrit-slogan"].length / 10
      );
      const logicalLimit = 10;
      data = sanskritSlogan["sanskrit-slogan"].slice(startIndex, endIndex);
      if (data.length === 0) {
        return res.status(500).json({
          success: false,
          message: `Please select the page in range of ${logicalPage} with limit of ${logicalLimit} or you can modify becaue the total shloks is  is ${sanskritSlogan["sanskrit-slogan"].length}`,
        });
      }
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

/* GET All Sanskrit Slogan  */
router.get("/all", async (req, res) => {
  try {
    // Check if the data is already cached in Redis
    const cacheKey = `Slogan:all`;
    let data = await getDataFromCache(cacheKey);

    if (!data) {
      data = sanskritSlogan["sanskrit-slogan"];
      // Store the fetched data in Redis cache
      await setDataInCache(cacheKey, data, 3600);
    }

    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

/* GET All Sanskrit Slogan  */
router.get("/slogan/image", async (req, res) => {
  try {
    const indexNo = Math.floor(
      Math.random() * (sanskritSlogan["sanskrit-slogan"].length - 1) + 1
    );
    const shlok = sanskritSlogan["sanskrit-slogan"][indexNo];
    const shlokText = shlok["Sloka"];

    const width = 800;
    const height = 80;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.font = '20px "Noto Sans Devanagari"';
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    context.font = "20px Arial";
    context.fillStyle = "#000000";
    context.fillText(shlokText, 10, 50);

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
