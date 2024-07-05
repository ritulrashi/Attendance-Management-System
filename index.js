// Import required modules
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import readLine from "readline";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import { request } from "http";

const app = express();
const port = 3000;

// Determine __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

let attendanceList = [];
let userIsAuthorised = false;
let dateExists = false;

app.use(
  session({ 
    secret: 'secret', 
    resave: false, 
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    }
  }));

// Configure body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Going forward are all the middleware functions

// Middleware to check date
function dateCheck(req, res, next) {
  const selectedDate = new Date(req.body["date"]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate <= today) {
    userIsAuthorised = true;

    const userEmail = req.user.emails[0].value;
    const userId = userEmail.split('@')[0];
    const attendanceFile = `${__dirname}/public/user_attendance/attendance_${userId}.txt`;
    console.log(attendanceFile, "date check function");
    
    if (fs.existsSync(attendanceFile)){
      const attendanceData = fs.readFileSync(attendanceFile, 'utf8');
    const attendanceDates = attendanceData.split('\n').filter(date => date.trim() !== "");

    dateExists = attendanceDates.includes(req.body["date"]);
      
    }
  } else {
    userIsAuthorised = false;
  }
  next();
}
app.use(dateCheck);

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
// Going forward are all the get methods

// Define Google authentication routes
app.get(
  '/auth/google', 
  passport.authenticate('google', 
    { scope: ['profile', 'email'] }));

  app.get(
    "/auth/google/attendance",
    passport.authenticate("google", 
      {
      successRedirect: "/attendance",
      failureRedirect: "/",
    })
  );

// Serve the login page
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(__dirname + '/public/index.html');
  } else {
    res.sendFile(__dirname + '/public/login.html');
  }
});

// Add route for logout
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/back", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Define routes
app.get('/attendance', isLoggedIn, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/viewAttendance", isLoggedIn, (req, res) => {
  const userEmail = req.user.emails[0].value;
  const userId = userEmail.split('@')[0];
  const attendanceFile = `${__dirname}/public/user_attendance/attendance_${userId}.txt`;
  const fileStream = fs.createReadStream(attendanceFile);
  const rl = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  attendanceList = [];  // Reset the list to avoid duplicates

  rl.on('line', line => {
    if (line.trim() !== "") {
      attendanceList.push(line.trim());
    }
  });

  rl.on('close', () => {
    res.render(__dirname + "/public/attendance.ejs", { items: attendanceList });
  });
});

// Going forward are all the post methods

app.post("/submit", isLoggedIn, (req, res) => {
  if (userIsAuthorised && !dateExists) {
    const attendanceDate = req.body["date"];
    const userEmail = req.user.emails[0].value;
    const userId = userEmail.split('@')[0];
    console.log("User Information: ", userId);  // Log user information
    console.log("Submitted Date: ", attendanceDate);  // Log submitted date

    const attendanceFile = `${__dirname}/public/user_attendance/attendance_${userId}.txt`;
    fs.appendFile(attendanceFile, attendanceDate + "\n", { flag: 'a'}, (err) => {
      if (err) {
        if (err.code === 'ENOENT')
          {
            console.error('Directory does not exist', err);
          }
          else if (err.code === 'EACCES')
            {
              console.error('No space left on device: ', err);
            }
      };
      console.log(`Attendance marked for: ${attendanceDate}`);
    });
    res.sendFile(__dirname + "/public/pop_up.html");
  } else if (dateExists) {
    res.redirect('/?alert=exists');
  } else {
    res.redirect('/?alert=true');
  }
});


app.post("/deleteAttendance", isLoggedIn, (req, res) => {
  const deleteDates = req.body.dates;
  const userEmail = req.user.emails[0].value;
  const userId = userEmail.split('@')[0];
  const attendanceFile = `${__dirname}/public/user_attendance/attendance_${userId}.txt`;
  let attendanceData = fs.readFileSync(attendanceFile, 'utf8').split('\n');

  if (Array.isArray(deleteDates)) {
    attendanceData = attendanceData.filter(date => !deleteDates.includes(date.trim()));
  } else {
    attendanceData = attendanceData.filter(date => date.trim() !== deleteDates);
  }

  fs.writeFileSync(attendanceFile, attendanceData.join('\n'));
  res.redirect('/viewAttendance');
});

// Configure Passport with Google Strategy
passport.use(new GoogleStrategy({
  // clientID: 'Replace with your Client ID and uncomment this line',
  // clientSecret: 'Replace with your Client Secret and uncomment this line',
  // callbackURL: 'Replace with yout Call Back URL and uncomment this line',
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async (accessToken, refreshToken, profile, done) => {
  // For simplicity, use the profile object as the user
  //console.log(profile);
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
