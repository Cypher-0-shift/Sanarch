import os
import boto3
from botocore.client import Config
import json

# Backblaze B2 Config
B2_KEY_ID="00451cb44f685790000000002"
B2_APPLICATION_KEY="K004J9jwK7ImrIULIqarA4XJhFi/e1k"
B2_BUCKET_NAME="sanarch-docs"
B2_ENDPOINT_URL="https://s3.us-west-004.backblazeb2.com"

def get_b2_client():
    return boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT_URL,
        aws_access_key_id=B2_KEY_ID,
        aws_secret_access_key=B2_APPLICATION_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )

def test_b2():
    client = get_b2_client()
    key = "tmp/test_file.txt"
    try:
        # Upload
        print(f"Uploading to {key}...")
        client.put_object(
            Bucket=B2_BUCKET_NAME,
            Key=key,
            Body=b"hello world",
            ContentType="text/plain"
        )
        print("Upload successful!")

        # Download
        print(f"Downloading from {key}...")
        resp = client.get_object(
            Bucket=B2_BUCKET_NAME,
            Key=key
        )
        print("Download successful! Content:", resp["Body"].read())

        # List
        print("Listing bucket...")
        resp = client.list_objects_v2(Bucket=B2_BUCKET_NAME, Prefix="tmp/")
        print("Objects:", [obj["Key"] for obj in resp.get("Contents", [])])

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_b2()
