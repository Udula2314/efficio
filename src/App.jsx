import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MessageCircle, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Sun, 
  Moon, 
  CheckCircle2,
  Circle,
  AlertTriangle,
  Brain,
  Send,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mock data
const mockTasks = [
  { id: 1, title: 'Review quarterly reports', category: 'Work', dueDate: '2025-06-18', status: 'pending', priority: 'high' },
  { id: 2, title: 'Team standup meeting', category: 'Meeting', dueDate: '2025-06-18', status: 'completed', priority: 'medium' },
  { id: 3, title: 'Update project documentation', category: 'Work', dueDate: '2025-06-19', status: 'inprogress', priority: 'low' },
  { id: 4, title: 'Client presentation prep', category: 'Work', dueDate: '2025-06-18', status: 'inprogress', priority: 'high' },
  { id: 5, title: 'Weekly team sync', category: 'Meeting', dueDate: '2025-06-19', status: 'pending', priority: 'medium' },
  { id: 6, title: 'Code review', category: 'Work', dueDate: '2025-06-18', status: 'pending', priority: 'low' },
];

const mockSchedule = [
  { id: 1, title: 'Morning Review', time: '09:00', duration: '30 min', type: 'focus' },
  { id: 2, title: 'Team Standup', time: '09:30', duration: '30 min', type: 'meeting' },
  { id: 3, title: 'Deep Work Block', time: '10:00', duration: '2 hours', type: 'focus' },
  { id: 4, title: 'Lunch Break', time: '12:00', duration: '1 hour', type: 'break' },
  { id: 5, title: 'Client Calls', time: '13:00', duration: '1.5 hours', type: 'meeting' },
  { id: 6, title: 'Admin Tasks', time: '14:30', duration: '1 hour', type: 'work' },
];

const mockChatHistory = [
  { id: 1, sender: 'ai', message: 'Good morning! You have 2 high-priority tasks today. Would you like me to help prioritize them?' },
  { id: 2, sender: 'user', message: 'Yes, please help me organize my day' },
  { id: 3, sender: 'ai', message: 'I recommend starting with the client presentation prep since it\'s due today, followed by reviewing the quarterly reports.' },
];

function AIAssistantDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState('😐');
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [tasks, setTasks] = useState(mockTasks);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'Work',
    dueDate: '',
    priority: 'medium'
  });

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1);
          setTimerSeconds(59);
        } else {
          setTimerActive(false);
        }
      }, 1000);
    } else if (!timerActive && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMinutes, timerSeconds]);

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const addNewTask = () => {
    if (newTask.title.trim()) {
      const task = {
        id: Date.now(),
        title: newTask.title,
        category: newTask.category,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        status: 'pending'
      };
      setTasks([...tasks, task]);
      setNewTask({ title: '', category: 'Work', dueDate: '', priority: 'medium' });
      setShowAddTaskModal(false);
    }
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerMinutes(25);
    setTimerSeconds(0);
  };

  const formatTime = (mins, secs) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWeekDays = () => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Daily Assistant
          </h1>
          <div className="flex items-center gap-4">
            {/* Mood Tracker */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Mood:</span>
              <div className="flex gap-1">
                {['😩', '😐', '🙂', '😊'].map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`text-xl p-1 rounded transition ${selectedMood === mood ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Column 1: Tasks */}
        <div className={`w-1/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tasks</h2>
              <button 
                onClick={() => setShowAddTaskModal(true)}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* AI Summary Box */}
            <div className={`${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="text-blue-500" size={20} />
                <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>AI Summary</span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                You have 2 high-priority tasks due today and 1 meeting. Recommended focus time: 2-4 PM.
              </p>
            </div>

            {/* Task Categories */}
            <div className="space-y-6">
              {/* Pending Tasks */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pending</h3>
                <div className="space-y-2">
                  {tasks
                    .filter(task => task.status === 'pending')
                    .map(task => (
                      <div key={task.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                {task.category}
                              </span>
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {task.dueDate}
                              </span>
                              {task.priority === 'high' && (
                                <AlertTriangle className="text-red-500" size={14} />
                              )}
                            </div>
                          </div>
                          <div className="ml-3">
                            <button
                              onClick={() => updateTaskStatus(task.id, 'inprogress')}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* In Progress Tasks */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</h3>
                <div className="space-y-2">
                  {tasks
                    .filter(task => task.status === 'inprogress')
                    .map(task => (
                      <div key={task.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                {task.category}
                              </span>
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {task.dueDate}
                              </span>
                              {task.priority === 'high' && (
                                <AlertTriangle className="text-red-500" size={14} />
                              )}
                            </div>
                          </div>
                          <div className="ml-3 flex gap-2">
                            <button
                              onClick={() => updateTaskStatus(task.id, 'pending')}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Completed Tasks */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed</h3>
                <div className="space-y-2">
                  {tasks
                    .filter(task => task.status === 'completed')
                    .map(task => (
                      <div key={task.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 opacity-60`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <CheckCircle2 className="text-green-500 mt-1" size={20} />
                            <div className="flex-1">
                              <h4 className={`font-medium line-through ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                  {task.category}
                                </span>
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {task.dueDate}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-3">
                            <button
                              onClick={() => updateTaskStatus(task.id, 'inprogress')}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 transition"
                            >
                              Reopen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Today's Schedule */}
        <div className={`w-1/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today's Schedule</h2>
              <Calendar className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
            </div>

            {/* Weekly Calendar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>This Week</h3>
                <div className="flex items-center gap-2">
                  <button className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={16} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                  <button className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <ChevronRight size={16} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getWeekDays().map((day, index) => (
                  <div key={index} className={`text-center p-2 rounded cursor-pointer transition ${
                    day.toDateString() === currentDate.toDateString() 
                      ? 'bg-blue-500 text-white' 
                      : `${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`
                  }`}>
                    <div className="text-xs font-medium">
                      {day.toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="text-sm mt-1">
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Blocking Plan */}
            <div className="space-y-3">
              <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Time Blocks</h3>
              {mockSchedule.map(block => (
                <div key={block.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{block.title}</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{block.duration}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {block.time}
                      </span>
                      <div className={`w-3 h-3 rounded-full mt-1 ml-auto ${
                        block.type === 'focus' ? 'bg-green-500' :
                        block.type === 'meeting' ? 'bg-blue-500' :
                        block.type === 'break' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Tools & Controls */}
        <div className={`w-1/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-y-auto`}>
          <div className="p-6 space-y-6">
            {/* Focus Timer */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Focus Timer</h3>
              <div className="text-center">
                <div className={`text-3xl font-mono font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatTime(timerMinutes, timerSeconds)}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    {timerActive ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className={`${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} p-2 rounded-lg transition`}
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowAddTaskModal(true)}
                  className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition text-left"
                >
                  <Plus size={16} className="inline mr-2" />
                  Add Task
                </button>
                <button className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition text-left">
                  <Brain size={16} className="inline mr-2" />
                  Summarize My Day
                </button>
                <button className="w-full bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 transition text-left">
                  <Clock size={16} className="inline mr-2" />
                  Start Focus Session
                </button>
              </div>
            </div>

            {/* Deadlines & Alerts */}
            <div className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
              <h3 className={`font-medium mb-3 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                <AlertTriangle size={16} className="inline mr-2" />
                Urgent Items
              </h3>
              <div className="space-y-2">
                <div className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                  • Client presentation due today
                </div>
                <div className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                  • Meeting conflicts at 2 PM
                </div>
              </div>
            </div>

            {/* Recurring Task Suggestions */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Suggested Tasks</h3>
              <div className="space-y-2">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex justify-between items-center`}>
                  <span>Weekly team check-in</span>
                  <button className="text-blue-500 text-xs">Add</button>
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex justify-between items-center`}>
                  <span>Update project status</span>
                  <button className="text-blue-500 text-xs">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setChatOpen(false)} />
          <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} w-96 h-[500px] m-6 rounded-lg shadow-xl flex flex-col`}>
            {/* Chat Header */}
            <div className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b p-4 flex justify-between items-center`}>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Assistant</h3>
              <button
                onClick={() => setChatOpen(false)}
                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
              >
                <X size={20} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockChatHistory.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : `${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t p-4`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-1 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddTaskModal(false)} />
          <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} w-96 rounded-lg shadow-xl p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New Task</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
              >
                <X size={20} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task Name *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task name..."
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Category */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Priority */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Priority
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Low', color: 'bg-green-500' },
                    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                    { value: 'high', label: 'High', color: 'bg-red-500' }
                  ].map(priority => (
                    <button
                      key={priority.value}
                      onClick={() => setNewTask({ ...newTask, priority: priority.value })}
                      className={`flex-1 p-2 rounded-lg text-white text-sm font-medium transition ${
                        newTask.priority === priority.value 
                          ? priority.color 
                          : `${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition`}
              >
                Cancel
              </button>
              <button
                onClick={addNewTask}
                disabled={!newTask.title.trim()}
                className={`px-4 py-2 rounded-lg transition ${
                  newTask.title.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAssistantDashboard;