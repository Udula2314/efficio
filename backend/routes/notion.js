const express = require('express');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const router = express.Router();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_CALENDAR_DB_ID || process.env.NOTION_DATABASE_ID;
const archiveDatabaseId = process.env.NOTION_ARCHIVE_DB_ID;
const habitTrackerDatabaseId = process.env.NOTION_HABIT_TRACKER;
const timeBlockDatabaseId = process.env.NOTION_TIMEBLOCK_DB_ID;

// GET /api/notion/tasks
router.get('/tasks', async (req, res) => {
  try {
    if (!databaseId) {
      return res.status(400).json({ 
        error: 'NOTION_DATABASE_ID is not configured',
        message: 'Please add NOTION_CALENDAR_DB_ID or NOTION_DATABASE_ID to your .env file'
      });
    }
    
    console.log('Fetching tasks from database:', databaseId);
    const response = await notion.databases.query({ database_id: databaseId });
    console.log('Notion response:', response.results.length, 'tasks found');
    
    // Debug: Log the first task's raw properties
    if (response.results.length > 0) {
      const firstTask = response.results[0];
      console.log('First task raw properties:', JSON.stringify(firstTask.properties, null, 2));
      console.log('Status property:', firstTask.properties.Status);
    }
    
    // Map Notion properties to your frontend task format
    const tasks = response.results.map(page => {
      // Debug: Log the raw status from Notion
      const rawStatus = page.properties.Status?.status?.name;
      console.log('Raw status from Notion:', rawStatus);
      
      // Map Notion status to frontend status - more robust mapping
      let status = 'pending'; // default
      
      if (rawStatus) {
        const lowerStatus = rawStatus.toLowerCase();
        if (lowerStatus === 'in progress' || lowerStatus === 'inprogress') {
          status = 'inprogress';
        } else if (lowerStatus === 'completed' || lowerStatus === 'done' || lowerStatus === 'complete') {
          status = 'completed';
        } else if (lowerStatus === 'pending') {
          status = 'pending';
        }
      }
      
      console.log('Mapped status:', rawStatus, '->', status);
      
      return {
        id: page.id,
        title: page.properties.Name?.title?.[0]?.plain_text || 'Untitled Task',
        category: page.properties.Category?.select?.name || 'Other',
        dueDate: page.properties['Due Date']?.date?.start || '',
        status: status,
        priority: page.properties["Priority Level"]?.select?.name?.toLowerCase() || 'medium',
      };
    });
    
    console.log('Mapped tasks:', tasks);
    res.json(tasks);
  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch tasks from Notion'
    });
  }
});

// POST /api/notion/tasks
router.post('/tasks', async (req, res) => {
  try {
    if (!databaseId) {
      return res.status(400).json({ 
        error: 'NOTION_DATABASE_ID is not configured',
        message: 'Please add NOTION_CALENDAR_DB_ID or NOTION_DATABASE_ID to your .env file'
      });
    }

    const { title, status, priority, dueDate, category } = req.body;
    
    console.log('Creating task:', { title, status, priority, dueDate, category });
    
    // Map frontend status to Notion status
    let notionStatus = 'Pending';
    if (status === 'inprogress') {
      notionStatus = 'In progress';
    } else if (status === 'completed') {
      notionStatus = 'Completed';
    }
    
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Status: { status: { name: notionStatus } },
        "Priority Level": { select: { name: priority || 'medium' } },
        Category: { select: { name: category || 'Other' } },
        "Due Date": dueDate ? { date: { start: dueDate } } : undefined,
      },
    });
    
    console.log('Task created successfully:', response.id);
    res.json({ 
      success: true, 
      id: response.id,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create task in Notion'
    });
  }
});

// PUT /api/notion/tasks/:id - Update task status
router.put('/tasks/:id', async (req, res) => {
  try {
    if (!databaseId) {
      return res.status(400).json({ 
        error: 'NOTION_DATABASE_ID is not configured'
      });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Updating task status:', id, status);
    
    // Map frontend status to Notion status
    let notionStatus = 'Pending';
    if (status === 'inprogress') {
      notionStatus = 'In progress';
    } else if (status === 'completed') {
      notionStatus = 'Completed';
    }
    
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        Status: { status: { name: notionStatus } }
      }
    });
    
    console.log('Task updated successfully:', response.id);
    res.json({ 
      success: true, 
      id: response.id,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to update task in Notion'
    });
  }
});

// DELETE /api/notion/tasks/:id - Delete a task from the main Notion DB
router.delete('/tasks/:id', async (req, res) => {
  try {
    if (!databaseId) {
      return res.status(400).json({ error: 'NOTION_DATABASE_ID is not configured' });
    }
    const { id } = req.params;
    await notion.pages.update({
      page_id: id,
      archived: true
    });
    res.json({ success: true, id, message: 'Task deleted (archived) from Notion DB' });
  } catch (error) {
    console.error('Error deleting task from Notion:', error);
    res.status(500).json({ error: error.message, details: 'Failed to delete task from Notion' });
  }
});

// GET /api/notion/database-schema - Get database schema to see available options
router.get('/database-schema', async (req, res) => {
  try {
    if (!databaseId) {
      return res.status(400).json({ 
        error: 'NOTION_DATABASE_ID is not configured'
      });
    }
    
    console.log('Fetching database schema for:', databaseId);
    const response = await notion.databases.retrieve({ database_id: databaseId });
    
    // Extract status options
    const statusOptions = response.properties.Status?.status?.options || [];
    console.log('Available status options:', statusOptions);
    
    res.json({ 
      statusOptions: statusOptions.map(option => option.name),
      database: response
    });
  } catch (error) {
    console.error('Error fetching database schema:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch database schema'
    });
  }
});

// GET /api/notion/archive-tasks
router.get('/archive-tasks', async (req, res) => {
  try {
    if (!archiveDatabaseId) {
      return res.status(400).json({ 
        error: 'NOTION_ARCHIVE_DB_ID is not configured',
        message: 'Please add NOTION_ARCHIVE_DB_ID to your .env file'
      });
    }
    const response = await notion.databases.query({ database_id: archiveDatabaseId });
    const tasks = response.results.map(page => ({
      id: page.id,
      title: page.properties.Name?.title?.[0]?.plain_text || 'Untitled Task',
      category: page.properties.Category?.select?.name || 'Other',
      dueDate: page.properties['Due Date']?.date?.start || '',
      status: page.properties.Status?.status?.name?.toLowerCase() || 'completed',
      priority: page.properties["Priority Level"]?.select?.name?.toLowerCase() || 'medium',
    }));
    res.json(tasks);
  } catch (error) {
    console.error('Notion API error (archive):', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch archived tasks from Notion'
    });
  }
});

// POST /api/notion/archive-tasks
router.post('/archive-tasks', async (req, res) => {
  try {
    if (!archiveDatabaseId) {
      return res.status(400).json({ 
        error: 'NOTION_ARCHIVE_DB_ID is not configured',
        message: 'Please add NOTION_ARCHIVE_DB_ID to your .env file'
      });
    }
    const { title, status, priority, dueDate, category } = req.body;
    const response = await notion.pages.create({
      parent: { database_id: archiveDatabaseId },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Status: { status: { name: status || 'Completed' } },
        "Priority Level": { select: { name: priority || 'medium' } },
        Category: { select: { name: category || 'Other' } },
        "Due Date": dueDate ? { date: { start: dueDate } } : undefined,
      },
    });
    res.json({ 
      success: true, 
      id: response.id,
      message: 'Archived task created successfully'
    });
  } catch (error) {
    console.error('Error creating archived task:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create archived task in Notion'
    });
  }
});

// GET /api/notion/habits - fetch all habits
router.get('/habits', async (req, res) => {
  try {
    if (!habitTrackerDatabaseId) {
      return res.status(400).json({ error: 'NOTION_HABIT_TRACKER is not configured' });
    }
    const response = await notion.databases.query({ database_id: habitTrackerDatabaseId });
    const habits = response.results.map(page => ({
      id: page.id,
      habit: page.properties.Habit?.title?.[0]?.plain_text || '',
      description: page.properties.Description?.rich_text?.[0]?.plain_text || '',
      doNow: page.properties['Do Now']?.checkbox || false
    }));
    res.json(habits);
  } catch (error) {
    console.error('Notion API error (habits):', error);
    res.status(500).json({ error: error.message, details: 'Failed to fetch habits from Notion' });
  }
});

// PATCH /api/notion/habits/:id - update Do Now property
router.patch('/habits/:id', async (req, res) => {
  try {
    if (!habitTrackerDatabaseId) {
      return res.status(400).json({ error: 'NOTION_HABIT_TRACKER is not configured' });
    }
    const { id } = req.params;
    const { doNow } = req.body;
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        'Do Now': { checkbox: !!doNow }
      }
    });
    res.json({ success: true, id, doNow });
  } catch (error) {
    console.error('Error updating habit Do Now:', error);
    res.status(500).json({ error: error.message, details: 'Failed to update habit in Notion' });
  }
});

// POST /api/notion/timeblocks
router.post('/timeblocks', async (req, res) => {
  try {
    if (!timeBlockDatabaseId) {
      return res.status(400).json({ error: 'NOTION_TIMEBLOCK_DB_ID is not configured' });
    }
    const { title, date, time, duration, type, tasks } = req.body;
    const response = await notion.pages.create({
      parent: { database_id: timeBlockDatabaseId },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Date: { date: { start: date } },
        Time: { rich_text: [{ text: { content: time } }] },
        Duration: { rich_text: [{ text: { content: duration } }] },
        Type: { select: { name: type } },
        // Add more properties as needed
      },
    });
    res.json({ success: true, id: response.id, message: 'Time block created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message, details: 'Failed to create time block in Notion' });
  }
});

module.exports = router;