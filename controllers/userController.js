import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async(req, res) => {
  try {
    const{fullName, email, username, password, confirmPassword, gender}=req.body;
    if(!fullName || !email || !username || !password || !confirmPassword || !gender){
      return res.status(400).json({message: "All fields are required"});
    }
    if(password !== confirmPassword){
      return res.status(400).json({message: "Passwords do not match"});
    }
    const user = await User.findOne({$or: [{username}, {email}]});
    if(user){
      return res.status(400).json({message: "Username or email already exists"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePhoto = `https://ui-avatars.com/api/?name=${fullName.split(" ").join("+")}&background=random`;
    await User.create({fullName, email, username, password: hashedPassword, gender, profilePhoto});
     return res.status(201).json({message: "Registration successful"});
   
  } catch (error) {
    console.error("Error during user registration:", error);
    return  res.status(500).json({message: "Server error"});
  }

}

export const login = async(req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const tokenData={
      id: user._id
    };
    const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    return res.status(200).cookie("token", token, {maxAge:1*24*60*60*1000,httpOnly:true}).json({
      _id:user._id,
      username:user.username,
      fullName:user.fullName,
      email:user.email,
      profilePhoto:user.profilePhoto
    });
      
  } catch (error) {
    console.error("Error during user login:", error);
    return res.status(500).json({ message: "Server error" });
  }

}

export const logout = (req, res) => {
  try{
    return res.status(200).cookie("token","", {maxAge:0,httpOnly:true}).json({message:"Logout successful"});

  }catch(error){
    console.error("Error during user logout:", error);
    return res.status(500).json({message:"Server error"});
  }
}

export const getOtherUsers = async(req, res) => {
  try {
    const loggedInUserId = req.id;
    const otherUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password ");
    return res.status(200).json(otherUsers);
  } catch (error) {
    console.error("Error fetching other users:", error);
    return res.status(500).json({message:"Server error"});
  }
}

export const getProfile = async(req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const updateProfile = async(req, res) => {
  try {
    const userId = req.id;
    const { fullName, email, profilePhoto, gender } = req.body;
    
    if (!fullName || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const updateData = {
      fullName,
      email,
      ...(gender && { gender }),
      ...(profilePhoto && { profilePhoto })
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const deleteAccount = async(req, res) => {
  try {
    const userId = req.id;
    await User.findByIdAndDelete(userId);
    return res.status(200).cookie("token", "", { maxAge: 0, httpOnly: true }).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ message: "Server error" });
  }
}