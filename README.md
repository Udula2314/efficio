# EffiCio - AI-Powered Productivity Dashboard

EffiCio is a comprehensive productivity management application that combines task management, time blocking, habit tracking, and AI assistance to help you optimize your daily workflow. Built with React, Node.js, and integrated with Notion for seamless data synchronization.

## 🚀 Features

### 📋 Task Management
- **Smart Task Organization**: Categorize tasks by work, personal, meetings, health, learning, and more
- **Priority Levels**: Set high, medium, or low priority for effective task prioritization
- **Status Tracking**: Monitor tasks through pending, in-progress, and completed states
- **Due Date Management**: Set and track deadlines for better time management
- **Offline Support**: Work seamlessly even without internet connection with local storage

### ⏰ Time Blocking
- **Visual Schedule**: Weekly calendar view with daily time block planning
- **Block Types**: Focus, meeting, break, work, and other activity types with color coding
- **Task Assignment**: Link specific tasks to time blocks for better organization
- **Progress Tracking**: Mark blocks as completed and track your daily progress

### 🎯 Habit Tracking
- **Daily Habits**: Track recurring habits with checkboxes
- **Notion Integration**: Sync habits with your Notion habit tracker database
- **Progress Visualization**: Visual feedback for completed habits
- **Auto-submission**: Automatically submit completed habits to Notion

### 🤖 AI Assistant
- **Smart Summaries**: AI-powered daily summaries and task recommendations
- **Priority Suggestions**: Intelligent task prioritization based on deadlines and importance
- **Chat Interface**: Interactive AI assistant for productivity guidance
- **Focus Recommendations**: Optimal time suggestions for deep work sessions

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Sync**: Automatic synchronization with Notion when online
- **Mood Tracking**: Daily mood tracking for productivity insights
- **Focus Timer**: Built-in Pomodoro timer for focused work sessions

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for beautiful UI elements
- **Dexie.js** - IndexedDB wrapper for offline data storage
- **Lucide React** - Beautiful icon library
- **Radix UI** - Accessible component primitives

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Notion API** - Official Notion integration
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Key Libraries
- **@notionhq/client** - Official Notion API client
- **axios** - HTTP client for API requests
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Notion account with API access

### 1. Clone the Repository
```bash
git clone <repository-url>
cd efficio
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
NOTION_TOKEN=your_notion_integration_token
NOTION_CALENDAR_DB_ID=your_calendar_database_id
NOTION_ARCHIVE_DB_ID=your_archive_database_id
NOTION_HABIT_TRACKER=your_habit_tracker_database_id
NOTION_TIMEBLOCK_DB_ID=your_timeblock_database_id
PORT=5050
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Start Development Servers

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5050

## 🔧 Notion Setup

### 1. Create Notion Integration
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name your integration (e.g., "EffiCio")
4. Copy the integration token

### 2. Set Up Databases
Create the following databases in Notion:

#### Tasks Database
Properties:
- **Name** (Title) - Task name
- **Status** (Status) - Pending, In progress, Completed
- **Priority Level** (Select) - Low, Medium, High
- **Category** (Select) - Work, Personal, Meeting, Health, Learning, Other
- **Due Date** (Date) - Task deadline

#### Habit Tracker Database
Properties:
- **Habit** (Title) - Habit name
- **Description** (Text) - Habit description
- **Do Now** (Checkbox) - Daily completion status

#### Time Blocks Database
Properties:
- **Name** (Title) - Block name
- **Date** (Date) - Block date
- **Time** (Text) - Start time
- **Duration** (Text) - Block duration
- **Type** (Select) - Focus, Meeting, Break, Work, Other

#### Archive Database
Properties:
- Same as Tasks database (for completed tasks)

### 3. Share Databases
1. Open each database
2. Click "Share" in the top right
3. Add your integration with "Edit" permissions
4. Copy the database IDs from the URL

## 🚀 Usage

### Getting Started
1. **Configure Notion**: Set up your databases and add the integration
2. **Start the Application**: Run both backend and frontend servers
3. **Add Tasks**: Use the "Add Task" button to create new tasks
4. **Plan Your Day**: Create time blocks for better schedule management
5. **Track Habits**: Check off daily habits in the tracker
6. **Use AI Assistant**: Chat with the AI for productivity insights

### Key Workflows

#### Task Management
1. Add tasks with categories and priorities
2. Move tasks through different statuses (pending → in-progress → completed)
3. Archive completed tasks automatically
4. View task history in the "Past" section

#### Time Blocking
1. Create time blocks for different activities
2. Assign tasks to specific time blocks
3. Track completion status
4. View weekly calendar for overview

#### Habit Tracking
1. Check off daily habits
2. Submit completed habits to Notion
3. Track progress over time

#### Focus Sessions
1. Use the built-in timer for focused work
2. Set custom time intervals
3. Track your focus sessions

## 🔄 Data Synchronization

### Online Mode
- Real-time sync with Notion
- Automatic backup of all changes
- Conflict resolution for simultaneous edits

### Offline Mode
- Local storage using IndexedDB
- Queue changes for sync when online
- Seamless offline-to-online transition

### Sync Status Indicators
- **Green**: All data synced
- **Yellow**: Offline mode
- **Red**: Unsynced changes pending

## 🎨 Customization

### Themes
- Toggle between light and dark modes
- Automatic theme persistence

### Categories
- Customize task categories in Notion
- Add new categories as needed

### Time Block Types
- Modify block types and colors
- Add new activity types

## 🐛 Troubleshooting

### Common Issues

#### Backend Connection Issues
- Verify the backend server is running on port 5050
- Check CORS configuration in backend/index.js
- Ensure environment variables are properly set

#### Notion Sync Issues
- Verify Notion integration token is correct
- Check database permissions and sharing settings
- Ensure database IDs match your Notion databases

#### Offline Mode Issues
- Clear browser cache and IndexedDB storage
- Check browser console for errors
- Verify Dexie.js is properly configured

### Debug Mode
Enable debug logging by checking the browser console for detailed error messages and sync status information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Notion** for providing the excellent API
- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first approach
- **Dexie.js** for offline storage capabilities

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the Notion API documentation

---

**EffiCio** - Empowering productivity through intelligent task management and AI assistance. 
