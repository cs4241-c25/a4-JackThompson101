  const express = require("express");
  const mongoose = require("mongoose");
  const path = require("path");
  const session = require("express-session");
  const MongoStore = require("connect-mongo");
  const passport = require('passport');
  const GitHubStrategy = require('passport-github2').Strategy;

  const app = express();
  const port = process.env.PORT || 3001;
  const CALLBACK_URL = "https://a4-jackthompson101.onrender.com";

  const cors = require("cors");
  app.use(cors({
    origin: ["https://a4-jackthompson101.vercel.app", "http://localhost:3000"],
    credentials: true,
  }));
  app.set('trust proxy', 1);



  const mongoUrl = "mongodb+srv://jackthompson1042:IKnowItsNotSecure123@cluster0.1luyg.mongodb.net/cs4241-a3";
  
  app.use(express.json());
  app.use(
    session({
      secret: "supersecuresecret",
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: mongoUrl,
      }),
      cookie: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const userSchema = new mongoose.Schema(
    {
      _id: mongoose.Schema.Types.ObjectId,
      "First Name": String,
      "Last Name": String,
      Bodyweight: Number,
      Email: String,
      Username: { type: String, unique: true },
      Password: String,
    },
    { collection: "users" }
  );
  const User = mongoose.model("User", userSchema);

  const exerciseSchema = new mongoose.Schema(
    {
      userId: { type: String, ref: "User" },
      lift: String,
      weight: Number,
      reps: Number,
      date: { type: Date, default: Date.now },
    },
    { collection: "exercise" }
  );
  const Lifts = mongoose.model("Lifts", exerciseSchema);

  passport.serializeUser((user, done) => {
      done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id);
        done(null, user);
      } catch (err) {
        done(err, null);
      }
  });

  passport.use(new GitHubStrategy({
      clientID: "Ov23lirNh92hzzAeKByh",
      clientSecret: "b6cea80b8f0fb3b379097928d6a25f88eb34271c",
      callbackURL: "https://a4-jackthompson101.onrender.com/auth/github/callback",
  }, async (accessToken, refreshToken, profile, done) => {
      try {
          let user = await User.findOne({ Username: profile.username });
          if (!user) {
              user = await User.create({
                  _id: new mongoose.Types.ObjectId(),
                  Username: profile.username,
                  "First Name": profile.displayName ? profile.displayName.split(" ")[0] : profile.username,
                  "Last Name": profile.displayName ? profile.displayName.split(" ")[1] || "" : "",
                  Email: (profile.emails && profile.emails[0] && profile.emails[0].value) || "",
                  Bodyweight: 0,
                  Password: ""  
              });
          }
          return done(null, user);
      } catch (err) {
          console.error("GitHub auth error:", err);
          return done(err, null);
      }
  }));

  function isAuthenticated(req, res, next) {
    if (req.user) {
      return next();
    }
    res.status(401).send("Unauthorized: Please log in.");
  }

  app.get('/auth/github', passport.authenticate('github', { scope: [ 'user:email' ] }));

  app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
      console.log("Callback");
      console.log("User:", req.user);
      res.redirect('https://a4-jackthompson101.vercel.app/home');
  });

  app.get("/getLifts", isAuthenticated, async (req, res) => {
    try {
      const lifts = await Lifts.find({ userId: req.user.Username }).sort({ date: -1 });
      console.log("Lifts:", lifts);
      res.json(lifts);
    } catch (err) {
      console.error("Error retrieving lifts:", err);
      res.status(500).json({ message: "Error retrieving lifts" });
    }
  });

  app.post("/submit", isAuthenticated, async (req, res) => {
    const { exercise, reps, weight } = req.body;
    if (!exercise || !reps || !weight) {
      return res.status(400).send("Error: Missing required fields (exercise, reps, weight)");
    }
    try {
      const newLift = new Lifts({
        userId: req.user.Username,
        lift: exercise,
        reps: parseInt(reps, 10),
        weight: parseFloat(weight),
      });
      await newLift.save();
      res.json({ message: "Data added successfully", data: newLift });
    } catch (err) {
      console.error("Error saving data:", err);
      res.status(500).send("Error saving data");
    }
  });

  app.delete("/delete", isAuthenticated, async (req, res) => {
    const { exercise } = req.body;
    if (!exercise) {
      return res.status(400).send("Error: Missing required field (exercise)");
    }
    try {
      const result = await Lifts.findOneAndDelete({
        lift: exercise,
        userId: req.user.Username,
      });
      if (result) {
        res.json({ message: "Data deleted successfully" });
      } else {
        res.status(404).send("Error: Data not found");
      }
    } catch (err) {
      console.error("Error deleting data:", err);
      res.status(500).send("Error deleting data");
    }
  });

  app.put("/update", isAuthenticated, async (req, res) => {
    const { exercise, reps, weight } = req.body;
    if (!exercise || !reps || !weight) {
      return res.status(400).send("Error: Missing required fields (exercise, reps, weight)");
    }
    try {
      const updatedLift = await Lifts.findOneAndUpdate(
        { lift: exercise, userId: req.user.Username },
        { reps: parseInt(reps, 10), weight: parseFloat(weight), date: Date.now() },
        { new: true }
      );
      if (updatedLift) {
        res.json({ message: "Data updated successfully", data: updatedLift });
      } else {
        res.status(404).send("Error: Data not found");
      }
    } catch (err) {
      console.error("Error updating data:", err);
      res.status(500).send("Error updating data");
    }
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Error: Missing username or password" });
    }
    try {
      const user = await User.findOne({ Username: username });
      if (!user || password !== user.Password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      res.json({ message: "Login successful", user: req.user });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Error logging out");
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/getUserData", isAuthenticated, async (req, res) => {
    try {
      const user = await User.findOne({ Username: req.user.Username });
      console.log("User getUserData:", user)
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        firstName: user["First Name"],
        lastName: user["Last Name"],
        email: user.Email,
        bodyweight: user.Bodyweight,
        username: user.Username,
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
