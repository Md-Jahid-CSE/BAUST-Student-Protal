// --- START OF COMPLETE AND FINAL index.js ---

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Import only V2 functions
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onValueCreated, onValueWritten } = require("firebase-functions/v2/database");
const { setGlobalOptions } = require("firebase-functions/v2");

// Set global options for all v2 functions for better performance
setGlobalOptions({ region: "asia-southeast1" });

admin.initializeApp();

// Gmail transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jahid.hasan.19th.126@gmail.com",
    pass: "gvgdecbhzphurntl",
  },
});

// =============================================================
// Helper Functions
// =============================================================

const welcomeTemplateHtml = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to the Student Portal</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6; }
    .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background-color: #4A90E2; color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333333; font-size: 16px; line-height: 1.6; }
    .content p { margin: 0 0 15px 0; }
    .details-box { background-color: #f9f9f9; border: 1px solid #eeeeee; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .details-box p { margin: 0 0 10px 0; color: #555555; }
    .details-box strong { color: #333333; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #4A90E2; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
    .footer { background-color: #f4f7f6; color: #888888; font-size: 12px; text-align: center; padding: 20px; }
    .footer a { color: #4A90E2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>{{user_name}}</strong>,</p>
      <p>We're excited to have you! Your account for the University Student Portal has been successfully created. Here are your account details:</p>
      <div class="details-box">
        <p><strong>Username:</strong> {{username}}</p>
        <p><strong>Student ID:</strong> {{full_id}}</p>
        <p><strong>Section:</strong> {{section}}</p>
        <p><strong>Registered Email:</strong> {{email_used}}</p>
      </div>
      <p>We recommend you log in and explore the portal. Please keep your login credentials secure and do not share them with anyone.</p>
      <div class="button-container">
        <a href="{{portal_url}}" target="_blank" class="button">Go to Portal</a>
      </div>
      <p>If you did not create this account, please contact support immediately.</p>
      <p>Best regards,<br/>The Student Portal Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email.</p>
      <p>{{company_address}}</p>
    </div>
  </div>
</body>
</html>
`;

function fillWelcomeTemplate(template, data) {
  return template
    .replace(/{{user_name}}/g, data.userName || "Student")
    .replace(/{{username}}/g, data.username || "N/A")
    .replace(/{{email_used}}/g, data.email || "")
    .replace(/{{full_id}}/g, data.studentId || "N/A")
    .replace(/{{section}}/g, data.className || "N/A")
    .replace(/{{portal_url}}/g, data.portalUrl || "#")
    .replace(/{{company_address}}/g, "BAUST, Saidpur Cantonment");
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// =============================================================
// Password Reset and Account Creation Functions
// =============================================================

exports.sendPasswordResetCode = onCall(async (request) => {
  try {
    const { username } = request.data;
    if (!username) throw new HttpsError("invalid-argument", "Username is required");

    const db = admin.database();
    const usernameSnapshot = await db.ref(`usernames/${username}`).once("value");
    if (!usernameSnapshot.exists()) throw new HttpsError("not-found", "Username not found");

    const studentId = usernameSnapshot.val();
    const studentSnapshot = await db.ref(`students/${studentId}`).once("value");
    if (!studentSnapshot.exists()) throw new HttpsError("not-found", "Student data not found");

    const studentData = studentSnapshot.val();
    if (!studentData.email) throw new HttpsError("failed-precondition", "No email associated with this account");

    const verificationCode = generateVerificationCode();
    const expiryTime = Date.now() + 2 * 60 * 1000;

    await db.ref(`passwordResetTokens/${studentId}`).set({
      code: verificationCode,
      expiryTime: expiryTime,
      createdAt: Date.now(),
    });

    const passwordResetHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Password Reset Request</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background-color: #f9a825; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; color: #333333; font-size: 16px; line-height: 1.6; }
        .content p { margin: 0 0 15px 0; }
        .code-box { background-color: #f9f9f9; border-radius: 8px; padding: 25px; text-align: center; margin: 20px 0; }
        .code { font-size: 36px; font-weight: bold; color: #333; letter-spacing: 8px; margin: 0; }
        .expiry-note { font-size: 14px; color: #c0392b; margin-top: 15px; }
        .footer { background-color: #f4f7f6; color: #888888; font-size: 12px; text-align: center; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${studentData.name || 'Student'}</strong>,</p>
          <p>We received a request to reset the password for your student portal account. Please use the verification code below to proceed.</p>
          <div class="code-box">
            <p style="margin:0 0 10px 0; font-size: 14px; color: #555;">Your Verification Code:</p>
            <p class="code">${verificationCode}</p>
          </div>
          <p class="expiry-note"><strong>Important:</strong> This code is valid for <strong>2 minutes</strong> only. Do not share it with anyone.</p>
          <p>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
          <p>Thanks,<br/>The Student Portal Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"University Student Portal" <jahid.hasan.19th.126@gmail.com>`,
      to: studentData.email,
      subject: "Your Password Reset Code for the Student Portal",
      html: passwordResetHtml,
    };

    await transporter.sendMail(mailOptions);

    return {
        success: true,
        message: "Verification code sent to your email",
        email: studentData.email
    };

  } catch (error) {
    console.error("Error sending password reset code:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to send verification code");
  }
});

exports.verifyResetCode = onCall(async (request) => {
  const { username, code } = request.data;
  if (!username || !code) throw new HttpsError("invalid-argument", "Username and code are required");

  const db = admin.database();
  const usernameSnapshot = await db.ref(`usernames/${username}`).once("value");
  if (!usernameSnapshot.exists()) throw new HttpsError("not-found", "Username not found");

  const studentId = usernameSnapshot.val();
  const tokenSnapshot = await db.ref(`passwordResetTokens/${studentId}`).once("value");
  if (!tokenSnapshot.exists()) throw new HttpsError("not-found", "No verification code found. Please request a new one.");

  const tokenData = tokenSnapshot.val();
  if (tokenData.code !== code) throw new HttpsError("invalid-argument", "Invalid verification code");

  if (Date.now() > tokenData.expiryTime) {
    await db.ref(`passwordResetTokens/${studentId}`).remove();
    throw new HttpsError("deadline-exceeded", "Verification code has expired. Please request a new one.");
  }
  return { success: true, studentId: studentId, message: "Code verified successfully" };
});

exports.resetPassword = onCall(async (request) => {
  const { studentId, newPasswordHash } = request.data;
  if (!studentId || !newPasswordHash) throw new HttpsError("invalid-argument", "Student ID and password hash are required");

  const db = admin.database();
  const tokenSnapshot = await db.ref(`passwordResetTokens/${studentId}`).once("value");
  if (!tokenSnapshot.exists()) throw new HttpsError("permission-denied", "Password reset session expired");

  await db.ref(`students/${studentId}/password`).set(newPasswordHash);
  await db.ref(`passwordResetTokens/${studentId}`).remove();
  return { success: true, message: "Password reset successfully" };
});

// =============================================================
// Database Trigger Functions (All V2)
// =============================================================

exports.sendWelcomeEmailOnAccountCreation = onValueCreated("/students/{studentId}/username", async (event) => {
  const usernameSnapshot = event.data;
  if (!usernameSnapshot.exists()) {
    console.log(`Triggered for ${event.params.studentId}, but the final snapshot does not exist. Exiting.`);
    return;
  }

  const username = usernameSnapshot.val();
  const studentId = event.params.studentId;

  if (!username) {
    console.log(`Username for ${studentId} was null or empty. No email sent.`);
    return;
  }

  console.log(`V2 Trigger: Welcome email for studentId: ${studentId}, username: ${username}`);

  try {
    const db = admin.database();
    const studentRef = usernameSnapshot.ref.parent;
    if (!studentRef) {
        console.error(`Could not get parent reference for student ID: ${studentId}`);
        return;
    }

    const studentSnapshot = await studentRef.once("value");
    if (!studentSnapshot.exists()) {
        console.log(`Student data not found for ID: ${studentId}`);
        return;
    }

    const studentData = studentSnapshot.val();
    if (!studentData.email) {
        console.log(`No email found for student ID: ${studentId}`);
        return;
    }

    let className = "Not Assigned";
    if (studentData.classId) {
      const classSnapshot = await db.ref(`/classes/${studentData.classId}/className`).once("value");
      className = classSnapshot.exists() ? classSnapshot.val() : "N/A";
    }

    const portalUrl = "https://ctquestions-ac5f2.web.app/";

    const emailHtml = fillWelcomeTemplate(welcomeTemplateHtml, {
      userName: studentData.name,
      username: username,
      email: studentData.email,
      studentId: studentId,
      className: className,
      portalUrl: portalUrl,
    });

    const mailOptions = {
      from: `"University Student Portal" <jahid.hasan.19th.126@gmail.com>`,
      to: studentData.email,
      subject: "Welcome to the University Student Portal!",
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${studentData.email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
});

exports.sendResultUpdateNotification = onValueWritten("/classes/{classId}/results/{courseId}/{studentId}", async (event) => {
  if (!event.data.after.exists()) {
    console.log(`Result deleted for student ${event.params.studentId}. No email sent.`);
    return;
  }

  const studentId = event.params.studentId;
  const classId = event.params.classId;
  const courseId = event.params.courseId;
  const resultData = event.data.after.val();

  if (typeof resultData !== 'object' || resultData === null || Object.keys(resultData).length === 0) {
      console.log(`Result data for ${studentId} is invalid or empty. No email sent.`);
      return;
  }

  try {
    const db = admin.database();

    const studentSnapshot = await db.ref(`students/${studentId}`).once("value");
    if (!studentSnapshot.exists() || !studentSnapshot.val().email) {
      console.error(`Could not find email for student ${studentId}.`);
      return;
    }
    const studentData = studentSnapshot.val();
    const studentEmail = studentData.email;
    const studentName = studentData.name || "Student";

    const courseSnapshot = await db.ref(`classes/${classId}/courses/${courseId}`).once("value");
    if (!courseSnapshot.exists()) {
        console.error(`Course data not found for courseId: ${courseId}. Cannot send email.`);
        return;
    }
    const courseData = courseSnapshot.val();
    const courseName = courseData.courseName || courseId;
    const courseCode = courseData.courseCode || "";

    const portalUrl = "https://ctquestions-ac5f2.web.app/";

    const emailHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Result Update</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background-color: #27ae60; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; color: #333333; font-size: 16px; line-height: 1.6; }
        .content p { margin: 0 0 15px 0; }
        .result-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .result-table th, .result-table td { padding: 12px; border: 1px solid #eeeeee; text-align: left; }
        .result-table th { background-color: #f9f9f9; }
        .total-row { background-color: #f0fff4; font-weight: bold; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { background-color: #27ae60; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
        .footer { background-color: #f4f7f6; color: #888888; font-size: 12px; text-align: center; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Result Is In!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${studentName}</strong>,</p>
          <p>The result for your course, <strong>${courseName} (${courseCode})</strong>, has been updated. Here is a summary of your marks:</p>
          <table class="result-table">
            <thead>
              <tr><th>Assessment</th><th>Marks</th></tr>
            </thead>
            <tbody>
              <tr><td>Class Test 1</td><td><strong>${resultData.ct1 ?? 'N/A'}</strong></td></tr>
              <tr><td>Class Test 2</td><td><strong>${resultData.ct2 ?? 'N/A'}</strong></td></tr>
              <tr><td>Class Test 3</td><td><strong>${resultData.ct3 ?? 'N/A'}</strong></td></tr>
              <tr><td>Midterm</td><td><strong>${resultData.midterm ?? 'N/A'}</strong></td></tr>
              <tr><td>Attendance</td><td><strong>${resultData.attendance !== undefined && resultData.attendance !== null ? resultData.attendance + '%' : 'N/A'}</strong></td></tr>
              <tr class="total-row"><td>Total (out of 120)</td><td><strong>${resultData.total ?? 'N/A'}</strong></td></tr>
            </tbody>
          </table>
          <div class="button-container">
            <a href="${portalUrl}" target="_blank" class="button">View Full Details</a>
          </div>
          <p>Log in to the student portal to see your complete academic progress.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"University Student Portal" <jahid.hasan.19th.126@gmail.com>`,
      to: studentEmail,
      subject: `📊 Result Updated for ${courseName}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Result update email sent successfully to ${studentEmail} for course ${courseName}.`);
  } catch (error) {
    console.error(`Failed to send result update email to ${studentId}:`, error);
  }
});

// =============================================================
// Callable Functions for Admin Panel
// =============================================================

exports.sendUpdatesForClass = onCall(async (request) => {
    const { classId } = request.data;
    if (!classId) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'classId'.");
    }

    const db = admin.database();
    const updatesRef = db.ref(`pendingUpdates/${classId}`);
    const updatesSnapshot = await updatesRef.once("value");

    if (!updatesSnapshot.exists()) {
        console.log(`No pending updates found for class ${classId}.`);
        return { success: true, message: "No pending updates to send." };
    }

    const updates = updatesSnapshot.val();
    const classSnapshot = await db.ref(`classes/${classId}`).once("value");
    const className = classSnapshot.val()?.className || classId;

    let updatesSummaryHtml = Object.values(updates).map(update =>
        `<li><strong>${update.title}:</strong> ${update.details}</li>`
    ).join('');

    const studentsSnapshot = await db.ref('students').orderByChild('classId').equalTo(classId).once('value');
    if (!studentsSnapshot.exists()) {
        console.log(`No students found for class ${classId}.`);
        return { success: true, message: "Updates processed, but no students found for this class." };
    }

    const students = studentsSnapshot.val();
    const studentEmails = Object.values(students).map(s => s.email).filter(Boolean);

    if (studentEmails.length === 0) {
        return { success: true, message: "No student emails found for this class." };
    }

    const portalUrl = "https://ctquestions-ac5f2.web.app/";
    const emailHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Portal Updates</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background-color: #2980b9; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; color: #333333; font-size: 16px; line-height: 1.6; }
        .content p { margin: 0 0 15px 0; }
        .updates-list { list-style-type: none; padding: 0; margin: 20px 0; background-color: #f9f9f9; border: 1px solid #eeeeee; border-radius: 8px; }
        .updates-list li { padding: 15px; border-bottom: 1px solid #eeeeee; }
        .updates-list li:last-child { border-bottom: none; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { background-color: #2980b9; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
        .footer { background-color: #f4f7f6; color: #888888; font-size: 12px; text-align: center; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Portal Updates for ${className}</h1>
        </div>
        <div class="content">
          <p>Hello everyone,</p>
          <p>Here are the latest updates and additions to the student portal. Please log in to check the details.</p>
          <ul class="updates-list">${updatesSummaryHtml}</ul>
          <div class="button-container">
            <a href="${portalUrl}" target="_blank" class="button">Visit Portal Now</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>`;

    // Fire and forget: Start sending emails but return a response to the client immediately.
    const emailPromises = studentEmails.map(email => {
        const mailOptions = {
            from: `"University Student Portal" <jahid.hasan.19th.126@gmail.com>`,
            to: email,
            subject: `📢 Portal Updates for ${className}`,
            html: emailHtml,
        };
        return transporter.sendMail(mailOptions);
    });

    Promise.all(emailPromises)
        .then(() => {
            console.log(`Background task: Successfully sent ${studentEmails.length} update emails for class ${className}.`);
        })
        .catch(error => {
            console.error(`Background task: Error sending update emails for ${className}:`, error);
        });

    // Return an immediate success response to prevent client-side timeout.
    return { success: true, message: `Started sending updates to ${studentEmails.length} students.` };
});

exports.sendManualNotice = onCall(async (request) => {
    const { classId, title, content } = request.data;
    if (!classId || !title || !content) {
        throw new HttpsError("invalid-argument", "classId, title, and content are required.");
    }

    const db = admin.database();
    const classSnapshot = await db.ref(`classes/${classId}`).once("value");
    const className = classSnapshot.val()?.className || classId;

    const studentsSnapshot = await db.ref('students').orderByChild('classId').equalTo(classId).once('value');
    if (!studentsSnapshot.exists()) {
        return { success: true, message: "Notice created, but no students found for this class." };
    }

    const students = studentsSnapshot.val();
    const studentEmails = Object.values(students).map(s => s.email).filter(Boolean);

    if (studentEmails.length === 0) {
        return { success: true, message: "No student emails found." };
    }

    const emailHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Important Notice</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background-color: #d35400; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; color: #333333; font-size: 16px; line-height: 1.6; }
        .content p { margin: 0 0 15px 0; }
        .notice-box { background-color: #fff8e1; border-left: 5px solid #d35400; padding: 20px; margin: 20px 0; }
        .footer { background-color: #f4f7f6; color: #888888; font-size: 12px; text-align: center; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Important Notice: ${title}</h1>
        </div>
        <div class="content">
          <p>Dear Students of <strong>${className}</strong>,</p>
          <p>Please take note of the following important announcement:</p>
          <div class="notice-box">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <p>Thank you for your attention.</p>
          <p>Sincerely,<br/>Portal Administration</p>
        </div>
        <div class="footer">
          <p>This message was sent to all students of ${className}.</p>
        </div>
      </div>
    </body>
    </html>`;

    // Fire and forget: Start sending emails but return a response to the client immediately.
    const emailPromises = studentEmails.map(email => {
        const mailOptions = {
            from: `"University Student Portal" <jahid.hasan.19th.126@gmail.com>`,
            to: email,
            subject: `❗ Important Notice for ${className}: ${title}`,
            html: emailHtml,
        };
        return transporter.sendMail(mailOptions);
    });

    Promise.all(emailPromises)
        .then(() => {
            console.log(`Background task: Successfully sent manual notice to ${studentEmails.length} students in ${className}.`);
        })
        .catch(error => {
            console.error(`Background task: Error sending manual notice for ${className}:`, error);
        });

    // Return an immediate success response to prevent client-side timeout.
    return { success: true, message: `Started sending manual notice to ${studentEmails.length} students.` };
});

// =============================================================
// Scheduled Cleanup Function
// =============================================================

exports.cleanupExpiredTokens = onSchedule("every 1 hours", async (event) => {
  console.log('Running hourly cleanup job for expired tokens...');
  const db = admin.database();
  const tokensRef = db.ref("passwordResetTokens");
  const snapshot = await tokensRef.once("value");
  if (!snapshot.exists()) {
      console.log("No tokens to clean up.");
      return;
  }

  const tokens = snapshot.val();
  const currentTime = Date.now();
  const updates = {};
  for (const studentId in tokens) {
    if (currentTime > tokens[studentId].expiryTime) {
      updates[studentId] = null;
    }
  }
  if (Object.keys(updates).length > 0) {
    await tokensRef.update(updates);
    console.log(`Cleaned up ${Object.keys(updates).length} expired tokens.`);
  } else {
    console.log("No expired tokens found to clean up.");
  }
});