# Running

## Python

Make sure you have mongodb installed first. If you don't, the app will not run.

1. First in the terminal `cd backend`, then run `python -m venv venv`
2. Secondly run `.\venv\Scripts\activate`
3. After you are in the virtual environment, run `pip install -r requirements.txt`
4. After all dependecies have been installed run `uvicorn main:app --reload`

## React

To run `cd my-app` then run `npm install`  
After installing dependcies run `npm run dev`

## Project Structure

```
issp-test/
├── backend/             # FastAPI backend
│   ├── routes/         # API routes
│   ├── services/       # Services (auth, sensor)
│   ├── models/          # Project models (assets, project, sensor, user)
│   ├── main.py         # Main entry point for the API
│   ├── database.py       # Database models
│   ├── requirements.txt # Dependencies
│
├── my-app/             # Frontend (React)
│   ├── src/            # Source files
|   |       ├──── assets/ # assets
|   |       ├──── components/ # pre rendered components
|   |       ├──── lib/ # 3rd party react configs 
|   |       ├──── pages/ # all pages
|   |               ├──── projects/ # project pages
│   ├── public/         # Static assets
│   ├── package.json    # Dependencies & scripts
│   ├── vite.config.js  # react config
│
├── README.md           # Project documentation
```

## Environment Setup

### Backend (FastAPI)

To configure the backend, ensure MongoDB is running and create a `.env` file in the `backend/` directory with:

```
MONGO_URI=mongodb://localhost:27017/your-database-name
SECRET_KEY=your-secret-key
DEBUG=True
```

### Frontend (React)

To configure environment variables for React, create a `.env` file in `my-app/` with:

```
VITE_API_BASE_URL=http://localhost:8000
```

## API Endpoints

### Authentication
- **POST** `/api/register` - Register a new user
- **POST** `/token` - Generates token
- **POST** `/api/login` - Login user

### Users
- **GET** `/api/user` - Fetch user details
- **GET** `/api/admin/users/{user_id}` - Gets users within Admin account
- **GET** `/api/admin/dashboard/users` - Gets all users from the db
- **POST** `/api/admin/users/{user_id}/reset-password` - Update user password as admin
- **POST** `/api/admin/users/{user_id}/login-as` - Update user password as admin

### Projects
- **POST** `/api/add-projects` - Add a project
- **POST** `/api/add-projects/{project_id}/assets` - get the assets of the project
- **GET** `/api/add-projects` - get the projects
- **GET** `/api/add-projects/{project_id}/assets` - get the assets of the project
- **POST** `/api/add-projects/{project_id}/ass-assets` - add assets to a project

### Sensors
- **POST** `/api/receive-sensor-data` - add data to sensors
- **POST** `/api/add-sensors` - add sensors
- **GET** `/api/sensor-data/{sensor_id}` - get the sensors along with their uuid
- **GET** `/api/sensor/{asset_id}` - get the asset id along the sensors

### Example Usage

```bash
# Running the backend
cd backend
uvicorn main:app --reload

# Running the frontend
cd my-app
npm run dev
```




