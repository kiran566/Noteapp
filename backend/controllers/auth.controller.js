import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creating user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Generating JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.jwt_secret || "secretkey",
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Signup successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
