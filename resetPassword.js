const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // make sure this path is correct
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch((err) => console.error("MongoDB connection error:", err));

const resetPassword = async () => {
  try {
    const email = "admin@example.com"; // your owner email
    const newPassword = "123456"; // new password you want

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      console.log("User not found!");
    } else {
      console.log(`Password successfully reset for: ${user.email}`);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("Error resetting password:", err);
    mongoose.disconnect();
  }
};

resetPassword();
