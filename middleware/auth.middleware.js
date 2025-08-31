
//token layege cookies se 
//token ko verify krege
//token se data nikallo



import jwt from 'jsonwebtoken';

export const isLoggedIn = (req, res, next) => {
  try {
    let token = req.cookies.token || "";

    if (!token) {
      return res.status(401).json({
        message: "Authentication Failed",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    return next(); 
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};



