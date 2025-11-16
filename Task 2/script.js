// Load tasks
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const input = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

const searchBar = document.getElementById("searchBar");
const filterCategory = document.getElementById("filterCategory");
const filterPriority = document.getElementById("filterPriority");
const tabs = document.querySelectorAll(".tab");

const themeToggle = document.getElementById("themeToggle");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

let activeTab = "all";

// Modal Elements
const editModal = document.getElementById("editModal");
const editText = document.getElementById("editText");
const editDate = document.getElementById("editDate");
const subtaskList = document.getElementById("subtaskList");
const newSubtask = document.getElementById("newSubtask");
const addSubtaskBtn = document.getElementById("addSubtaskBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

let currentEditIndex = null;

// -------- ADD TASK --------
addBtn.onclick = () => {
    if (input.value.trim() === "") return alert("Enter a task!");

    tasks.push({
        text: input.value,
        category: category.value,
        priority: priority.value,
        date: taskDate.value,
        completed: false,
        subtasks: []
    });

    updateStorage();
    renderTasks();

    input.value = "";
    taskDate.value = "";
};

// -------- RENDER TASKS --------
function renderTasks() {
    taskList.innerHTML = "";

    let filtered = tasks.filter(task => {
        if (!task.text.toLowerCase().includes(searchBar.value.toLowerCase())) return false;

        if (filterCategory.value !== "all" && task.category !== filterCategory.value) return false;

        if (filterPriority.value !== "all" && task.priority !== filterPriority.value) return false;

        if (activeTab === "pending" && task.completed) return false;

        if (activeTab === "completed" && !task.completed) return false;

        return true;
    });

    filtered.forEach((task, index) => createTaskItem(task, index));

    updateProgress();
}

// ------- Create Task Element -------
function createTaskItem(task, index) {
    const li = document.createElement("li");
    li.className = `task priority-${task.priority}`;
    if (task.completed) li.classList.add("completed");

    li.draggable = true;

    li.innerHTML = `
        <div>
            <b>[${task.category}]</b> ${task.text}
            <div style="font-size:12px; opacity:.7;">${task.date || ""}</div>
        </div>
        <div>
            <button class="edit-btn">✏</button>
            <button class="remove-btn">X</button>
        </div>
    `;

    li.querySelector(".remove-btn").onclick = () => {
        tasks.splice(index, 1);
        updateStorage();
        renderTasks();
    };

    li.querySelector(".edit-btn").onclick = () => openEditModal(index);

    li.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-btn") || e.target.classList.contains("edit-btn")) return;
        task.completed = !task.completed;
        updateStorage();
        renderTasks();
    });

    // Dragging
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    taskList.appendChild(li);
}

// Drag Sort
taskList.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const after = getDragAfterElement(taskList, e.clientY);

    if (after == null) taskList.appendChild(dragging);
    else taskList.insertBefore(dragging, after);

    reorderTasks();
});

function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll(".task:not(.dragging)")];

    return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);

        if (offset < 0 && offset > closest.offset)
            return { offset, element: child };
        else return closest;

    }, { offset: -Infinity }).element;
}

function reorderTasks() {
    const newOrder = [];
    document.querySelectorAll(".task").forEach(li => {
        const text = li.querySelector("div").innerText.split("] ")[1];
        const task = tasks.find(t => t.text === text);
        newOrder.push(task);
    });
    tasks = newOrder;
    updateStorage();
}

// ------- Edit Modal -------
function openEditModal(index) {
    currentEditIndex = index;
    const task = tasks[index];

    editText.value = task.text;
    editDate.value = task.date;

    subtaskList.innerHTML = "";
    task.subtasks.forEach((s, i) => {
        let li = document.createElement("li");
        li.textContent = s;
        subtaskList.appendChild(li);
    });

    editModal.style.display = "flex";
}

closeModalBtn.onclick = () => editModal.style.display = "none";

addSubtaskBtn.onclick = () => {
    if (newSubtask.value.trim() === "") return;
    tasks[currentEditIndex].subtasks.push(newSubtask.value);
    newSubtask.value = "";
    updateStorage();
    openEditModal(currentEditIndex);
};

saveEditBtn.onclick = () => {
    let task = tasks[currentEditIndex];
    task.text = editText.value;
    task.date = editDate.value;
    updateStorage();
    editModal.style.display = "none";
    renderTasks();
};

// ------- Progress Bar -------
function updateProgress() {
    let done = tasks.filter(t => t.completed).length;
    let total = tasks.length;
    let percent = total ? (done / total) * 100 : 0;
    document.getElementById("progressFill").style.width = percent + "%";
}

// ------- Theme Toggle -------
themeToggle.onclick = () => {
    document.body.classList.toggle("light-theme");
};

// ------- Export / Import -------
exportBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(tasks)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
};

importBtn.onclick = () => importFile.click();

importFile.onchange = () => {
    const file = importFile.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        tasks = JSON.parse(e.target.result);
        updateStorage();
        renderTasks();
    };
    reader.readAsText(file);
};

// ------- Filters & Search -------
searchBar.oninput = renderTasks;
filterCategory.onchange = renderTasks;
filterPriority.onchange = renderTasks;

tabs.forEach(tab => {
    tab.onclick = () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeTab = tab.dataset.tab;
        renderTasks();
    };
});

// Save
function updateStorage() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Initial Load
renderTasks();
