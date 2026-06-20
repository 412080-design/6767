/**
 * 每日任務規劃 - JavaScript 邏輯
 * 功能：任務管理、LocalStorage 存儲、進度統計、編輯刪除等
 */

// ============================================================
// 1. 常數定義
// ============================================================

const STORAGE_KEY = 'dailyPlannerTasks';
const PRIORITY_LABELS = {
    high: '🔴 高優先級',
    medium: '🟡 中優先級',
    low: '🟢 低優先級'
};

// ============================================================
// 2. 應用程序狀態
// ============================================================

let appState = {
    tasks: [],
    editingTaskId: null
};

// ============================================================
// 3. DOM 元素選擇
// ============================================================

const elements = {
    // 輸入相關
    taskInput: document.getElementById('taskInput'),
    prioritySelect: document.getElementById('prioritySelect'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    
    // 任務列表
    tasksList: document.getElementById('tasksList'),
    completedList: document.getElementById('completedList'),
    
    // 進度相關
    progressBar: document.getElementById('progressBar'),
    progressPercentage: document.getElementById('progressPercentage'),
    completedCount: document.getElementById('completedCount'),
    totalCount: document.getElementById('totalCount'),
    
    // 編輯模態框
    editModal: document.getElementById('editModal'),
    editTaskInput: document.getElementById('editTaskInput'),
    editPrioritySelect: document.getElementById('editPrioritySelect'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    closeModal: document.getElementById('closeModal'),
    
    // 日期
    todayDate: document.getElementById('todayDate')
};

// ============================================================
// 4. 日期格式化函數
// ============================================================

/**
 * 格式化今天的日期
 * @returns {string} 格式化的日期字符串 (例如: 星期一, 2024 年 6 月 20 日)
 */
function formatTodayDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Taipei'
    };
    return today.toLocaleDateString('zh-TW', options);
}

// ============================================================
// 5. LocalStorage 操作
// ============================================================

/**
 * 從 LocalStorage 加載任務
 * @returns {Array} 任務數組
 */
function loadTasksFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('讀取 LocalStorage 失敗:', error);
        return [];
    }
}

/**
 * 保存任務到 LocalStorage
 * @param {Array} tasks - 要保存的任務數組
 */
function saveTasksToStorage(tasks) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('保存到 LocalStorage 失敗:', error);
        alert('無法保存任務，請檢查瀏覽器設定');
    }
}

// ============================================================
// 6. 任務操作函數
// ============================================================

/**
 * 添加新任務
 * @param {string} text - 任務文本
 * @param {string} priority - 優先級 (high/medium/low)
 */
function addTask(text, priority) {
    // 驗證輸入
    if (!text.trim()) {
        alert('請輸入任務內容');
        return;
    }

    // 創建新任務對象
    const newTask = {
        id: Date.now(), // 使用時間戳作為唯一 ID
        text: text.trim(),
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    };

    // 添加到狀態
    appState.tasks.push(newTask);
    
    // 保存到 LocalStorage
    saveTasksToStorage(appState.tasks);
    
    // 清空輸入框
    elements.taskInput.value = '';
    elements.prioritySelect.value = 'medium';
    
    // 重新渲染
    render();
    
    // 聚焦輸入框
    elements.taskInput.focus();
}

/**
 * 刪除任務
 * @param {number} taskId - 任務 ID
 */
function deleteTask(taskId) {
    // 查找任務
    const taskIndex = appState.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        appState.tasks.splice(taskIndex, 1);
        saveTasksToStorage(appState.tasks);
        render();
    }
}

/**
 * 切換任務完成狀態
 * @param {number} taskId - 任務 ID
 */
function toggleTaskCompletion(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage(appState.tasks);
        render();
    }
}

/**
 * 編輯任務
 * @param {number} taskId - 任務 ID
 * @param {string} newText - 新的任務文本
 * @param {string} newPriority - 新的優先級
 */
function editTask(taskId, newText, newPriority) {
    if (!newText.trim()) {
        alert('請輸入任務內容');
        return;
    }

    const task = appState.tasks.find(t => t.id === taskId);
    
    if (task) {
        task.text = newText.trim();
        task.priority = newPriority;
        saveTasksToStorage(appState.tasks);
        closeEditModal();
        render();
    }
}

// ============================================================
// 7. 進度更新函數
// ============================================================

/**
 * 計算並更新進度統計
 */
function updateProgress() {
    const totalTasks = appState.tasks.length;
    const completedTasks = appState.tasks.filter(task => task.completed).length;
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // 更新 DOM
    elements.progressPercentage.textContent = `${percentage}%`;
    elements.progressBar.style.width = `${percentage}%`;
    elements.completedCount.textContent = completedTasks;
    elements.totalCount.textContent = totalTasks;
}

// ============================================================
// 8. 渲染函數
// ============================================================

/**
 * 渲染待完成任務列表
 */
function renderPendingTasks() {
    const pendingTasks = appState.tasks.filter(task => !task.completed);

    if (pendingTasks.length === 0) {
        elements.tasksList.innerHTML = `
            <div class="empty-state">
                <p class="empty-message">✨ 還沒有任務，先放鬆一下吧！</p>
            </div>
        `;
        return;
    }

    elements.tasksList.innerHTML = pendingTasks
        .map(task => createTaskElement(task))
        .join('');

    // 添加事件監聽器
    attachTaskEventListeners();
}

/**
 * 渲染已完成任務列表
 */
function renderCompletedTasks() {
    const completedTasks = appState.tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        elements.completedList.innerHTML = `
            <div class="empty-state">
                <p class="empty-message">🎯 完成的任務會顯示在這裡</p>
            </div>
        `;
        return;
    }

    elements.completedList.innerHTML = completedTasks
        .map(task => createTaskElement(task))
        .join('');

    // 添加事件監聽器
    attachTaskEventListeners();
}

/**
 * 創建任務元素的 HTML
 * @param {Object} task - 任務對象
 * @returns {string} HTML 字符串
 */
function createTaskElement(task) {
    const priorityLabel = PRIORITY_LABELS[task.priority];
    
    return `
        <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                data-task-id="${task.id}"
                ${task.completed ? 'checked' : ''}
            >
            <div class="task-content">
                <p class="task-text">${escapeHtml(task.text)}</p>
                <p class="task-priority priority-${task.priority}">${priorityLabel}</p>
            </div>
            <div class="task-actions">
                <button class="task-btn task-btn-edit" data-edit-id="${task.id}">✏️ 編輯</button>
                <button class="task-btn task-btn-delete" data-delete-id="${task.id}">🗑️ 刪除</button>
            </div>
        </div>
    `;
}

/**
 * 轉義 HTML 特殊字符以防止 XSS 攻擊
 * @param {string} text - 要轉義的文本
 * @returns {string} 轉義後的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 主要渲染函數 - 更新整個 UI
 */
function render() {
    renderPendingTasks();
    renderCompletedTasks();
    updateProgress();
}

// ============================================================
// 9. 事件監聽器
// ============================================================

/**
 * 為任務元素附加事件監聽器
 */
function attachTaskEventListeners() {
    // 複選框事件
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            toggleTaskCompletion(taskId);
        });
    });

    // 編輯按鈕事件
    document.querySelectorAll('.task-btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.editId);
            openEditModal(taskId);
        });
    });

    // 刪除按鈕事件
    document.querySelectorAll('.task-btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.deleteId);
            if (confirm('確定要刪除這個任務嗎？')) {
                deleteTask(taskId);
            }
        });
    });
}

/**
 * 打開編輯模態框
 * @param {number} taskId - 要編輯的任務 ID
 */
function openEditModal(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    
    if (task) {
        appState.editingTaskId = taskId;
        elements.editTaskInput.value = task.text;
        elements.editPrioritySelect.value = task.priority;
        elements.editModal.classList.add('active');
        elements.editTaskInput.focus();
        elements.editTaskInput.select();
    }
}

/**
 * 關閉編輯模態框
 */
function closeEditModal() {
    elements.editModal.classList.remove('active');
    appState.editingTaskId = null;
    elements.editTaskInput.value = '';
}

// ============================================================
// 10. 初始化事件監聽器
// ============================================================

/**
 * 為表單和按鈕綁定事件
 */
function initializeEventListeners() {
    // 添加任務按鈕
    elements.addTaskBtn.addEventListener('click', () => {
        addTask(elements.taskInput.value, elements.prioritySelect.value);
    });

    // 回車鍵添加任務
    elements.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(elements.taskInput.value, elements.prioritySelect.value);
        }
    });

    // 編輯模態框 - 保存按鈕
    elements.saveEditBtn.addEventListener('click', () => {
        if (appState.editingTaskId !== null) {
            editTask(
                appState.editingTaskId,
                elements.editTaskInput.value,
                elements.editPrioritySelect.value
            );
        }
    });

    // 編輯模態框 - 取消按鈕
    elements.cancelEditBtn.addEventListener('click', closeEditModal);

    // 編輯模態框 - 關閉按鈕
    elements.closeModal.addEventListener('click', closeEditModal);

    // 模態框 - 點擊背景關閉
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) {
            closeEditModal();
        }
    });

    // 編輯模態框 - 回車鍵保存
    elements.editTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.saveEditBtn.click();
        }
    });

    // 編輯模態框 - Escape 鍵關閉
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.editModal.classList.contains('active')) {
            closeEditModal();
        }
    });
}

// ============================================================
// 11. 初始化應用程序
// ============================================================

/**
 * 初始化應用程序
 */
function initialize() {
    // 1. 設置今天的日期
    elements.todayDate.textContent = formatTodayDate();

    // 2. 從 LocalStorage 加載任務
    appState.tasks = loadTasksFromStorage();

    // 3. 初始化事件監聽器
    initializeEventListeners();

    // 4. 初始渲染
    render();

    // 5. 聚焦輸入框
    elements.taskInput.focus();

    // 調試模式 - 輸出狀態
    console.log('✅ 每日任務規劃應用程序已初始化');
    console.log('📋 已加載任務數:', appState.tasks.length);
}

// ============================================================
// 12. 應用程序啟動
// ============================================================

// 等待 DOM 加載完成後初始化應用程序
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
