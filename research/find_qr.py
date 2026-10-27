import cv2, glob, os, numpy as np
files = sorted(glob.glob(os.path.expanduser("~/Downloads/*.jpg")))
det = cv2.QRCodeDetector()
targets = [f for f in files if os.path.basename(f).split('-')[0] in {
 'fa6dc7c9','474a7a64','0f0242ac','d38c9c60','767745ad','266a4f5c','5a4d8f73',
 '1ca3bb3f','52924d3e','dc091ca1','7569a681','3fcb7c6e','d8152276','f923c353',
 'c4c90e7d','9011d057','14c1c942','5c070c9d','7eb8c41b','97954572','55644f40',
 'e7cafd39','39097b16','12ecbe4a','a66fa455','857444a9','d876ff22'}]
for f in targets:
    img = cv2.imread(f)
    h,w = img.shape[:2]
    found = False
    for scale in (1,2,3):
        im = cv2.resize(img,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
        ok, pts = det.detect(im)
        if ok and pts is not None:
            xs=pts.reshape(-1,2)
            x0,y0 = xs.min(0)/scale; x1,y1 = xs.max(0)/scale
            data,_,_ = det.detectAndDecode(im)
            print(f"{os.path.basename(f)} scale={scale} box=({int(x0)},{int(y0)},{int(x1)},{int(y1)}) data={data!r}")
            found=True
            break
    if not found:
        pass
