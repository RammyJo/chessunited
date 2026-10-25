import cv2, numpy as np, os
p = r"C:\Users\ORAS Intern\Downloads\c4c90e7d-5cec-4529-bc08-7370d921109c.jpg"
img = cv2.imread(p)
h,w = img.shape[:2]
print("size", w, h)
det = cv2.QRCodeDetector()
# QR occupies lower-right area of the card
crops = {
 "bottom": img[int(h*0.55):int(h*0.97), int(w*0.45):int(w*0.95)],
 "br": img[int(h*0.6):h, int(w*0.55):w],
 "full": img,
}
for name,c in crops.items():
    for scale in (3,4,6):
        up = cv2.resize(c, None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)
        for mode,proc in {
            "gray": cv2.cvtColor(up, cv2.COLOR_BGR2GRAY),
            "otsu": cv2.threshold(cv2.cvtColor(up, cv2.COLOR_BGR2GRAY),0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1],
            "adap": cv2.adaptiveThreshold(cv2.cvtColor(up, cv2.COLOR_BGR2GRAY),255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,31,5),
        }.items():
            data, pts, _ = det.detectAndDecode(proc)
            if data:
                print("FOUND", name, scale, mode, "->", data)
                raise SystemExit
print("not decoded")
