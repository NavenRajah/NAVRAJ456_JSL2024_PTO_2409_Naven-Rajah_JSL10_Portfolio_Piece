// Import helper functions from utils
import { getTasks, saveTasks } from "./utils/taskFunctions.js";
import { initialData } from "./initialData.js";

// Check if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem("tasks")) {
    localStorage.setItem("tasks", JSON.stringify(initialData));
    localStorage.setItem("showSideBar", "true");
  }
}

// Get elements from the DOM
const elements = {
  headerBoardName: document.getElementById("header-board-name"),
  createNewTaskBtn: document.getElementById("add-new-task-btn"),
  filterDiv: document.getElementById("filterDiv"),
  modalWindow: document.getElementById("task-form"),
  taskForm: document.getElementById("task-form"),
  taskTitleInput: document.getElementById("task-title"),
  taskDescriptionInput: document.getElementById("task-description"),
  taskStatusSelect: document.getElementById("task-status"),
  columnDivs: document.querySelectorAll(".column-div"),
  saveChangesBtn: document.getElementById("save-changes-btn"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  deleteTaskBtn: document.getElementById("delete-task-btn"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  // If you want theme switch, add here
  // themeSwitch: document.getElementById("switch"),
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map((task) => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ""; // Clears the container
  boards.forEach((board) => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter((task) => task.board === boardName);

  elements.columnDivs.forEach((column) => {
    const status = column.getAttribute("data-status");
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container";
    column.appendChild(tasksContainer);

    filteredTasks
      .filter((task) => task.status === status)
      .forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task-div");
        taskElement.textContent = task.title;
        taskElement.setAttribute("data-task-id", task.id);

        taskElement.addEventListener("click", () => {
          openEditTaskModal(task);
        });

        tasksContainer.appendChild(taskElement);
      });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

function styleActiveBoard(boardName) {
  document.querySelectorAll(".board-btn").forEach((btn) => {
    if (btn.textContent === boardName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(
    `.column-div[data-status="${task.status}"]`
  );
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector(".tasks-container");
  if (!tasksContainer) {
    tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container";
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement("div");
  taskElement.className = "task-div";
  taskElement.textContent = task.title;
  taskElement.setAttribute("data-task-id", task.id);

  tasksContainer.appendChild(taskElement);
}

// ------------------ Event Listeners ----------------------
function setupEventListeners() {
  // Cancel add/edit task event listener
  if (elements.cancelEditBtn) {
    elements.cancelEditBtn.addEventListener("click", () => {
      toggleModal(false);
      elements.filterDiv.style.display = "none";
    });
  }
  // Delete task
  if (elements.deleteTaskBtn) {
    elements.deleteTaskBtn.addEventListener("click", () => {
      const editingId = elements.modalWindow.getAttribute("data-editing-id");
      if (editingId) {
        const tasks = getTasks().filter((t) => t.id != editingId);
        saveTasks(tasks);
        toggleModal(false);
        elements.filterDiv.style.display = "none";
        refreshTasksUI();
      }
    });
  }
  // Show modal to add new task
  if (elements.createNewTaskBtn) {
    elements.createNewTaskBtn.addEventListener("click", () => {
      elements.modalWindow.removeAttribute("data-editing-id");
      elements.modalWindow.reset();
      toggleModal(true);
      elements.filterDiv.style.display = "block";
    });
  }
  // Save changes button (edit)
  if (elements.saveChangesBtn) {
    elements.saveChangesBtn.addEventListener("click", () => {
      const editingId = elements.modalWindow.getAttribute("data-editing-id");
      if (editingId) saveTaskChanges(Number(editingId));
    });
  }
  // Main form submission (add)
  if (elements.modalWindow) {
    elements.modalWindow.addEventListener("submit", (event) => {
      addTask(event);
    });
  }
  // Clicking outside the modal to close it
  if (elements.filterDiv) {
    elements.filterDiv.addEventListener("click", () => {
      toggleModal(false);
      elements.filterDiv.style.display = "none";
    });
  }
  // Sidebar
  if (elements.hideSideBarBtn) {
    elements.hideSideBarBtn.addEventListener("click", () =>
      toggleSidebar(false)
    );
  }
  if (elements.showSideBarBtn) {
    elements.showSideBarBtn.addEventListener("click", () =>
      toggleSidebar(true)
    );
  }
}

// ------------------ Modal/Toggles -------------------
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? "block" : "none";
}

// ----------- Add/Edit/Delete Functions ---------------
function addTask(event) {
  event.preventDefault();

  const title = elements.taskTitleInput.value.trim();
  const description = elements.taskDescriptionInput.value.trim();
  const status = elements.taskStatusSelect.value;

  if (!title) {
    alert("Title is required.");
    return;
  }

  const tasks = getTasks();
  const newTask = {
    id: Date.now(),
    title,
    description,
    status,
    board: activeBoard,
  };

  tasks.push(newTask);
  saveTasks(tasks);

  toggleModal(false);
  elements.filterDiv.style.display = "none";
  event.target.reset();
  refreshTasksUI();
}

function openEditTaskModal(task) {
  elements.taskTitleInput.value = task.title;
  elements.taskDescriptionInput.value = task.description;
  elements.taskStatusSelect.value = task.status;

  elements.modalWindow.setAttribute("data-editing-id", task.id);

  toggleModal(true, elements.modalWindow);
  elements.filterDiv.style.display = "block";
}

function saveTaskChanges(taskId) {
  const title = elements.taskTitleInput.value.trim();
  const description = elements.taskDescriptionInput.value.trim();
  const status = elements.taskStatusSelect.value;

  if (!title) {
    alert("Task must have a title.");
    return;
  }

  const tasks = getTasks().map((task) => {
    if (task.id === taskId) {
      return { ...task, title, description, status };
    }
    return task;
  });

  saveTasks(tasks);
  toggleModal(false);
  elements.filterDiv.style.display = "none";
  refreshTasksUI();
}

function toggleSidebar(show) {
  const sidebar = document.getElementById("side-bar-div");
  if (!sidebar) return;
  sidebar.style.display = show ? "flex" : "none";
  localStorage.setItem("showSideBar", show ? "true" : "false");
}

// ------------- INIT ---------------------
document.addEventListener("DOMContentLoaded", function () {
  initializeData();
  init();
});
function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem("showSideBar") === "true";
  toggleSidebar(showSidebar);
  fetchAndDisplayBoardsAndTasks();
}
