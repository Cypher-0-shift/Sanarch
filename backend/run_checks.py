import time
import requests
import json
import sys

headers = {'Authorization': 'Bearer dev-mode-token'}
base_url = 'http://localhost:8000'

print('--- Check 4: Patient Creation ---')
patient_body = {
    'full_name': 'Test Patient',
    'date_of_birth': '1985-06-15',
    'relationship_to_owner': 'self'
}
resp = requests.post(f'{base_url}/patients/create', headers=headers, json=patient_body)
resp.raise_for_status()
patient = resp.json()
patient_id = patient['id']
print(f"Patient Sanarch ID: {patient.get('sanarch_id')}")
print(f"Patient ID: {patient_id}")

print('\n--- Check 5: Upload with patient_id, confirm, check timeline ---')
files = {'file': ('test_report.pdf', open('test_report.pdf', 'rb'), 'application/pdf')}
resp = requests.post(f'{base_url}/documents/upload?patient_id={patient_id}', headers=headers, files=files)
resp.raise_for_status()
doc_id = resp.json()['document_id']
print(f'Uploaded Doc ID: {doc_id}')

print('Polling status...')
extracted = {}

for i in range(30):
    time.sleep(3)
    status_resp = requests.get(f'{base_url}/documents/{doc_id}/status', headers=headers)
    status_resp.raise_for_status()
    status_data = status_resp.json()
    status = status_data['status']
    print(f'[{i}] Status: {status}')
    if status == 'pending_review':
        extracted = status_data.get('extracted_data', {})
        print('\n--- EXTRACTED DATA FROM PIPELINE ---')
        print(json.dumps(extracted, indent=2))
        print('Ready for confirmation.')
        break
    elif status == 'failed':
        print('Processing failed!')
        break

if not extracted:
    sys.exit(1)

confirm_body = {
    'label': 'Lab Report',
    'extracted_data': extracted
}
print('Confirming document...')
resp = requests.post(f'{base_url}/documents/{doc_id}/confirm', headers=headers, json=confirm_body)
resp.raise_for_status()
print('Confirmed!')

print('Checking timeline...')
resp = requests.get(f'{base_url}/timeline/{patient_id}', headers=headers)
resp.raise_for_status()
timeline = resp.json()
print(f"Timeline events total: {timeline.get('total')}")
event_id = timeline['events'][0]['id']
print('Event Data:')
print(json.dumps(timeline['events'][0], indent=2))

print('\n--- Check 6: QR Sharing Flow ---')
share_body = {
    'event_ids': [event_id],
    'doctor_name': 'Dr. Test'
}
resp = requests.post(f'{base_url}/sharing/generate-token', headers=headers, json=share_body)
resp.raise_for_status()
share = resp.json()
token = share['token']
print(f'Token: {token}')
print(f"Expires: {share.get('expires_at')}")
print(f"QR Payload: {share.get('qr_payload')}")

print('Accessing as doctor (no auth)...')
resp = requests.get(f'{base_url}/sharing/access/{token}')
resp.raise_for_status()
doctor_view = resp.json()
print(f"Doctor sees Sanarch ID: {doctor_view.get('sanarch_id')}")
print(f"Events returned: {len(doctor_view.get('events', []))}")

print('\nTests 4, 5, 6 Passed!')
