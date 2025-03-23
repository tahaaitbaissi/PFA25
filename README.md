## Install dependencies
```
pip install -r requirements.txt
```

## run the AI service
```
uvicorn main:app --reload
```

## init DataBase
```
cd backend
flask --app app init-db
```
