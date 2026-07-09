import os
from google.cloud import vision

def test_vision():
    try:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "firebase-service-account.json"
        client = vision.ImageAnnotatorClient()
        print("Vision client initialized.")
        
        # Try a dummy image
        image = vision.Image(content=b"dummyimagebytes")
        # Just creating the request to see if auth works is not enough, we need to make an API call to see if the API is enabled.
        # But we can't easily make an API call with dummy bytes without getting a 400 Bad Request.
        # Let's try to get a small 1x1 png
        import base64
        # 1x1 transparent PNG
        img_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        img_bytes = base64.b64decode(img_b64)
        
        image = vision.Image(content=img_bytes)
        response = client.text_detection(image=image)
        print("API Call Success!")
        print("Response:", response)
    except Exception as e:
        print("API Call Failed:", e)

if __name__ == "__main__":
    test_vision()
