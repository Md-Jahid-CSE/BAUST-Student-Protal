// --- START OF FILE admin_side.js ---

// --- START OF COMPLETE AND FINAL admin_side.js ---

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
  onValue,
  push,
  update,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBUq_szwEsm50CLZRxUiD6CmXNiB3OwNRc",
  authDomain: "ctquestions-ac5f2.firebaseapp.com",
  databaseURL:
    "https://ctquestions-ac5f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ctquestions-ac5f2",
  storageBucket: "ctquestions-ac5f2.appspot.com",
  messagingSenderId: "421824009186",
  appId: "1:421824009186:web:298554ad147781e6ec5fbb",
  measurementId: "G-DSEDQ51WF3",
};

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const functions = getFunctions(app, "asia-southeast1");

// --- DOM ELEMENTS ---
const dom = {
  body: document.body,
  loginView: document.getElementById("loginView"),
  dashboardView: document.getElementById("dashboardView"),
  superAdminView: document.getElementById("superAdminView"),
  classContentView: document.getElementById("classContentView"),
  courseListSection: document.getElementById("courseListSection"),
  courseManagementSection: document.getElementById("courseManagementSection"),
  mainTabs: document.getElementById("mainTabs"),
  adminEmailInput: document.getElementById("adminEmail"),
  adminPasswordInput: document.getElementById("adminPassword"),
  passwordToggleIcon: document.getElementById("passwordToggleIcon"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  toastContainer: document.getElementById("toast-container"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  userRoleBadge: document.getElementById("userRoleBadge"),
  classContentTitle: document.getElementById("classContentTitle"),
  managingCourseTitle: document.getElementById("managingCourseTitle"),
  backToClassListBtn: document.getElementById("backToClassListBtn"),
  backToCoursesBtn: document.getElementById("backToCoursesBtn"),
  addClassForm: document.getElementById("addClassForm"),
  classIdInput: document.getElementById("classIdInput"),
  classNameInput: document.getElementById("classNameInput"),
  allClassesList: document.getElementById("allClassesList"),
  addCrForm: document.getElementById("addCrForm"),
  crUidInput: document.getElementById("crUidInput"),
  crNameInput: document.getElementById("crNameInput"),
  crClassIdInput: document.getElementById("crClassIdInput"),
  crList: document.getElementById("crList"),
  addCourseForm: document.getElementById("addCourseForm"),
  courseCodeInput: document.getElementById("courseCode"),
  courseNameInput: document.getElementById("courseName"),
  courseTypeSelect: document.getElementById("courseType"),
  myCoursesList: document.getElementById("myCoursesList"),
  teacher1Form: document.getElementById("teacher1Form"),
  teacher2Section: document.getElementById("teacher2Section"),
  teacher2Form: document.getElementById("teacher2Form"),
  theoryCourseSections: document.getElementById("theoryCourseSections"),
  sessionalCourseSections: document.getElementById("sessionalCourseSections"),
  addResourceForm: document.getElementById("addResourceForm"),
  resourcesList: document.getElementById("resourcesList"),
  sessionalAddResourceForm: document.getElementById("sessionalAddResourceForm"),
  sessionalResourcesList: document.getElementById("sessionalResourcesList"),
  addAssignmentForm: document.getElementById("addAssignmentForm"),
  assignmentsList: document.getElementById("assignmentsList"),
  sessionalAddAssignmentForm: document.getElementById(
    "sessionalAddAssignmentForm"
  ),
  sessionalAssignmentsList: document.getElementById("sessionalAssignmentsList"),
  ctForm: document.getElementById("ctForm"),
  addLabReportForm: document.getElementById("addLabReportForm"),
  labReportsList: document.getElementById("labReportsList"),
  routineForm: document.getElementById("routineForm"),
  routineLinkInput: document.getElementById("routineLinkInput"),
  addEventForm: document.getElementById("addEventForm"),
  eventsList: document.getElementById("eventsList"),
  addNoticeForm: document.getElementById("addNoticeForm"),
  noticesList: document.getElementById("noticesList"),
  addOldQuestionForm: document.getElementById("addOldQuestionForm"),
  oldQuestionsList: document.getElementById("oldQuestionsList"),
  addGroupLinkForm: document.getElementById("addGroupLinkForm"),
  groupLinksList: document.getElementById("groupLinksList"),
  addAdvisorForm: document.getElementById("addAdvisorForm"),
  advisorsList: document.getElementById("advisorsList"),
  resultsSection: document.getElementById("resultsSection"),
  resultsCourseSelect: document.getElementById("resultsCourseSelect"),
  resultsTableContainer: document.getElementById("resultsTableContainer"),
  saveResultsBtn: document.getElementById("saveResultsBtn"),
  studentManagementSection: document.getElementById("studentManagementSection"),
  addStudentForm: document.getElementById("addStudentForm"),
  studentsList: document.getElementById("studentsList"),
  pendingPaymentsCard: document.getElementById("pendingPaymentsCard"),
  pendingPaymentsList: document.getElementById("pendingPaymentsList"),
  classPendingPaymentsList: document.getElementById("classPendingPaymentsList"),
  paymentManagementSection: document.getElementById("paymentManagementSection"),
  paymentManagementTab: document.getElementById("paymentManagementTab"),
  updateDistributionSection: document.getElementById(
    "updateDistributionSection"
  ),
  updatesToSendList: document.getElementById("updatesToSendList"),
  sendAndClearUpdatesBtn: document.getElementById("sendAndClearUpdatesBtn"),
  manualNoticeForm: document.getElementById("manualNoticeForm"),
  sendManualNoticeBtn: document.getElementById("sendManualNoticeBtn"),
};

// --- APP STATE ---
let appState = {
  currentUser: null,
  userRole: null,
  managingClassId: null,
  managingCourseId: null,
  courseDataListener: null,
  classStudents: [],
};

// --- HELPER FUNCTIONS ---
const toggleHidden = (element, isHidden) =>
  element.classList.toggle("hidden", isHidden);

const showToast = (message, type = "success", duration = 5000) => {
  if (!dom.toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`,
  };
  toast.innerHTML = `<div class="toast-icon">${icons[type] || ""
    }</div><div class="toast-content"><p>${message}</p></div>`;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
};

const showConfirmationToast = (message, onConfirm) => {
  if (!dom.toastContainer) return;
  const toast = document.createElement("div");
  toast.className = "toast confirm";
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;
  toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-content"><p>${message}</p><div class="toast-buttons"><button class="btn btn-secondary btn-sm" id="confirmCancelBtn">Cancel</button><button class="btn btn-danger btn-sm" id="confirmDeleteBtn">Confirm</button></div></div>`;
  const closeToast = () => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => toast.remove());
  };
  toast.querySelector("#confirmDeleteBtn").onclick = () => {
    onConfirm();
    closeToast();
  };
  toast.querySelector("#confirmCancelBtn").onclick = closeToast;
  dom.toastContainer.prepend(toast);
};

const logUpdate = (
  type,
  title,
  details,
  isDisposable = false,
  sourcePath = null
) => {
  const classId = appState.managingClassId;
  if (!classId) return;
  const updateData = {
    type,
    title,
    details,
    isDisposable,
    sourcePath,
    timestamp: Date.now(),
  };
  push(ref(db, `pendingUpdates/${classId}`), updateData).catch((err) =>
    console.error("Failed to log update:", err)
  );
};

const handleDelete = (itemRef, itemName, confirmationMessage) => {
  const message =
    confirmationMessage || `Are you sure you want to delete this ${itemName}?`;
  showConfirmationToast(message, () => {
    remove(itemRef)
      .then(() => showToast(`"${itemName}" deleted successfully.`, "success"))
      .catch((err) => showToast(`Error deleting: ${err.message}`, "error"));
  });
};

// --- AUTH & UI SETUP ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    dom.body.classList.remove("login-active");
    checkUserRoleAndSetupUI(user);
  } else {
    appState = {
      currentUser: null,
      userRole: null,
      managingClassId: null,
      managingCourseId: null,
      courseDataListener: null,
      classStudents: [],
    };
    dom.body.classList.add("login-active");
    toggleHidden(dom.loginView, false); // show login view
    toggleHidden(dom.dashboardView, true); // hide dashboard
  }
});

const checkUserRoleAndSetupUI = async (user) => {
  appState.currentUser = user;

  const superAdminSnap = await get(ref(db, `superAdmins/${user.uid}`));
  if (superAdminSnap.exists()) {
    appState.userRole = "super";
    setupSuperAdminDashboard();
    return;
  }

  const crAdminSnap = await get(ref(db, `classAdmins/${user.uid}`));
  if (crAdminSnap.exists()) {
    appState.userRole = "cr";
    const { classId, name } = crAdminSnap.val();
    setupCrDashboard(classId, name);
    return;
  }

  showToast("You do not have administrative privileges.", "error");
  signOut(auth);
};

const setupSuperAdminDashboard = () => {
  toggleHidden(dom.loginView, true);
  toggleHidden(dom.dashboardView, false);
  toggleHidden(dom.superAdminView, false);
  toggleHidden(dom.classContentView, true);
  toggleHidden(dom.courseManagementSection, true);
  dom.dashboardTitle.textContent = "University Portal";
  dom.userRoleBadge.textContent = "Super Administrator";
  loadAllClasses();
  loadAllCrs();
  toggleHidden(dom.pendingPaymentsCard, false);
  loadPendingPayments();
};

const setupCrDashboard = (classId, crName) => {
  toggleHidden(dom.loginView, true);
  toggleHidden(dom.dashboardView, false);
  toggleHidden(dom.superAdminView, true);
  toggleHidden(dom.classContentView, false);
  toggleHidden(dom.courseManagementSection, true);
  dom.dashboardTitle.textContent = "University Portal";
  dom.userRoleBadge.textContent = `Class Representative - ${crName}`;
  appState.managingClassId = classId;
  loadClassContent(classId);
};

// --- VIEW SWITCHING ---
const showClassContentView = () => {
  appState.managingCourseId = null;
  if (appState.courseDataListener) appState.courseDataListener();
  
  // HIDE course management view, SHOW main class content view (tabs)
  toggleHidden(dom.courseManagementSection, true);
  toggleHidden(dom.classContentView, false);

  // Click the first tab to reset the view inside classContentView
  const firstTab = dom.mainTabs.querySelector(".tab-button");
  if (firstTab) firstTab.click();
};

const showCourseManagementView = (courseId) => {
  appState.managingCourseId = courseId;
  
  // HIDE main class content view (tabs), SHOW course management view
  toggleHidden(dom.classContentView, true);
  toggleHidden(dom.courseManagementSection, false);

  loadAndDisplayCourseDetails(courseId);
};


// --- DATA RENDERING ---
const renderListItem = (
  parent,
  text,
  id,
  deleteHandler,
  additionalButtons = []
) => {
  const li = document.createElement("li");
  li.innerHTML = `<span>${text}</span>`;

  if (deleteHandler || additionalButtons.length > 0) {
    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    additionalButtons.forEach((btn) => btnGroup.appendChild(btn));

    if (deleteHandler) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "btn btn-danger btn-sm";
      deleteBtn.onclick = () => deleteHandler(id, text);
      btnGroup.appendChild(deleteBtn);
    }

    li.appendChild(btnGroup);
  }

  parent.appendChild(li);
};

const loadAllClasses = () => {
  onValue(ref(db, "classes"), (snapshot) => {
    dom.allClassesList.innerHTML = "";
    if (!snapshot.exists()) {
      dom.allClassesList.classList.add("empty");
      return;
    }
    dom.allClassesList.classList.remove("empty");
    snapshot.forEach((child) => {
      const manageBtn = document.createElement("button");
      manageBtn.textContent = "Manage Content";
      manageBtn.className = "btn btn-primary btn-sm";
      manageBtn.onclick = () => {
        appState.managingClassId = child.key;
        toggleHidden(dom.superAdminView, true);
        toggleHidden(dom.classContentView, false);
        toggleHidden(dom.courseManagementSection, true);
        toggleHidden(dom.backToClassListBtn, false);
        loadClassContent(child.key);
      };

      renderListItem(
        dom.allClassesList,
        `${child.val().className} (ID: ${child.key})`,
        child.key,
        (id, name) =>
          handleDelete(
            ref(db, `classes/${id}`),
            `class ${name.split(" (ID:")[0]}`
          ),
        [manageBtn]
      );
    });
  });
};

const loadAllCrs = () => {
  onValue(ref(db, "classAdmins"), (snapshot) => {
    dom.crList.innerHTML = "";
    if (!snapshot.exists()) {
      dom.crList.classList.add("empty");
      return;
    }
    dom.crList.classList.remove("empty");
    snapshot.forEach((child) => {
      renderListItem(
        dom.crList,
        `${child.val().name} (Class: ${child.val().classId})`,
        child.key,
        (id, name) =>
          handleDelete(
            ref(db, `classAdmins/${id}`),
            `CR ${name.split(" (Class:")[0]}`
          )
      );
    });
  });
};

const loadClassContent = (classId) => {
  onValue(ref(db, `classes/${classId}`), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    dom.classContentTitle.textContent = `Content Management: ${data.className}`;
    dom.routineLinkInput.value = data.routineLink || "";
    loadCoursesForClass(classId, data.courses);
    loadGenericList(
      classId,
      "courseAdvisors",
      dom.advisorsList,
      (item) => `${item.name} - ${item.designation}`
    );
    loadGenericList(
      classId,
      "calendarEvents",
      dom.eventsList,
      (item) => `${item.date}: ${item.title}`
    );
    loadGenericList(
      classId,
      "notices",
      dom.noticesList,
      (item) => `${item.date}: ${item.title}`
    );
    loadGenericList(
      classId,
      "oldQuestions",
      dom.oldQuestionsList,
      (item) => item.title
    );
    loadGenericList(
      classId,
      "groupLinks",
      dom.groupLinksList,
      (item) => `${item.name} (${item.type})`
    );
    populateResultsCourseSelect(data.courses);
  });
  loadStudentsForClass(classId);
  loadPendingPayments(classId);
  loadPendingUpdates(classId);
};

const loadGenericList = (classId, path, element, formatter) => {
  const listRef = ref(db, `classes/${classId}/${path}`);
  onValue(listRef, (snapshot) => {
    element.innerHTML = "";
    if (!snapshot.exists()) {
      element.classList.add("empty");
      return;
    }
    element.classList.remove("empty");
    snapshot.forEach((child) => {
      renderListItem(element, formatter(child.val()), child.key, () =>
        handleDelete(ref(db, `classes/${classId}/${path}/${child.key}`), "item")
      );
    });
  });
};

const loadCoursesForClass = (classId, courses) => {
  dom.myCoursesList.innerHTML = "";
  if (!courses) {
    dom.myCoursesList.classList.add("empty");
    return;
  }
  dom.myCoursesList.classList.remove("empty");
  Object.entries(courses).forEach(([id, data]) => {
    const manageBtn = document.createElement("button");
    manageBtn.textContent = "Manage Course";
    manageBtn.className = "btn btn-primary btn-sm";
    manageBtn.onclick = () => showCourseManagementView(id);
    renderListItem(
      dom.myCoursesList,
      `${data.courseName} (${data.courseCode})`,
      id,
      (id, name) =>
        handleDelete(
          ref(db, `classes/${classId}/courses/${id}`),
          `course "${name.split(" (")[0]}"`
        ),
      [manageBtn]
    );
  });
};

const loadAndDisplayCourseDetails = (courseId) => {
  const courseRef = ref(
    db,
    `classes/${appState.managingClassId}/courses/${courseId}`
  );
  appState.courseDataListener = onValue(courseRef, (snapshot) => {
    if (!snapshot.exists()) {
      showClassContentView();
      return;
    }
    const data = snapshot.val();
    dom.managingCourseTitle.textContent = `Course Management: ${data.courseName} (${data.courseCode})`;
    const t1 = data.teacherInfo || {};
    const t2 = data.teacherInfo2 || {};
    dom.teacher1Form.elements.t1Name.value = t1.name || "";
    dom.teacher1Form.elements.t1Designation.value = t1.designation || "";
    dom.teacher1Form.elements.t1Department.value = t1.department || "";
    dom.teacher1Form.elements.t1Phone.value = t1.phone || "";
    dom.teacher2Form.elements.t2Name.value = t2.name || "";
    dom.teacher2Form.elements.t2Designation.value = t2.designation || "";
    dom.teacher2Form.elements.t2Department.value = t2.department || "";
    dom.teacher2Form.elements.t2Phone.value = t2.phone || "";
    const isSessional = data.type === "sessional";
    toggleHidden(dom.teacher2Section, !isSessional);
    toggleHidden(dom.theoryCourseSections, isSessional);
    toggleHidden(dom.sessionalCourseSections, !isSessional);
    if (!isSessional) {
      const ctq = data.ctQuestions || {};
      dom.ctForm.elements.ct1Url.value = ctq.CT1 || "";
      dom.ctForm.elements.ct2Url.value = ctq.CT2 || "";
      dom.ctForm.elements.ct3Url.value = ctq.CT3 || "";
      dom.ctForm.elements.midtermUrl.value = ctq.Midterm || "";
      renderSubList(
        dom.resourcesList,
        data.resources,
        (item) => item.topic,
        "resources"
      );
      renderSubList(
        dom.assignmentsList,
        data.assignments,
        (item) => `${item.name} - Due: ${item.submissionDate}`,
        "assignments"
      );
    } else {
      renderSubList(
        dom.sessionalResourcesList,
        data.resources,
        (item) => item.topic,
        "resources"
      );
      renderSubList(
        dom.sessionalAssignmentsList,
        data.assignments,
        (item) => `${item.name} - Due: ${item.submissionDate}`,
        "assignments"
      );
      renderSubList(
        dom.labReportsList,
        data.labReports,
        (item) => `${item.experimentName} - Submit: ${item.submissionDate}`,
        "labReports"
      );
    }
  });
};

const renderSubList = (listElement, dataObject, formatter, path) => {
  listElement.innerHTML = "";
  if (!dataObject) {
    listElement.classList.add("empty");
    return;
  }
  listElement.classList.remove("empty");
  Object.entries(dataObject).forEach(([id, item]) => {
    renderListItem(listElement, formatter(item), id, () =>
      handleDelete(
        ref(
          db,
          `classes/${appState.managingClassId}/courses/${appState.managingCourseId}/${path}/${id}`
        ),
        "item"
      )
    );
  });
};

const renderStudentsList = () => {
  dom.studentsList.innerHTML = "";
  if (appState.classStudents.length === 0) {
    dom.studentsList.classList.add("empty");
    return;
  }
  dom.studentsList.classList.remove("empty");
  appState.classStudents.forEach((student) => {
    renderListItem(
      dom.studentsList,
      `${student.name} (ID: ${student.id})`,
      student.id,
      (id, fullText) => {
        const name = fullText.split(" (ID:")[0];
        handleDeleteStudent(id, name);
      }
    );
  });
};

// --- DATA MANIPULATION FUNCTIONS ---
const handleDeleteStudent = (studentId, studentName) => {
  const confirmationMessage = `This will permanently delete the student "${studentName}" (ID: ${studentId}) and their associated username. Are you sure?`;
  showConfirmationToast(confirmationMessage, async () => {
    try {
      const studentRef = ref(db, `students/${studentId}`);
      const studentSnap = await get(studentRef);
      const updates = {};
      updates[`/students/${studentId}`] = null;
      if (studentSnap.exists()) {
        const studentData = studentSnap.val();
        if (studentData.username) {
          updates[`/usernames/${studentData.username}`] = null;
        }
      }
      await update(ref(db), updates);
      showToast(
        `Student "${studentName}" and associated data deleted successfully.`,
        "success"
      );
    } catch (error) {
      showToast(`Error deleting student: ${error.message}`, "error");
    }
  });
};

const handleAddClass = (e) => {
  e.preventDefault();
  const id = dom.classIdInput.value.trim();
  const name = dom.classNameInput.value.trim();
  if (id && name) {
    set(ref(db, `classes/${id}`), { className: name })
      .then(() => {
        dom.addClassForm.reset();
        showToast("Class created successfully!", "success");
      })
      .catch((error) => {
        showToast("Error creating class: " + error.message, "error");
      });
  }
};
const handleAddCr = (e) => {
  e.preventDefault();
  const uid = dom.crUidInput.value.trim();
  const name = dom.crNameInput.value.trim();
  const classId = dom.crClassIdInput.value.trim();
  if (uid && name && classId) {
    set(ref(db, `classAdmins/${uid}`), { name, classId })
      .then(() => {
        dom.addCrForm.reset();
        showToast("Class Representative added successfully!", "success");
      })
      .catch((error) => {
        showToast("Error adding CR: " + error.message, "error");
      });
  }
};

const handleAddCourse = (e) => {
  e.preventDefault();
  const code = dom.courseCodeInput.value.trim();
  const name = dom.courseNameInput.value.trim();
  const type = dom.courseTypeSelect.value;
  if (code && name) {
    const id = code.replace(/[\s./#$[\]]/g, "-");
    const data = { courseCode: code, courseName: name, type };
    if (type === "theory") {
      data.ctQuestions = { CT1: "", CT2: "", CT3: "", Midterm: "" };
    }
    const coursePath = `classes/${appState.managingClassId}/courses/${id}`;
    set(ref(db, coursePath), data)
      .then(() => {
        dom.addCourseForm.reset();
        showToast("Course added successfully!", "success");
        logUpdate(
          "New Course",
          `${name} (${code})`,
          `Type: ${type}`,
          false,
          coursePath
        );
      })
      .catch((error) => {
        showToast("Error adding course: " + error.message, "error");
      });
  }
};

const handleSaveTeacher = (e, key) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.elements[0].value.trim(),
    designation: form.elements[1].value.trim(),
    department: form.elements[2].value.trim(),
    phone: form.elements[3].value.trim(),
  };
  const teacherPath = `classes/${appState.managingClassId}/courses/${appState.managingCourseId}/${key}`;
  set(ref(db, teacherPath), data)
    .then(() => {
      showToast("Teacher information saved successfully!", "success");
      logUpdate(
        "Teacher Info",
        `Updated for ${data.name}`,
        `Course: ${appState.managingCourseId}`,
        false,
        teacherPath
      );
    })
    .catch((error) => {
      showToast("Error saving teacher info: " + error.message, "error");
    });
};

const handleUpdateCtQuestions = (e) => {
  e.preventDefault();
  const data = {
    CT1: dom.ctForm.elements.ct1Url.value.trim(),
    CT2: dom.ctForm.elements.ct2Url.value.trim(),
    CT3: dom.ctForm.elements.ct3Url.value.trim(),
    Midterm: dom.ctForm.elements.midtermUrl.value.trim(),
  };
  const ctPath = `classes/${appState.managingClassId}/courses/${appState.managingCourseId}/ctQuestions`;
  set(ref(db, ctPath), data)
    .then(() => {
      showToast("Question paper links updated successfully!", "success");
      logUpdate(
        "Exam Questions",
        `Question links updated`,
        `Course: ${appState.managingCourseId}`,
        false,
        ctPath
      );
    })
    .catch((error) => {
      showToast("Error updating question links: " + error.message, "error");
    });
};

const handleSaveRoutine = (e) => {
  e.preventDefault();
  const routineLink = dom.routineLinkInput.value.trim();
  const routinePath = `classes/${appState.managingClassId}/routineLink`;
  set(ref(db, routinePath), routineLink)
    .then(() => {
      showToast("Class routine link updated successfully!", "success");
      logUpdate(
        "Class Routine",
        "Routine Link Updated",
        `A new routine link was added/updated.`,
        false,
        routinePath
      );
    })
    .catch((error) => {
      showToast("Error updating routine link: " + error.message, "error");
    });
};

const handleAddItemToList = (form, path, dataBuilder) => {
  const itemData = dataBuilder();
  if (itemData) {
    const fullPath = `classes/${appState.managingClassId}/${path}`;
    const newItemRef = push(ref(db, fullPath), itemData);
    newItemRef
      .then(() => {
        form.reset();
        showToast("Item added successfully!", "success");
        const sourcePath = `${fullPath}/${newItemRef.key}`;
        if (path === "notices") {
          logUpdate(
            "New Notice",
            itemData.title,
            `Posted on ${itemData.date}`,
            false, // <-- CHANGED from true to false
            sourcePath
          );
        } else if (path === "calendarEvents") {
          logUpdate(
            "New Event",
            itemData.title,
            `On ${itemData.date}`,
            false, // <-- CHANGED from true to false
            sourcePath
          );
        } else if (path === "courseAdvisors") {
          logUpdate(
            "New Advisor",
            itemData.name,
            itemData.designation,
            false,
            sourcePath
          );
        } else if (path === "oldQuestions") {
          logUpdate(
            "Old Question",
            itemData.title,
            "New paper added",
            false,
            sourcePath
          );
        } else if (path === "groupLinks") {
          logUpdate(
            "Group Link",
            itemData.name,
            `Platform: ${itemData.type}`,
            false,
            sourcePath
          );
        }
      })
      .catch((error) => {
        showToast("Error adding item: " + error.message, "error");
      });
  }
};

const handleAddCourseSubItem = (form, path, dataBuilder) => {
  const itemData = dataBuilder();
  if (itemData) {
    const fullPath = `classes/${appState.managingClassId}/courses/${appState.managingCourseId}/${path}`;
    const newItemRef = push(ref(db, fullPath), itemData);
    newItemRef
      .then(() => {
        form.reset();
        showToast("Item added successfully!", "success");
        const sourcePath = `${fullPath}/${newItemRef.key}`;
        if (path === "resources") {
          logUpdate(
            "New Resource",
            itemData.topic,
            `Course: ${appState.managingCourseId}`,
            false,
            sourcePath
          );
        } else if (path === "assignments") {
          logUpdate(
            "New Assignment",
            itemData.name,
            `Due: ${itemData.submissionDate}`,
            false,
            sourcePath
          );
        } else if (path === "labReports") {
          logUpdate(
            "New Lab Report",
            itemData.experimentName,
            `Submit by: ${itemData.submissionDate}`,
            false,
            sourcePath
          );
        }
      })
      .catch((error) => {
        showToast("Error adding item: " + error.message, "error");
      });
  }
};

const loadStudentsForClass = (classId) => {
  onValue(ref(db, "students"), (snapshot) => {
    if (!snapshot.exists()) {
      appState.classStudents = [];
    } else {
      const allStudents = snapshot.val();
      const filteredStudents = [];
      for (const studentId in allStudents) {
        if (allStudents[studentId].classId === classId) {
          filteredStudents.push({ id: studentId, ...allStudents[studentId] });
        }
      }
      appState.classStudents = filteredStudents.sort((a, b) =>
        a.id.localeCompare(b.id)
      );
    }
    renderStudentsList();
    const selectedCourse = dom.resultsCourseSelect.value;
    if (selectedCourse) {
      handleCourseSelectionChange(selectedCourse);
    }
  });
};
const populateResultsCourseSelect = (courses) => {
  const currentSelection = dom.resultsCourseSelect.value;
  dom.resultsCourseSelect.innerHTML =
    '<option value="">-- Please select a course --</option>';
  if (!courses) return;
  Object.keys(courses)
    .sort()
    .forEach((courseId) => {
      const course = courses[courseId];
      if (course.type === "theory") {
        const option = document.createElement("option");
        option.value = courseId;
        option.textContent = `${course.courseName} (${course.courseCode})`;
        dom.resultsCourseSelect.appendChild(option);
      }
    });
  if (
    dom.resultsCourseSelect.querySelector(`option[value="${currentSelection}"]`)
  ) {
    dom.resultsCourseSelect.value = currentSelection;
  }
};

const handleCourseSelectionChange = async (courseId) => {
    dom.resultsTableContainer.innerHTML = '';
    toggleHidden(dom.saveResultsBtn, true); // বাটনটি প্রথমে লুকিয়ে ফেলুন

    if (!courseId) {
        return;
    }

    if (appState.classStudents.length === 0) {
        dom.resultsTableContainer.innerHTML = '<p style="text-align:center; color: var(--text-light); font-style: italic;">No students found for this class.</p>';
        return;
    }
    
    dom.resultsTableContainer.innerHTML = '<p style="text-align:center;">Loading results...</p>';

    const resultsRef = ref(db, `classes/${appState.managingClassId}/results/${courseId}`);
    const snapshot = await get(resultsRef);
    const existingResults = snapshot.exists() ? snapshot.val() : {};

    renderResultsTable(courseId, appState.classStudents, existingResults);
};

const renderResultsTable = (courseId, students, results) => {
    let tableHTML = `
        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table class="results-input-table" style="width: 100%; min-width: 800px; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background-color: var(--bg-accent);">
                        <th style="padding: 12px; text-align: left; position: sticky; left: 0; background-color: var(--bg-accent); z-index: 2;">Student ID</th>
                        <th style="padding: 12px; text-align: left; position: sticky; left: 150px; background-color: var(--bg-accent); z-index: 2;">Student Name</th>
                        <th style="padding: 12px; text-align: center;">CT-1</th>
                        <th style="padding: 12px; text-align: center;">CT-2</th>
                        <th style="padding: 12px; text-align: center;">CT-3</th>
                        <th style="padding: 12px; text-align: center;">Midterm</th>
                        <th style="padding: 12px; text-align: center;">Attendance (%)</th>
                        <th style="padding: 12px; text-align: center;">Total (120)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    students.forEach((student) => {
        const studentResult = results[student.id] || {};
        tableHTML += `
            <tr data-student-id="${student.id}" style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 8px; font-weight: 500; position: sticky; left: 0; background-color: var(--bg-surface); z-index: 1;">${student.id}</td>
                <td style="padding: 8px; position: sticky; left: 150px; background-color: var(--bg-surface); z-index: 1;">${student.name}</td>
                <td style="padding: 8px;"><input type="number" step="0.01" data-field="ct1" value="${studentResult.ct1 ?? ''}" class="result-input" placeholder="0" style="width: 80px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);"></td>
                <td style="padding: 8px;"><input type="number" step="0.01" data-field="ct2" value="${studentResult.ct2 ?? ''}" class="result-input" placeholder="0" style="width: 80px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);"></td>
                <td style="padding: 8px;"><input type="number" step="0.01" data-field="ct3" value="${studentResult.ct3 ?? ''}" class="result-input" placeholder="0" style="width: 80px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);"></td>
                <td style="padding: 8px;"><input type="number" step="0.01" data-field="midterm" value="${studentResult.midterm ?? ''}" class="result-input" placeholder="0" style="width: 80px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);"></td>
                <td style="padding: 8px;"><input type="number" step="0.01" data-field="attendance" value="${studentResult.attendance ?? ''}" class="result-input" placeholder="100" style="width: 90px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);"></td>
                <td style="padding: 8px;"><input type="number" step="0.01" data-field="total" value="${studentResult.total ?? ''}" class="result-input" placeholder="0" style="width: 90px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);"></td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table></div>';
    dom.resultsTableContainer.innerHTML = tableHTML;
    
    toggleHidden(dom.saveResultsBtn, students.length === 0);
};

const handleSaveResults = () => {
  const courseId = dom.resultsCourseSelect.value;
  if (!courseId) {
    showToast("Please select a course first.", "error");
    return;
  }
  const updates = {};
  const rows = dom.resultsTableContainer.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const studentId = row.dataset.studentId;
    const studentResults = {};
    row.querySelectorAll(".result-input").forEach((input) => {
      const field = input.dataset.field;
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        studentResults[field] = value;
      }
    });
    if (Object.keys(studentResults).length > 0) {
      updates[
        `/classes/${appState.managingClassId}/results/${courseId}/${studentId}`
      ] = studentResults;
    }
  });
  if (Object.keys(updates).length === 0) {
    showToast("No new results entered to save.", "success");
    return;
  }
  update(ref(db), updates)
    .then(() => {
      showToast("Results saved successfully!", "success");
    })
    .catch((error) => {
      showToast("Error saving results: " + error.message, "error");
    });
};
const handleAddStudent = (e) => {
  e.preventDefault();
  const studentId = dom.addStudentForm.elements.studentIdInput.value.trim();
  const studentName = dom.addStudentForm.elements.studentNameInput.value.trim();
  const maxDeviceLimit = parseInt(
    dom.addStudentForm.elements.studentDeviceLimitInput.value,
    10
  );
  const isPaid = dom.addStudentForm.elements.studentPaidStatus.checked;
  if (!studentId || !studentName) {
    showToast("Student ID and Name are required.", "error");
    return;
  }
  if (isNaN(maxDeviceLimit) || maxDeviceLimit < 1) {
    showToast(
      "Please enter a valid number for the device limit (1 or more).",
      "error"
    );
    return;
  }
  const studentData = {
    name: studentName,
    classId: appState.managingClassId,
    paid: isPaid,
    maxDeviceLimit: maxDeviceLimit,
  };
  set(ref(db, `students/${studentId}`), studentData)
    .then(() => {
      showToast("Student added successfully!", "success");
      dom.addStudentForm.reset();
      dom.addStudentForm.elements.studentPaidStatus.checked = true;
    })
    .catch((error) => {
      showToast("Error adding student: " + error.message, "error");
    });
};
const loadPendingPayments = async (classIdForCR = null) => {
  const listElement =
    appState.userRole === "super"
      ? dom.pendingPaymentsList
      : dom.classPendingPaymentsList;
  if (!listElement) return;
  const pendingRef = ref(db, "pendingPayments");
  onValue(pendingRef, async (snapshot) => {
    listElement.innerHTML = "";
    if (!snapshot.exists()) {
      listElement.classList.add("empty");
      return;
    }
    listElement.classList.remove("empty");
    const payments = snapshot.val();
    const studentDataPromises = Object.keys(payments).map((studentId) =>
      get(ref(db, `students/${studentId}`)).then((snap) => ({
        studentId,
        studentData: snap.val(),
        paymentData: payments[studentId],
      }))
    );
    const results = await Promise.all(studentDataPromises);
    let hasVisiblePayments = false;
    results.forEach(({ studentId, studentData, paymentData }) => {
      if (!studentData) return;
      if (
        appState.userRole === "super" ||
        studentData.classId === classIdForCR
      ) {
        hasVisiblePayments = true;
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "Approve";
        approveBtn.className = "btn btn-success btn-sm";
        approveBtn.onclick = () => handlePaymentApproval(studentId, true);
        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.className = "btn btn-danger btn-sm";
        rejectBtn.onclick = () => handlePaymentApproval(studentId, false);
        const displayText = `<span><strong>${studentData.name || "Unknown"
          } (${studentId})</strong><br><small>BKash: ${paymentData.bkashNumber
          } | TrxID: ${paymentData.trxId}</small></span>`;
        const li = document.createElement("li");
        li.innerHTML = displayText;
        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group";
        btnGroup.append(approveBtn, rejectBtn);
        li.appendChild(btnGroup);
        listElement.appendChild(li);
      }
    });
    if (!hasVisiblePayments) {
      listElement.classList.add("empty");
    }
  });
};
const handlePaymentApproval = (studentId, isApproved) => {
  const updates = {};
  if (isApproved) {
    updates[`/students/${studentId}/paid`] = true;
  }
  updates[`/pendingPayments/${studentId}`] = null;
  update(ref(db), updates)
    .then(() => {
      showToast(
        `Payment for ${studentId} ${isApproved ? "approved" : "rejected"}.`,
        "success"
      );
    })
    .catch((error) => {
      showToast("Error processing payment: " + error.message, "error");
    });
};

// --- NEW FUNCTIONS FOR UPDATE DISTRIBUTION ---
const loadPendingUpdates = (classId) => {
  const listRef = ref(db, `pendingUpdates/${classId}`);
  onValue(listRef, (snapshot) => {
    dom.updatesToSendList.innerHTML = "";
    if (!snapshot.exists()) {
      dom.updatesToSendList.classList.add("empty");
      return;
    }
    dom.updatesToSendList.classList.remove("empty");
    snapshot.forEach((child) => {
      const updateData = child.val();
      const displayText = `<strong>[${updateData.type}]</strong> ${updateData.title} <br><small>${updateData.details}</small>`;
      renderListItem(dom.updatesToSendList, displayText, child.key, () =>
        remove(ref(db, `pendingUpdates/${classId}/${child.key}`))
      );
    });
  });
};

const handleSendAndClearUpdates = async () => {
  const classId = appState.managingClassId;
  if (!classId) {
    showToast("Error: No class is being managed.", "error");
    return;
  }

  const button = dom.sendAndClearUpdatesBtn;
  button.disabled = true;
  button.textContent = "Processing...";

  try {
    const pendingUpdatesRef = ref(db, `pendingUpdates/${classId}`);
    const snapshot = await get(pendingUpdatesRef);

    if (!snapshot.exists()) {
      showToast("No pending updates to send.", "success");
      button.disabled = false;
      button.textContent = "Send Updates & Clean Up";
      return;
    }

    showConfirmationToast(
      "This will start the email notification process and then clean up disposable items. Are you sure?",
      async () => {
        try {
          showToast("Starting the update sending process...", "success");
          const sendUpdates = httpsCallable(functions, "sendUpdatesForClass");
          const result = await sendUpdates({ classId });

          if (!result.data.success) {
            throw new Error(
              result.data.message || "The cloud function reported an error."
            );
          }

          // Notify the user that the process has started in the background
          showToast("Process started! Emails are being sent in the background.", "success");
          console.log("Cloud function success:", result.data.message);

          // Proceed with cleaning up the data on the client-side
          const pendingUpdates = snapshot.val();
          const cleanupUpdates = {};
          for (const key in pendingUpdates) {
            const item = pendingUpdates[key];
            if (item.isDisposable && item.sourcePath) {
              cleanupUpdates[item.sourcePath] = null;
            }
          }
          cleanupUpdates[`/pendingUpdates/${classId}`] = null;

          await update(ref(db), cleanupUpdates);
          showToast("Portal data has been cleaned up successfully!", "success");

        } catch (error) {
          console.error("Error in handleSendAndClearUpdates:", error);
          showToast(`Operation failed: ${error.message}`, "error");
        } finally {
          // Ensure the button is re-enabled after completion or failure
          button.disabled = false;
          button.textContent = "Send Updates & Clean Up";
        }
      }
    );

    // This part helps re-enable the button if the user just closes the confirmation dialog without choosing an option.
    setTimeout(() => {
        if (button.disabled) { 
            // Check if the confirmation toast is still visible
            const confirmationToast = document.querySelector('.toast.confirm');
            if (!confirmationToast) {
                 button.disabled = false;
                 button.textContent = "Send Updates & Clean Up";
            }
        }
    }, 500);


  } catch (dbError) {
    console.error("Error reading from DB:", dbError);
    showToast(`Could not read updates: ${dbError.message}`, "error");
    button.disabled = false;
    button.textContent = "Send Updates & Clean Up";
  }
};

const handleSendManualNotice = async (e) => {
  e.preventDefault();
  const classId = appState.managingClassId;
  const title = dom.manualNoticeForm.elements.manualNoticeTitle.value.trim();
  const content =
    dom.manualNoticeForm.elements.manualNoticeContent.value.trim();

  if (!classId || !title || !content) {
    showToast("Class ID, Title, and Content are required.", "error");
    return;
  }

  const button = dom.sendManualNoticeBtn;
  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const sendNotice = httpsCallable(functions, "sendManualNotice");
    const result = await sendNotice({ classId, title, content });

    if (!result.data.success) {
      throw new Error(
        result.data.message || "The cloud function for manual notice failed."
      );
    }

    console.log("Cloud function success:", result.data.message);
    showToast("Manual notice sent successfully!", "success");
    dom.manualNoticeForm.reset();
  } catch (error) {
    console.error("handleSendManualNotice Error:", error);
    showToast(`Failed to send notice: ${error.message}`, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Send Manual Notice";
  }
};

// --- INITIALIZATION & EVENT LISTENERS ---
const init = () => {
  dom.passwordToggleIcon.addEventListener("click", () => {
    const isPassword = dom.adminPasswordInput.type === "password";
    dom.adminPasswordInput.type = isPassword ? "text" : "password";
    const eyeIcon = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
    const eyeSlashIcon = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />`;
    dom.passwordToggleIcon.innerHTML = isPassword ? eyeSlashIcon : eyeIcon;
  });

  dom.loginBtn.addEventListener("click", () => {
    const email = dom.adminEmailInput.value.trim();
    const password = dom.adminPasswordInput.value.trim();
    if (!email || !password) {
      showToast("Please enter both email and password.", "error");
      return;
    }
    dom.loginBtn.textContent = "Signing in...";
    dom.loginBtn.disabled = true;
    signInWithEmailAndPassword(auth, email, password)
      .catch((error) => {
        showToast("Login failed: Invalid credentials.", "error");
      })
      .finally(() => {
        dom.loginBtn.textContent = "Sign In to Dashboard";
        dom.loginBtn.disabled = false;
      });
  });

  [dom.adminEmailInput, dom.adminPasswordInput].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        dom.loginBtn.click();
      }
    });
  });

  dom.logoutBtn.addEventListener("click", () => {
    showConfirmationToast("Are you sure you want to sign out?", () => {
      signOut(auth);
    });
  });

  dom.backToCoursesBtn.addEventListener("click", showClassContentView);

  dom.backToClassListBtn.addEventListener("click", () => {
    appState.managingClassId = null;
    toggleHidden(dom.superAdminView, false);
    toggleHidden(dom.classContentView, true);
    toggleHidden(dom.courseManagementSection, true);
  });

  dom.mainTabs.addEventListener("click", (e) => {
    const clickedButton = e.target.closest(".tab-button");
    if (!clickedButton || clickedButton.classList.contains("active")) {
      return;
    }
    const viewIdToShow = clickedButton.dataset.view;
    dom.mainTabs.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("active");
    });
    clickedButton.classList.add("active");
    document
      .querySelectorAll("#classContentView > .view-panel")
      .forEach((panel) => {
        panel.classList.add("hidden");
      });
    const panelToShow = document.getElementById(viewIdToShow);
    if (panelToShow) {
      panelToShow.classList.remove("hidden");
    }
  });

  dom.addClassForm.addEventListener("submit", handleAddClass);
  dom.addCrForm.addEventListener("submit", handleAddCr);
  dom.addCourseForm.addEventListener("submit", handleAddCourse);
  dom.teacher1Form.addEventListener("submit", (e) =>
    handleSaveTeacher(e, "teacherInfo")
  );
  dom.teacher2Form.addEventListener("submit", (e) =>
    handleSaveTeacher(e, "teacherInfo2")
  );
  dom.ctForm.addEventListener("submit", handleUpdateCtQuestions);
  dom.routineForm.addEventListener("submit", handleSaveRoutine);

  dom.addAdvisorForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddItemToList(dom.addAdvisorForm, "courseAdvisors", () => {
      const name = dom.addAdvisorForm.elements.advisorName.value.trim();
      const designation =
        dom.addAdvisorForm.elements.advisorDesignation.value.trim();
      const department =
        dom.addAdvisorForm.elements.advisorDepartment.value.trim();
      const phone = dom.addAdvisorForm.elements.advisorPhone.value.trim();
      const email = dom.addAdvisorForm.elements.advisorEmail.value.trim();
      if (name && designation && department && phone && email) {
        return { name, designation, department, phone, email };
      }
      showToast("Please fill in all advisor details.", "error");
      return null;
    });
  });
  dom.addEventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddItemToList(dom.addEventForm, "calendarEvents", () => {
      const date = dom.addEventForm.elements.eventDate.value;
      const title = dom.addEventForm.elements.eventTitle.value.trim();
      const type = dom.addEventForm.elements.eventType.value;
      const description =
        dom.addEventForm.elements.eventDescription.value.trim();
      if (date && title) {
        return { date, title, type, description };
      }
      showToast("Please enter event date and title.", "error");
      return null;
    });
  });
  dom.addNoticeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddItemToList(dom.addNoticeForm, "notices", () => {
      const date = dom.addNoticeForm.elements.noticeDate.value.trim();
      const title = dom.addNoticeForm.elements.noticeTitle.value.trim();
      const content = dom.addNoticeForm.elements.noticeContent.value.trim();
      if (date && title && content) {
        return { date, title, content };
      }
      showToast("Please fill in all notice fields.", "error");
      return null;
    });
  });
  dom.addOldQuestionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddItemToList(dom.addOldQuestionForm, "oldQuestions", () => {
      const title =
        dom.addOldQuestionForm.elements.oldQuestionTitle.value.trim();
      const url = dom.addOldQuestionForm.elements.oldQuestionUrl.value.trim();
      if (title && url) {
        return { title, url };
      }
      showToast("Please enter question title and URL.", "error");
      return null;
    });
  });
  dom.addGroupLinkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const platformIcons = {
      WhatsApp:
        "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
      Telegram:
        "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
      Facebook:
        "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
      Discord: "https://www.svgrepo.com/show/353655/discord-icon.svg",
    };
    handleAddItemToList(dom.addGroupLinkForm, "groupLinks", () => {
      const name = dom.addGroupLinkForm.elements.groupLinkName.value.trim();
      const type = dom.addGroupLinkForm.elements.groupLinkType.value;
      const url = dom.addGroupLinkForm.elements.groupLinkUrl.value.trim();
      const iconUrl = platformIcons[type];
      if (name && url && iconUrl) {
        return { name, type, url, icon: iconUrl };
      }
      showToast("Please enter group name and URL.", "error");
      return null;
    });
  });

  dom.addResourceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddCourseSubItem(dom.addResourceForm, "resources", () => {
      const topic = dom.addResourceForm.elements.resourceTopic.value.trim();
      const url = dom.addResourceForm.elements.resourceUrl.value.trim();
      if (topic && url) {
        return { topic, url };
      }
      showToast("Please enter resource topic and URL.", "error");
      return null;
    });
  });
  dom.sessionalAddResourceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddCourseSubItem(dom.sessionalAddResourceForm, "resources", () => {
      const topic =
        dom.sessionalAddResourceForm.elements.sessionalResourceTopic.value.trim();
      const url =
        dom.sessionalAddResourceForm.elements.sessionalResourceUrl.value.trim();
      if (topic && url) {
        return { topic, url };
      }
      showToast("Please enter resource topic and URL.", "error");
      return null;
    });
  });
  dom.addAssignmentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddCourseSubItem(dom.addAssignmentForm, "assignments", () => {
      const name = dom.addAssignmentForm.elements.assignmentName.value.trim();
      const submissionDate =
        dom.addAssignmentForm.elements.assignmentDate.value.trim();
      if (name && submissionDate) {
        return { name, submissionDate };
      }
      showToast("Please enter assignment name and submission date.", "error");
      return null;
    });
  });
  dom.sessionalAddAssignmentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddCourseSubItem(
      dom.sessionalAddAssignmentForm,
      "assignments",
      () => {
        const name =
          dom.sessionalAddAssignmentForm.elements.sessionalAssignmentName.value.trim();
        const submissionDate =
          dom.sessionalAddAssignmentForm.elements.sessionalAssignmentDate.value.trim();
        if (name && submissionDate) {
          return { name, submissionDate };
        }
        showToast("Please enter assignment name and submission date.", "error");
        return null;
      }
    );
  });
  dom.addLabReportForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddCourseSubItem(dom.addLabReportForm, "labReports", () => {
      const experimentName =
        dom.addLabReportForm.elements.labExperimentName.value.trim();
      const experimentDate =
        dom.addLabReportForm.elements.labExperimentDate.value.trim();
      const submissionDate =
        dom.addLabReportForm.elements.labSubmissionDate.value.trim();
      if (experimentName && experimentDate && submissionDate) {
        return { experimentName, experimentDate, submissionDate };
      }
      showToast("Please fill in all lab report details.", "error");
      return null;
    });
  });

  dom.resultsCourseSelect.addEventListener("change", (e) =>
    handleCourseSelectionChange(e.target.value)
  );
  dom.saveResultsBtn.addEventListener("click", handleSaveResults);
  dom.addStudentForm.addEventListener("submit", handleAddStudent);

  if (dom.sendAndClearUpdatesBtn) {
    dom.sendAndClearUpdatesBtn.addEventListener(
      "click",
      handleSendAndClearUpdates
    );
  }
  if (dom.manualNoticeForm) {
    dom.manualNoticeForm.addEventListener("submit", handleSendManualNotice);
  }
};

init();