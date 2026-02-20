const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const HARDCODED_USERNAME = "admin";
const HARDCODED_PASSWORD = "admin123";

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Missing username or password" });
  }

  if (username !== HARDCODED_USERNAME || password !== HARDCODED_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  const token = jwt.sign({ username }, secret, { expiresIn: "2h" });
  return res.status(200).json({ token });
});

module.exports = router;
