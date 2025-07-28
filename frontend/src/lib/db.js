// src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('AIAssistantDB');

db.version(2).stores({
  tasks: '++id, notionId, title, category, dueDate, priority, status, updatedAt, syncStatus',
  archivedTasks: '++id, notionId, title, category, dueDate, priority, status, updatedAt, syncStatus'
});

export default db;
