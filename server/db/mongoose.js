require("dotenv").config({ path: "../../.env" });
require("../../.env");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URL);
