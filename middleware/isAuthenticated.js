import jwt from 'jsonwebtoken';
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log("Token from cookies:", token);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    };
    const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    };
    req.id = decoded.id;
    next();

  } catch(error) {
    console.log(error);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};
export default isAuthenticated;