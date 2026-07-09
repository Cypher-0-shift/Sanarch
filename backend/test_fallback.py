import fitz
from PIL import Image
import io
import urllib.request

img1 = urllib.request.urlopen('https://www.w3.org/MarkUp/Test/xhtml-print/20050519/tests/jpeg444.jpg').read()
img2 = urllib.request.urlopen('https://www.gstatic.com/webp/gallery/1.sm.webp').read()
img_list = [img1, img2]

pdf = fitz.open()

for img_bytes in img_list:
    try:
        img_doc = fitz.open(stream=img_bytes)
        rect = img_doc[0].rect
        img_doc.close()
        f_bytes = img_bytes
    except Exception as e:
        print(f"Fallback for {e}")
        with Image.open(io.BytesIO(img_bytes)) as pil_img:
            if pil_img.mode in ('RGBA', 'P'): 
                pil_img = pil_img.convert('RGB')
            arr = io.BytesIO()
            pil_img.save(arr, format='JPEG', quality=95)
            f_bytes = arr.getvalue()
        
        img_doc = fitz.open(stream=f_bytes)
        rect = img_doc[0].rect
        img_doc.close()
        
    page = pdf.new_page(width=rect.width, height=rect.height)
    page.insert_image(rect, stream=f_bytes)

print(len(pdf.tobytes()))
