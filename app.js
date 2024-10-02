const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
require("dotenv").config();
const rateLimitMiddleware = require("./utils/redisRateLimit");
const cors = require("cors");

var gitaRouter = require("./routes/bhagavadGita");
var chanakyaRouter = require("./routes/chanakya");
var sloganRouter = require("./routes/sanskritSlogan");
var vidurRouter = require("./routes/vidurNiti");

var app = express();

app.use(cors());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/healtz", (req, res) => {
  return res.status(200);
});

app.use(rateLimitMiddleware);
app.use("/api/v1/bahgavad_gita", gitaRouter);
app.use("/api/v1/chanakya", chanakyaRouter);
app.use("/api/v1/sanskrit", sloganRouter);
app.use("/api/v1/vidur_niti", vidurRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource could not be found",
      documentationUrl: "https://shloka.vercel.app/docs", // Link to API documentation
    },
  });
});

module.exports = app;
