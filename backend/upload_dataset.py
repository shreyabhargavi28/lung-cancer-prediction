import pandas as pd
from pymongo import MongoClient

# 🔹 Paste your MongoDB connection string
MONGO_URI = "mongodb+srv://nshreya2806_db_user:Shreya28062006@cluster0.7hdinr8.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)

# 🔹 Database and collection
db = client["lung_cancer_db"]
collection = db["patients"]

# Read CSV
df = pd.read_csv("lung_cancer.csv")
print("Number of rows in CSV:", len(df))

# Convert to JSON
data = df.to_dict(orient="records")

# Insert into MongoDB
result = collection.insert_many(data)
print("Inserted IDs count:", len(result.inserted_ids))

print("Dataset uploaded successfully!")