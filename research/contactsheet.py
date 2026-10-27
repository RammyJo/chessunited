from PIL import Image, ImageDraw, ImageFont, ImageOps
import glob, os

files = [
 ('fa6dc7c9-6b2c-48be-b3fe-ca2519b1d1fc.jpg','weekly poster'),
 ('474a7a64-0373-4c0e-9fbc-e9c4458e4707.jpg','T2 poster'),
 ('0f0242ac-c7a1-47d0-b2e2-4a4a534f5e06.jpg','ricky bio'),
 ('d38c9c60-9378-4cc1-b0ff-065ada123269.jpg','ricky travel'),
 ('767745ad-7cf5-476d-b85c-c739721d54ec.jpg','photo A'),
 ('266a4f5c-3575-4d87-ab78-cea6c564fed5.jpg','mario poster'),
 ('5a4d8f73-9107-4ae5-9db5-84e8a8a5636c.jpg','merch poster'),
 ('1ca3bb3f-b8c0-44fb-8284-cdfff717c142.jpg','program'),
 ('52924d3e-ebc9-4382-8c3a-a4cc63c94dcd.jpg','medals'),
 ('dc091ca1-0e95-4e90-a4ce-02d35d62889f.jpg','logo'),
 ('7569a681-69ba-4d78-b300-59e827530814.jpg','sponsors'),
 ('3fcb7c6e-57cf-4ebd-b5ef-06ad56bf0d6b.jpg','photo B'),
 ('d8152276-6ef8-4318-9652-2410cdfc9654.jpg','photo C'),
 ('f923c353-345c-4550-a56d-04edfdd285a8.jpg','photo D?'),
 ('c4c90e7d-5cec-4529-bc08-7370d921109c.jpg','photo E'),
 ('9011d057-d23e-462a-afaa-9334cc060411.jpg','photo F'),
 ('14c1c942-23ec-4581-9b8c-3699f0335dd2.jpg','photo G'),
 ('5c070c9d-7c3e-4db3-a0d7-a3b3f511b2a6.jpg','photo H'),
 ('7eb8c41b-fdec-4c57-915f-5725710ce8ee.jpg','photo I'),
 ('97954572-bc30-406c-83d8-38d2a5c6f5a6.jpg','photo J'),
 ('55644f40-2f10-455e-92e6-e1d99ab5cc78.jpg','photo K'),
 ('e7cafd39-b59d-4b69-89bc-6c3260b1e57a.jpg','photo L'),
 ('39097b16-14c6-4d21-9e47-0a17d2a27790.jpg','photo M'),
 ('12ecbe4a-a70e-4423-ada3-fe8e98088060.jpg','photo N'),
 ('a66fa455-ad10-43bb-a2c9-96c959af723c.jpg','photo O'),
 ('857444a9-ae15-4afc-90f5-0127d4c50d4f.jpg','photo P'),
 ('d876ff22-ae53-4908-b302-b265bf6b5ba5.jpg','T1 poster')]
src = os.path.expanduser("~/Downloads")
out = os.path.dirname(os.path.abspath(__file__))
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 30)
except Exception:
    font = ImageFont.load_default()

cols, cw, ch = 5, 320, 380
for sheet in range(0, len(files), 15):
    chunk = files[sheet:sheet+15]
    rows = (len(chunk)+cols-1)//cols
    canvas = Image.new("RGB", (cols*cw, rows*ch), "white")
    d = ImageDraw.Draw(canvas)
    for i,(fn,label) in enumerate(chunk):
        p = os.path.join(src, fn)
        im = Image.open(p).convert("RGB")
        im = ImageOps.contain(im, (cw-20, ch-60))
        x = (i%cols)*cw + (cw-im.width)//2
        y = (i//cols)*ch + 10
        canvas.paste(im,(x,y))
        tag = f"{sheet//15*15+i+1}. {label}"
        d.text(((i%cols)*cw+8, (i//cols)*ch+ch-45), tag, fill="black", font=font)
    canvas.save(os.path.join(out, f"contact_{sheet//15+1}.jpg"), quality=88)
    print("saved", f"contact_{sheet//15+1}.jpg", canvas.size)
