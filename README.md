# Running

## Python  
To run `cd backend` then in the terminal run `pip install -r requirements.txt`  
After installing dependencies run `uvicorn main:app --reload`  


## React  

To run `cd my-app` then run `npm install`  
After installing dependcies run `npm run dev`

## Locust

To run `cd backend` then run `locust -f locustfile.py --host http://localhost:8000`
Open `http://localhost:8089` in your browser
Type number of users and spawn rate and `http://localhost:8000` in the host field
Click start