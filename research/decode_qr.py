import cv2, glob, os
files = sorted(glob.glob(r"C:\Users\ORAS Intern\Downloads\*.jpg"))
det = cv2.QRCodeDetector()
for f in files:
    img = cv2.imread(f)
    if img is None:
        continue
    data, pts, _ = det.detectAndDecode(img)
    if data:
        print(os.path.basename(f), "->", data)
