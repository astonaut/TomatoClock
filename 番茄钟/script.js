// DOM 元素
const timerElement = document.getElementById('timer');
const timerCircle = document.getElementById('timer-circle');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const pomodoroButton = document.getElementById('pomodoro-btn');
const shortBreakButton = document.getElementById('short-break-btn');
const longBreakButton = document.getElementById('long-break-btn');
const workTimeInput = document.getElementById('work-time');
const shortBreakTimeInput = document.getElementById('short-break-time');
const longBreakTimeInput = document.getElementById('long-break-time');
const alarmSound = document.getElementById('alarm-sound');
const appElement = document.getElementById('app');

// 番茄钟状态
let timerMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'
let timerSeconds = 25 * 60;
let initialTimerSeconds = 25 * 60;
let isTimerRunning = false;
let timerInterval = null;
let completedPomodoros = 0;

// 从本地存储加载设置
loadSettings();

// 初始化UI
updateTimerDisplay();
updateModeUI();
updateTimerCircle();

// 事件监听器
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
pomodoroButton.addEventListener('click', () => changeMode('pomodoro'));
shortBreakButton.addEventListener('click', () => changeMode('shortBreak'));
longBreakButton.addEventListener('click', () => changeMode('longBreak'));

// 保存设置变更
workTimeInput.addEventListener('change', saveSettings);
shortBreakTimeInput.addEventListener('change', saveSettings);
longBreakTimeInput.addEventListener('change', saveSettings);

// 更新定时器显示
function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const seconds = (timerSeconds % 60).toString().padStart(2, '0');
  timerElement.textContent = `${minutes}:${seconds}`;
  
  // 设置文档标题
  document.title = `${minutes}:${seconds} - 番茄钟`;
}

// 更新定时器圆圈
function updateTimerCircle() {
  const progress = timerSeconds / initialTimerSeconds;
  const degrees = 360 - (progress * 360);
  
  // 创建SVG圆环进度条
  if (!document.querySelector('.progress-ring')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'progress-ring');
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'progress-ring__circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '45');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke-width', '5');
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('transform', 'rotate(-90 50 50)');
    
    svg.appendChild(circle);
    timerCircle.appendChild(svg);
  }
  
  const circle = document.querySelector('.progress-ring__circle');
  const strokeColor = getStrokeColor();
  circle.setAttribute('stroke', strokeColor);
  
  // 计算周长
  const radius = circle.getAttribute('r');
  const circumference = 2 * Math.PI * radius;
  
  // 设置周长和偏移
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
}

// 获取圆环颜色
function getStrokeColor() {
  switch (timerMode) {
    case 'pomodoro':
      return 'var(--color-pomodoro)';
    case 'shortBreak':
      return 'var(--color-short-break)';
    case 'longBreak':
      return 'var(--color-long-break)';
    default:
      return 'var(--color-pomodoro)';
  }
}

// 更新模式UI
function updateModeUI() {
  // 移除所有模式类
  appElement.classList.remove('mode-pomodoro', 'mode-short-break', 'mode-long-break');
  
  // 添加当前模式类
  appElement.classList.add(`mode-${timerMode}`);
  
  // 更新按钮选中状态
  [pomodoroButton, shortBreakButton, longBreakButton].forEach(btn => {
    btn.classList.remove('bg-red-100', 'bg-blue-100', 'bg-indigo-100');
    btn.classList.add('bg-white');
    btn.classList.remove('border-red-500', 'border-blue-500', 'border-indigo-500');
    btn.classList.add('border-gray-300');
  });
  
  switch (timerMode) {
    case 'pomodoro':
      pomodoroButton.classList.remove('bg-white', 'border-gray-300');
      pomodoroButton.classList.add('bg-red-100', 'border-red-500');
      break;
    case 'shortBreak':
      shortBreakButton.classList.remove('bg-white', 'border-gray-300');
      shortBreakButton.classList.add('bg-blue-100', 'border-blue-500');
      break;
    case 'longBreak':
      longBreakButton.classList.remove('bg-white', 'border-gray-300');
      longBreakButton.classList.add('bg-indigo-100', 'border-indigo-500');
      break;
  }
}

// 改变模式
function changeMode(mode) {
  // 如果定时器正在运行，先暂停
  if (isTimerRunning) {
    pauseTimer();
  }
  
  timerMode = mode;
  
  // 设置相应的时间
  switch (mode) {
    case 'pomodoro':
      timerSeconds = workTimeInput.value * 60;
      break;
    case 'shortBreak':
      timerSeconds = shortBreakTimeInput.value * 60;
      break;
    case 'longBreak':
      timerSeconds = longBreakTimeInput.value * 60;
      break;
  }
  
  initialTimerSeconds = timerSeconds;
  
  // 更新UI
  updateTimerDisplay();
  updateModeUI();
  updateTimerCircle();
}

// 开始定时器
function startTimer() {
  if (isTimerRunning) return;
  
  isTimerRunning = true;
  timerCircle.classList.add('timer-active');
  
  // 更新按钮状态
  startButton.disabled = true;
  pauseButton.disabled = false;
  resetButton.disabled = false;
  
  // 禁用输入框
  workTimeInput.disabled = true;
  shortBreakTimeInput.disabled = true;
  longBreakTimeInput.disabled = true;
  
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    updateTimerCircle();
    
    if (timerSeconds <= 0) {
      playAlarm();
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerCircle.classList.remove('timer-active');
      
      // 更新按钮状态
      startButton.disabled = false;
      pauseButton.disabled = true;
      resetButton.disabled = false;
      
      // 启用输入框
      workTimeInput.disabled = false;
      shortBreakTimeInput.disabled = false;
      longBreakTimeInput.disabled = false;
      
      // 如果是番茄工作周期结束
      if (timerMode === 'pomodoro') {
        completedPomodoros++;
        
        // 每4个番茄钟后进入长休息
        if (completedPomodoros % 4 === 0) {
          showNotification('番茄周期完成', '是时候长休息一下了！');
          changeMode('longBreak');
        } else {
          showNotification('番茄周期完成', '是时候短休息一下了！');
          changeMode('shortBreak');
        }
      } else {
        // 如果是休息周期结束
        showNotification('休息结束', '是时候开始工作了！');
        changeMode('pomodoro');
      }
      
      // 保存统计数据
      saveStats();
    }
  }, 1000);
}

// 暂停定时器
function pauseTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerCircle.classList.remove('timer-active');
  
  // 更新按钮状态
  startButton.disabled = false;
  pauseButton.disabled = true;
  resetButton.disabled = false;
  
  // 启用输入框
  workTimeInput.disabled = false;
  shortBreakTimeInput.disabled = false;
  longBreakTimeInput.disabled = false;
}

// 重置定时器
function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerCircle.classList.remove('timer-active');
  
  // 根据当前模式设置时间
  switch (timerMode) {
    case 'pomodoro':
      timerSeconds = workTimeInput.value * 60;
      break;
    case 'shortBreak':
      timerSeconds = shortBreakTimeInput.value * 60;
      break;
    case 'longBreak':
      timerSeconds = longBreakTimeInput.value * 60;
      break;
  }
  
  initialTimerSeconds = timerSeconds;
  
  // 更新UI
  updateTimerDisplay();
  updateTimerCircle();
  
  // 更新按钮状态
  startButton.disabled = false;
  pauseButton.disabled = true;
  resetButton.disabled = false;
  
  // 启用输入框
  workTimeInput.disabled = false;
  shortBreakTimeInput.disabled = false;
  longBreakTimeInput.disabled = false;
}

// 播放闹钟声音
function playAlarm() {
  alarmSound.play();
}

// 显示通知
function showNotification(title, body) {
  // 检查是否支持通知
  if (!("Notification" in window)) {
    console.log("此浏览器不支持通知");
    return;
  }
  
  // 如果已经有权限
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
  // 否则请求权限
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}

// 保存设置到本地存储
function saveSettings() {
  const settings = {
    workTime: parseInt(workTimeInput.value),
    shortBreakTime: parseInt(shortBreakTimeInput.value),
    longBreakTime: parseInt(longBreakTimeInput.value)
  };
  
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  
  // 如果当前不在计时中，更新时间
  if (!isTimerRunning) {
    changeMode(timerMode);
  }
}

// 从本地存储加载设置
function loadSettings() {
  const savedSettings = localStorage.getItem('pomodoroSettings');
  
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    workTimeInput.value = settings.workTime || 25;
    shortBreakTimeInput.value = settings.shortBreakTime || 5;
    longBreakTimeInput.value = settings.longBreakTime || 15;
  }
}

// 保存统计数据
function saveStats() {
  let stats = JSON.parse(localStorage.getItem('pomodoroStats') || '{}');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
  
  // 如果没有今天的数据，初始化
  if (!stats[today]) {
    stats[today] = { completed: 0 };
  }
  
  // 如果是番茄钟完成，增加今天的计数
  if (timerMode === 'pomodoro') {
    stats[today].completed += 1;
  }
  
  localStorage.setItem('pomodoroStats', JSON.stringify(stats));
} 