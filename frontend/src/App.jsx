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
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Dialog as HeadlessDialog } from "@headlessui/react";
import db from "@/lib/db";


const mockChatHistory = [
  { id: 1, sender: 'ai', message: 'Good morning! You have 2 high-priority tasks today. Would you like me to help prioritize them?' },
  { id: 2, sender: 'user', message: 'Yes, please help me organize my day' },
  { id: 3, sender: 'ai', message: 'I recommend starting with the client presentation prep since it\'s due today, followed by reviewing the quarterly reports.' },
];

// Add color mapping for block types
const blockTypeColors = {
  focus: { bg: 'bg-green-500', label: 'Focus', text: 'text-green-700', dot: 'bg-green-500' },
  meeting: { bg: 'bg-blue-500', label: 'Meeting', text: 'text-blue-700', dot: 'bg-blue-500' },
  break: { bg: 'bg-yellow-500', label: 'Break', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  work: { bg: 'bg-purple-500', label: 'Work', text: 'text-purple-700', dot: 'bg-purple-500' },
  other: { bg: 'bg-gray-400', label: 'Other', text: 'text-gray-700', dot: 'bg-gray-400' },
};

function AIAssistantDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Add a separate today state
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState('😐');
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false); // <-- Add loading state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'Work',
    dueDate: '',
    priority: 'medium',
    status: 'pending'
  });
  const [habits, setHabits] = useState([]);
  const [habitChecked, setHabitChecked] = useState({}); // { habitId: true/false }
  const [habitLocked, setHabitLocked] = useState({}); // { habitId: true/false }
  const [habitSubmitting, setHabitSubmitting] = useState(false);
  // Time block state for hybrid approach
  const [schedule, setSchedule] = useState(() => {
    const stored = localStorage.getItem('schedule');
    return stored ? JSON.parse(stored) : [];
  });
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [editBlockId, setEditBlockId] = useState(null);
  const [newBlock, setNewBlock] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    duration: '',
    type: 'focus',
    completed: false,
    tasks: [],
    synced: false,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Add a state for sync status indicator
  const [hasUnsyncedTasks, setHasUnsyncedTasks] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState([]);

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


  // Persist schedule
  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [schedule]);

  // Monitor Dexie for unsynced tasks
  useEffect(() => {
    const checkUnsynced = async () => {
      const pending = await db.tasks.where('syncStatus').anyOf('pending', 'error').count();
      setHasUnsyncedTasks(pending > 0);
    };
    checkUnsynced();
    // Optionally, poll every few seconds or listen to Dexie hooks for more reactivity
    const interval = setInterval(checkUnsynced, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadTasksFromDexie = async () => {
    const localTasks = await db.tasks.toArray();
    setTasks(localTasks);
  };

  useEffect(() => {
    loadTasksFromDexie();
    fetchTasks(); // fetch from backend/Notion and update Dexie
  }, []);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch('http://localhost:5050/api/notion/tasks');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Save to Dexie
      await db.tasks.clear();
      await db.tasks.bulkAdd(
        data.map(task => ({
          ...task,
          notionId: task.id,
          updatedAt: Date.now(),
          syncStatus: 'synced'
        }))
      );
      // Load from Dexie to update UI
      loadTasksFromDexie();
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    // Find the task in Dexie
    const task = await db.tasks.get(taskId);
    if (!task) return;

    // 1. Update Dexie immediately for offline UX
    await db.tasks.update(taskId, {
      status: newStatus,
      syncStatus: 'pending', // always pending until confirmed
      updatedAt: Date.now()
    });
    loadTasksFromDexie();

    // 2. If online, try to sync to backend/Notion
    if (navigator.onLine && task.notionId) {
      try {
        const response = await fetch(`http://localhost:5050/api/notion/tasks/${task.notionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Mark as synced in Dexie
        await db.tasks.update(taskId, { syncStatus: 'synced', updatedAt: Date.now() });
        loadTasksFromDexie();
      } catch (error) {
        // Mark as error in Dexie
        await db.tasks.update(taskId, { syncStatus: 'error' });
        loadTasksFromDexie();
        alert('Failed to sync status with Notion: ' + error.message);
      }
    }
    // If offline, the syncPendingTasks effect will handle syncing when back online
  };

  const addNewTask = async () => {
    if (newTask.title.trim()) {
      // 1. Add to Dexie
      const localId = await db.tasks.add({
        ...newTask,
        updatedAt: Date.now(),
        syncStatus: 'pending'
      });
      // 2. Update UI
      loadTasksFromDexie();
      setNewTask({ title: '', category: 'Work', dueDate: '', priority: 'medium', status: 'pending' });
      setShowAddTaskModal(false);

      // 3. Try to sync with backend if online
      if (navigator.onLine) {
        try {
          const response = await fetch('http://localhost:5050/api/notion/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          if (data.error) throw new Error(data.error);

          // Remove the local-only record and add a new one with the Notion id
          const localTask = await db.tasks.get(localId);
          await db.tasks.delete(localId);
          await db.tasks.add({
            ...localTask,
            id: undefined, // Let Dexie assign a new id
            notionId: data.id,
            syncStatus: 'synced',
            updatedAt: Date.now()
          });
          loadTasksFromDexie();
        } catch (error) {
          // Mark as error in Dexie
          await db.tasks.update(localId, { syncStatus: 'error' });
          loadTasksFromDexie();
          alert('Failed to sync with Notion: ' + error.message);
        }
      }
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

  // Helper: always center the week on today
  const getCenteredWeek = (centerDate) => {
    const week = [];
    const centerIdx = 3; // 0-based, so 3 is the 4th day (center)
    const base = new Date(centerDate);
    base.setHours(0,0,0,0);
    for (let i = -centerIdx; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      week.push(d);
    }
    return week;
  };

  // Always center week on today, not selectedDate
  const weekDays = getCenteredWeek(today);
  const weekBlocks = weekDays.map(day => ({
    date: day.toISOString().slice(0, 10),
    blocks: schedule.filter(block => block.date === day.toISOString().slice(0, 10)),
    day,
  }));

  // Show blocks for selectedDate
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const selectedDayBlocks = schedule.filter(block => block.date === selectedDateStr);

  const toggleHabit = (id) => {
    if (habitLocked[id]) return;
    setHabitChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const submitHabits = async () => {
    setHabitSubmitting(true);
    const toSubmit = Object.entries(habitChecked).filter(([id, checked]) => checked && !habitLocked[id]);
    try {
      await Promise.all(toSubmit.map(async ([id]) => {
        await fetch(`http://localhost:5050/api/notion/habits/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doNow: true })
        });
      }));
      // Lock submitted habits
      setHabitLocked(prev => {
        const updated = { ...prev };
        toSubmit.forEach(([id]) => { updated[id] = true; });
        return updated;
      });
    } catch (error) {
      alert('Failed to submit habits: ' + error.message);
    }
    setHabitSubmitting(false);
  };

  // Add or update time block
  const saveTimeBlock = async () => {
    if (!newBlock.title.trim() || !newBlock.time || !newBlock.duration) return;

    // If editing, update local state only (as before)
    if (editBlockId) {
      setSchedule(schedule.map(block =>
        block.id === editBlockId ? { ...newBlock, id: editBlockId } : block
      ));
    } else {
      setSchedule([...schedule, { ...newBlock, id: Date.now() }]);
    }
    setShowAddBlockModal(false);
    setEditBlockId(null);
    setNewBlock({
      title: '',
      date: currentDate.toISOString().slice(0, 10),
      time: '',
      duration: '',
      type: 'focus',
      completed: false,
      tasks: [],
      synced: false,
    });

    // --- THIS IS THE CRITICAL PART ---
    // Send the new time block to the backend/Notion
    try {
      await fetch('http://localhost:5050/api/notion/timeblocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBlock.title,
          date: newBlock.date,
          time: newBlock.time,
          duration: newBlock.duration,
          type: newBlock.type,
          tasks: newBlock.tasks,
        }),
      });
      // Optionally, handle response or update UI
    } catch (error) {
      alert('Failed to save time block to Notion: ' + error.message);
    }
  };

  // Edit block
  const handleEditBlock = (block) => {
    setEditBlockId(block.id);
    setNewBlock({ ...block });
    setShowAddBlockModal(true);
  };

  // Delete block
  const handleDeleteBlock = (id) => {
    setSchedule(schedule.filter(block => block.id !== id));
  };

  // Mark as completed
  const toggleBlockCompleted = (id) => {
    setSchedule(schedule.map(block =>
      block.id === id ? { ...block, completed: !block.completed } : block
    ));
  };

  // Assign/unassign tasks to a block
  const toggleTaskAssignment = (taskId) => {
    setNewBlock(prev => ({
      ...prev,
      tasks: prev.tasks.includes(taskId)
        ? prev.tasks.filter(id => id !== taskId)
        : [...prev.tasks, taskId]
    }));
  };

  
  useEffect(() => {
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0) - now;
    const timer = setTimeout(() => {
      if (Object.entries(habitChecked).some(([id, checked]) => checked && !habitLocked[id])) {
        submitHabits();
      }
    }, msToMidnight);
    return () => clearTimeout(timer);
  }, [habitChecked, habitLocked]);
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/notion/habits');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setHabits(data);
        // Initialize checked/locked state
        const checked = {};
        const locked = {};
        data.forEach(h => {
          checked[h.id] = false;
          locked[h.id] = false;
        });
        setHabitChecked(checked);
        setHabitLocked(locked);
      } catch (error) {
        console.error('Failed to fetch habits:', error);
      }
    };
    fetchHabits();
  }, []);

  useEffect(() => {
    const syncPendingTasks = async () => {
      const pendingTasks = await db.tasks.where('syncStatus').equals('pending').toArray();
      for (const task of pendingTasks) {
        try {
          const response = await fetch('http://localhost:5050/api/notion/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          if (data.error) throw new Error(data.error);

          // Remove the local-only record and add a new one with the Notion id
          const localTask = await db.tasks.get(task.id);
          await db.tasks.delete(task.id);
          await db.tasks.add({
            ...localTask,
            id: undefined, // Let Dexie assign a new id
            notionId: data.id,
            syncStatus: 'synced',
            updatedAt: Date.now()
          });
          loadTasksFromDexie();
        } catch (error) {
          await db.tasks.update(task.id, { syncStatus: 'error' });
        }
      }
      loadTasksFromDexie();
    };

    window.addEventListener('online', syncPendingTasks);
    // Optionally, call on mount
    if (navigator.onLine) syncPendingTasks();

    return () => window.removeEventListener('online', syncPendingTasks);
  }, []);

  // Fetch archived tasks from backend and store in Dexie
  const fetchArchivedTasks = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/notion/archive-tasks');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await db.archivedTasks.clear();
      await db.archivedTasks.bulkAdd(
        data.map(task => ({
          ...task,
          notionId: task.id,
          updatedAt: Date.now(),
          syncStatus: 'synced'
        }))
      );
      loadArchivedTasksFromDexie();
    } catch (error) {
      console.error('Failed to fetch archived tasks:', error);
    }
  };

  // Load archived tasks from Dexie
  const loadArchivedTasksFromDexie = async () => {
    const localArchived = await db.archivedTasks.toArray();
    setArchivedTasks(localArchived);
  };

  // Move a task to archive (Dexie and Notion)
  const archiveTask = async (task) => {
    // 1. Remove from tasks in Dexie
    await db.tasks.delete(task.id);
    // 2. Add to archivedTasks in Dexie (pending sync)
    const archivedId = await db.archivedTasks.add({
      ...task,
      id: undefined,
      syncStatus: 'pending',
      updatedAt: Date.now(),
      status: 'completed',
    });
    loadTasksFromDexie();
    loadArchivedTasksFromDexie();
    // 3. Sync to Notion archive DB if online
    if (navigator.onLine) {
      try {
        const response = await fetch('http://localhost:5050/api/notion/archive-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        // Update Dexie with notionId and mark as synced
        await db.archivedTasks.update(archivedId, {
          notionId: data.id,
          syncStatus: 'synced',
          updatedAt: Date.now()
        });
        loadArchivedTasksFromDexie();
        // 4. Delete from main Notion DB if it has a notionId
        if (task.notionId) {
          try {
            const delRes = await fetch(`http://localhost:5050/api/notion/tasks/${task.notionId}`, {
              method: 'DELETE'
            });
            if (!delRes.ok) throw new Error(`HTTP error! status: ${delRes.status}`);
            // Optionally check response
          } catch (err) {
            alert('Failed to delete task from main Notion DB: ' + err.message);
          }
        }
      } catch (error) {
        await db.archivedTasks.update(archivedId, { syncStatus: 'error' });
        loadArchivedTasksFromDexie();
        alert('Failed to sync archived task with Notion: ' + error.message);
      }
    }
  };

  // Auto-archive old completed tasks on app load
  useEffect(() => {
    const autoArchiveOldTasks = async () => {
      const allTasks = await db.tasks.toArray();
      const now = new Date();
      for (const task of allTasks) {
        if (task.status === 'completed' && task.dueDate) {
          const due = new Date(task.dueDate);
          if ((now - due) / (1000 * 60 * 60 * 24) > 5) {
            await archiveTask(task);
          }
        }
      }
    };
    autoArchiveOldTasks();
    fetchArchivedTasks();
  }, []);


  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            EffiCio
          </h1>
          {/* Quick Actions moved here */}
          <div className="flex gap-2 mx-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-1 btn btn-primary"
                  onClick={() => setShowAddTaskModal(true)}
                >
                  <Plus size={16} /> Add Task
                </Button>
              </DialogTrigger>
            </Dialog>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-1">
              <Brain size={16} /> Summarize My Day
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-1">
              <Clock size={16} /> Start Focus Session
            </button>
          </div>
          {/* Sync Status Indicator */}
          <div className="flex items-center gap-4">
            {(isOffline || hasUnsyncedTasks) && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: isOffline ? '#fbbf24' : hasUnsyncedTasks ? '#f87171' : '#34d399', color: isOffline || hasUnsyncedTasks ? '#fff' : '#065f46' }}
                title={isOffline ? 'Offline: changes will sync when online' : 'Unsynced changes: syncing soon'}
              >
                <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: isOffline ? '#f59e42' : '#ef4444' }}></span>
                {isOffline ? 'Offline' : 'Unsynced changes'}
              </div>
            )}
            {/* Past Button */}
            <button
              onClick={() => { setShowArchivedModal(true); fetchArchivedTasks(); }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition flex items-center gap-1"
              style={{ fontSize: '0.95rem' }}
            >
              Past
            </button>
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
              <div className="flex gap-2">
                <button
                  onClick={fetchTasks}
                  className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-1"
                  title="Refresh tasks"
                >
                  <RotateCcw size={16} />
                </button>
                {/* Use the same Add Task DialogTrigger as in the header */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-1 btn btn-primary"
                      onClick={() => setShowAddTaskModal(true)}
                    >
                      <Plus size={16} /> Add Task
                    </Button>
                  </DialogTrigger>
                  
                </Dialog>
              </div>
            </div>

            {/* Loading Spinner */}
            {loadingTasks && (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
            )}

            {/* Only show tasks UI if not loading */}
            {!loadingTasks && (
              <>
                {/* AI Summary Box */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="text-blue-500" size={20} />
                      <span className={darkMode ? 'text-blue-300' : 'text-blue-700'}>AI Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                      You have 2 high-priority tasks due today and 1 meeting. Recommended focus time: 2-4 PM.
                    </p>
                  </CardContent>
                </Card>

                {/* Task Categories */}
                <div className="space-y-6">
                  {/* Pending Tasks */}
                  <div>
                    <h3 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pending</h3>
                    <div className="space-y-2">
                      {tasks
                        .filter(task => task.status === 'pending')
                        .map(task => (
                          <Card key={task.id} className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="badge badge-outline">{task.category}</span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {task.dueDate}
                                    </span>
                                    {task.priority === 'high' && (
                                      <AlertTriangle className="text-red-500" size={14} />
                                    )}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <Button
                                    onClick={() => updateTaskStatus(task.id, 'inprogress')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white btn btn-primary btn-sm"
                                  >
                                    Start
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
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
                          <Card key={task.id} className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="badge badge-outline">{task.category}</span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {task.dueDate}
                                    </span>
                                    {task.priority === 'high' && (
                                      <AlertTriangle className="text-red-500" size={14} />
                                    )}
                                  </div>
                                </div>
                                <div className="ml-3 flex gap-2">
                                  <Button
                                    onClick={() => updateTaskStatus(task.id, 'pending')}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-white btn btn-warning btn-sm"
                                  >
                                    Pause
                                  </Button>
                                  <Button
                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                    className="bg-green-500 hover:bg-green-600 text-white btn btn-success btn-sm"
                                  >
                                    Complete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
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
                          <Card key={task.id} className={darkMode ? 'bg-gray-700 opacity-60' : 'bg-gray-50 opacity-60'}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <CheckCircle2 className="text-green-500 mt-1" size={20} />
                                  <div className="flex-1">
                                    <h4 className={`font-medium line-through ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {task.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="badge badge-outline">{task.category}</span>
                                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {task.dueDate}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <Button
                                    onClick={() => updateTaskStatus(task.id, 'inprogress')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white btn btn-warning btn-sm"
                                  >
                                    Reopen
                                  </Button>
                                  <Button
                                    onClick={() => archiveTask(task)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white btn btn-secondary btn-sm ml-2"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Column 2: Today's Schedule */}
        <div className={`w-1/3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedDate.toDateString() === today.toDateString()
                  ? "Today's Schedule"
                  : `${selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} Schedule`}
              </h2>
              {/* Calendar button to pick any date */}
              <div className="relative">
                <Calendar
                  className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-pointer`}
                  size={20}
                  onClick={() => document.getElementById('date-picker').showPicker()}
                />
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDateStr}
                  onChange={e => setSelectedDate(new Date(e.target.value))}
                  className="absolute top-0 left-0 opacity-0 w-6 h-6 cursor-pointer"
                  style={{ zIndex: 2 }}
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Weekly Calendar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>This Week</h3>
                <div className="flex items-center gap-2">
                  {/* Optionally, allow jumping weeks, but week is always centered on today */}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekBlocks.map(({ date, blocks, day }, index) => {
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  const isToday = day.toDateString() === today.toDateString();
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`text-center p-2 rounded cursor-pointer transition relative
                        ${isSelected ? 'bg-blue-500 text-white' :
                          isToday ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') :
                          (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')}
                      `}
                    >
                      <div className="text-xs font-medium">
                        {day.toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className="text-sm mt-1">{day.getDate()}</div>
                      {/* Show a dot for each block type */}
                      <div className="flex justify-center gap-1 mt-1">
                        {blocks.map(block => (
                          <span
                            key={block.id}
                            className={`w-2 h-2 rounded-full ${blockTypeColors[block.type]?.dot || 'bg-gray-400'}`}
                            title={block.title}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Blocking Plan for selected day */}
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Time Blocks</h3>
                <button
                  onClick={() => {
                    setShowAddBlockModal(true);
                    setEditBlockId(null);
                    setNewBlock({
                      title: '',
                      date: selectedDateStr,
                      time: '',
                      duration: '',
                      type: 'focus',
                      completed: false,
                      tasks: [],
                      synced: false,
                    });
                  }}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition"
                >
                  <Plus size={16} className="inline" /> Add
                </button>
              </div>
              {selectedDayBlocks.length === 0 && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No time blocks for this day.</div>
              )}
              {selectedDayBlocks.map(block => (
                <div
                  key={block.id}
                  className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-2 relative`}
                >
                  {/* Block type color bar and label */}
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
                    style={{ backgroundColor: blockTypeColors[block.type]?.bg.replace('bg-', '#') || '#a0aec0' }}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${blockTypeColors[block.type]?.bg || 'bg-gray-400'} ${darkMode ? 'text-white' : 'text-white'}`}>
                      {blockTypeColors[block.type]?.label || 'Other'}
                    </span>
                    {block.completed && (
                      <CheckCircle2 className="text-green-500" size={16} title="Completed" />
                    )}
                    {!block.synced && (
                      <span className="text-xs text-yellow-500 ml-2" title="Not synced">• Not Synced</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{block.title}</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{block.duration}</p>
                      {/* Assigned tasks */}
                      {block.tasks && block.tasks.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs font-semibold">Tasks:</span>
                          <ul className="ml-2 list-disc text-xs">
                            {block.tasks.map(taskId => {
                              const task = tasks.find(t => t.id === taskId);
                              return task ? <li key={taskId}>{task.title}</li> : null;
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {block.time}
                      </span>
                      <div className={`w-3 h-3 rounded-full mt-1 ml-auto ${blockTypeColors[block.type]?.dot || 'bg-gray-400'}`} />
                    </div>
                  </div>
                  {/* Block actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => toggleBlockCompleted(block.id)}
                      className={`px-2 py-1 rounded text-xs ${block.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                    >
                      {block.completed ? 'Undo' : 'Done'}
                    </button>
                    <button
                      onClick={() => handleEditBlock(block)}
                      className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
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

            {/* Daily Tracker - beautified and with add option, moved before Suggested Tasks */}
            <div className={`${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-4`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className={`font-medium ${darkMode ? 'text-green-200' : 'text-green-700'}`}>Daily Tracker</h3>
    </div>
    <div className="space-y-2">
      {habits.length === 0 && (
        <div className={`text-sm ${darkMode ? 'text-green-200' : 'text-green-700'}`}>No habits found in Notion.</div>
      )}
      {habits.map(habit => (
        <label key={habit.id} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition ${habitChecked[habit.id] || habitLocked[habit.id] ? 'bg-green-100 dark:bg-green-800' : ''}`}>
          <input
            type="checkbox"
            checked={habitChecked[habit.id] || false}
            disabled={habitLocked[habit.id]}
            onChange={() => toggleHabit(habit.id)}
            className="form-checkbox h-5 w-5 text-green-500"
          />
          <span className={`font-medium text-base ${darkMode ? (habitChecked[habit.id] || habitLocked[habit.id] ? 'text-green-300 line-through' : 'text-green-100') : (habitChecked[habit.id] || habitLocked[habit.id] ? 'text-green-700 line-through' : 'text-green-900')}`}>{habit.habit}</span>
          {habit.description && (
            <span className={`ml-2 text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{habit.description}</span>
          )}
        </label>
      ))}
    </div>
    <div className="flex justify-end mt-4">
      <button
        onClick={submitHabits}
        disabled={habitSubmitting || !Object.entries(habitChecked).some(([id, checked]) => checked && !habitLocked[id])}
        className={`px-4 py-2 rounded-lg transition ${Object.entries(habitChecked).some(([id, checked]) => checked && !habitLocked[id]) ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        {habitSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  </div>

            
            

            {/* Suggested Tasks - now last */}
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
                  value={ 
                  newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Priority */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Priority Level
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

      {/* Add/Edit Time Block Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddBlockModal(false)} />
          <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} w-96 rounded-lg shadow-xl p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editBlockId ? 'Edit Time Block' : 'Add Time Block'}
              </h3>
              <button
                onClick={() => setShowAddBlockModal(false)}
                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
              >
                <X size={20} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Block Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Block Name *
                </label>
                <input
                  type="text"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  placeholder="Enter block name..."
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {/* Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {/* Time */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Start Time *
                </label>
                <input
                  type="time"
                  value={newBlock.time}
                  onChange={(e) => setNewBlock({ ...newBlock, time: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {/* Duration */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duration *
                </label>
                <input
                  type="text"
                  value={newBlock.duration}
                  onChange={(e) => setNewBlock({ ...newBlock, duration: e.target.value })}
                  placeholder="e.g. 1 hour, 30 min"
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {/* Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type *
                </label>
                <select
                  value={newBlock.type}
                  onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
                  className={`w-full ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="focus">Focus</option>
                  <option value="meeting">Meeting</option>
                  <option value="break">Break</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* Assign Tasks */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assign Tasks
                </label>
                <div className="flex flex-wrap gap-2">
                  {tasks.map(task => (
                    <label key={task.id} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBlock.tasks.includes(task.id)}
                        onChange={() => toggleTaskAssignment(task.id)}
                        className="form-checkbox h-4 w-4 text-blue-500"
                      />
                      <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{task.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddBlockModal(false)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition`}
              >
                Cancel
              </button>
              <button
                onClick={saveTimeBlock}
                disabled={!newBlock.title.trim() || !newBlock.time || !newBlock.duration}
                className={`px-4 py-2 rounded-lg transition ${
                  newBlock.title.trim() && newBlock.time && newBlock.duration
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editBlockId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Archived Tasks Modal */}
      {showArchivedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowArchivedModal(false)} />
          <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} w-[32rem] max-h-[80vh] rounded-lg shadow-xl p-6 overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Archived Tasks</h3>
              <button
                onClick={() => setShowArchivedModal(false)}
                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
              >
                <X size={20} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="space-y-4">
              {archivedTasks.length === 0 ? (
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No archived tasks.</div>
              ) : (
                archivedTasks.map(task => (
                  <Card key={task.id} className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="badge badge-outline">{task.category}</span>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{task.dueDate}</span>
                            {task.priority === 'high' && (
                              <AlertTriangle className="text-red-500" size={14} />
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <span className="text-xs text-green-500">Archived</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAssistantDashboard;