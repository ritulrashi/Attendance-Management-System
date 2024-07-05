# Attendance-Management-System
This project implements a simple Attendance Management System using Node.js, Express, Passport.js for Google OAuth authentication, and file system operations for storing attendance data.

# Features
* Google OAuth Authentication: Users can authenticate using their Google accounts.
* Attendance Marking: Users can mark their attendance for a specific date.
* View Attendance: Users can view their attendance history.
* Delete Attendance: Users can delete selected attendance dates.
* Alerts: Alerts are shown for date validation and existing attendance.

# Setup Instructions
1. Clone the repository and save it in an Attendance_Management_System folder
2. Create a new 'package.json' file in your project directory
```
npm init
```
3. Make sure to add this to your 'package.json' file
```
"type": "module"
```
5. Install dependencies:
```
npm i express passport passport-google-oauth20 express-session
```
6. Set up Google OAuth Credentials:
* Create a Google Developer Console project.
* Obtain OAuth Client ID and Client Secret.
* Update clientID and clientSecret in index.js with your credentials.
7. Run the application:
```
node index.js
```
The application will be accessible at 'http://localhost:3000'.
