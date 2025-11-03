# SkillCompass

**Live** : https://skillcompassclient.vercel.app/login

> AI-Powered Talent Management Platform for Internal Career Development

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.3-3178c6.svg)](https://www.typescriptlang.org/)

## Overview

SkillCompass is an enterprise-grade AI-powered talent management platform designed to revolutionize internal career development and hiring. The platform leverages artificial intelligence to match employees with internal opportunities, identify skill gaps, and create personalized career paths, significantly reducing hiring costs while improving employee retention and satisfaction.

### Key Features

- **AI Career Advisor**: Intelligent chatbot powered by Google's Gemini AI for personalized career guidance
- **Automated Resume Parsing**: Extract and analyze skills, experience, and qualifications from uploaded resumes
- **Smart Job Matching**: AI-driven algorithm to match employees with internal opportunities
- **Career Readiness Scoring**: Real-time assessment of promotion readiness and skill gaps
- **HR Analytics Dashboard**: Comprehensive workforce analytics with KPIs and insights
- **Skill Gap Analysis**: Identify critical skill shortages across departments
- **Internal Mobility Tracking**: Monitor career progression and internal hiring metrics
- **Goal Management**: Set, track, and approve employee career goals with workflows

## Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Library**: Radix UI + shadcn/ui components
- **Styling**: TailwindCSS with custom design system
- **State Management**: React Context API + TanStack Query
- **Routing**: React Router v6
- **AI Integration**: Google Generative AI (Gemini)
- **Forms**: React Hook Form + Zod validation

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Express Session with bcrypt
- **Validation**: Express Validator
- **Session Store**: MongoDB with connect-mongo

#### Database & Services
- **Primary Database**: Supabase (PostgreSQL)
- **Document Store**: MongoDB
- **AI Provider**: Google Gemini API

## Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm** or **pnpm**: Latest version
- **MongoDB**: >= 6.0 (local or Atlas)
- **Supabase Account**: For database and authentication
- **Google AI API Key**: For Gemini AI features

### Environment Variables

#### Client (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_API_BASE_URL=https://skillcompassserver.vercel.app/api
```

#### Server (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret_key
HR_EMAIL=admin@skillcompass.com
HR_PASSWORD=your_admin_password
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skillcompass.git
   cd skillcompass
   ```

2. **Install Client Dependencies**
   ```bash
   cd Client
   pnpm install
   ```

3. **Install Server Dependencies**
   ```bash
   cd ../Server
   npm install
   ```

4. **Configure Environment Variables**
   - Create `.env` files in both `Client` and `Server` directories
   - Copy the environment variables from the templates above
   - Replace placeholder values with your actual credentials

5. **Initialize Database**
   ```bash
   cd Server
   npm start
   ```
   The server will automatically:
   - Connect to MongoDB
   - Create necessary collections
   - Initialize default HR account

### Running the Application

#### Development Mode

**Terminal 1 - Backend Server**
```bash
cd Server
npm run dev
```
The server will start on `https://skillcompassserver.vercel.app`

**Terminal 2 - Frontend Client**
```bash
cd Client
pnpm dev
```
The client will start on `http://localhost:5173`

#### Production Build

**Build Frontend**
```bash
cd Client
pnpm build
```

**Start Production Server**
```bash
cd Server
npm start
```

## Features Deep Dive

### Employee Portal

1. **AI Career Chat**
   - Natural language conversations with AI career advisor
   - Personalized recommendations based on skills and goals
   - Real-time guidance on career paths and development

2. **Resume Management**
   - Drag-and-drop resume upload
   - Automatic skill extraction using AI
   - Skills visualization and proficiency tracking

3. **Career Goals**
   - Set short-term and long-term career objectives
   - Track progress with visual indicators
   - Submit goals for HR approval

4. **Job Discovery**
   - Browse internal job openings
   - AI-powered job matching scores
   - One-click application process

### HR Portal

1. **Analytics Dashboard**
   - Real-time workforce metrics
   - Department-level insights
   - Attrition risk indicators
   - Internal mobility tracking

2. **Employee Explorer**
   - Searchable employee database
   - Skill-based filtering
   - Career progression tracking
   - Readiness scores

3. **Job Management**
   - Create and publish internal job postings
   - Track applications and candidates
   - AI-powered candidate matching
   - Application review workflow

4. **Approvals**
   - Review employee career goals
   - Approve or reject with feedback
   - Track approval history

5. **Skill Gap Analysis**
   - Identify critical skill shortages
   - Department-level gap analysis
   - Priority-based recommendations
   - Training needs assessment


## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use TypeScript for type safety
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/skillcompass
```

**Supabase Connection Error**
```bash
# Verify environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=your-anon-key
```

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

## Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics with predictive models
- [ ] Integration with popular HRIS systems
- [ ] Multi-language support
- [ ] Video interview scheduling
- [ ] Learning management system integration
- [ ] Slack/Teams notifications
- [ ] Advanced reporting and exports

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@skillcompass.com or open an issue on GitHub.

## Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Supabase](https://supabase.com/) - Backend platform
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [TailwindCSS](https://tailwindcss.com/) - Styling framework

---

**Built with passion by the SkillCompass Team**

For more information, visit [https://skillcompass.io]([https://skillcompass.io](https://skillcompassclient.vercel.app/login))
