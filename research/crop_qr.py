import cv2, numpy as np
p = r"C:\Users\ORAS Intern\Downloads\c4c90e7d-5cec-4529-bc08-7370d921109c.jpg"
img = cv2.imread(p)
h,w=img.shape[:2]
# save lower half enlarged for inspection
crop = img[int(h*0.62):int(h*0.98), int(w*0.5):int(w*0.95)]
cv2.imwrite(r"C:\Users\ORAS Intern\Downloads\chessunited-website\research\qr_crop.png", cv2.resize(crop,None,fx=2,fy=2,interpolation=cv2.INTER_CUBIC))
print(crop.shape)
