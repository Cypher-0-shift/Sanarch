import httpx

url = "https://sanarch-production.up.railway.app/users/me"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzA5NGY0ZS0yYmZjLTQzZmMtOWI5NS00OTIxNmQzYzQxZDEiLCJzYW5hcmNoX2lkIjoiU0FOLUlOLTI2LU0tMTgtUC0wMC1UUUVMRVItS0EiLCJleHAiOjE3ODAyMjg1NzQsImlhdCI6MTc4MDIyNDk3NH0.r5M8BvPMSwrKNH0W9shJ6-pvUBkFv0icffXqJzIfgVE"

headers = {
    "Authorization": f"Bearer {token}"
}

try:
    response = httpx.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
    print(f"Headers: {response.headers}")
except Exception as e:
    print(f"Error: {e}")
