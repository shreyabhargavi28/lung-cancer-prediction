import joblib

model = joblib.load("lung_risk_model.pkl")

sample_input = [[
    55,
    1,
    1,
    20,
    15,
    120,
    1,
    1,
    1,
    1,
    1,
    28
]]

prediction = model.predict(sample_input)

print("Prediction:", prediction)