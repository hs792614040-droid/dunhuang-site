"""Download the selected editorial images and keep their source records locally."""
import io
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageOps

DEST = Path(__file__).resolve().parents[1] / 'public/images/editorial'
ITEMS = [
 ('cave-45', '莫高窟第45窟', 'https://cdn.e-dunhuang.com/SOURCES/10.0001/0001/0001/0045/05/1/1.jpg', 'https://www.e-dunhuang.com/', '数字敦煌 · 敦煌研究院'),
 ('cave-57', '莫高窟第57窟', 'https://cdn.e-dunhuang.com/SOURCES/10.0001/0001/0001/0057/05/1/1.jpg', 'https://www.e-dunhuang.com/cave/10.0001/0001.0001.0057', '数字敦煌 · 敦煌研究院'),
 ('cave-220', '莫高窟第220窟', 'https://cdn.e-dunhuang.com/SOURCES/10.0001/0001/0001/0220/05/1/1.jpg', 'https://www.e-dunhuang.com/cave/10.0001/0001.0001.0220', '数字敦煌 · 敦煌研究院'),
 ('yellow-noodles', '敦煌驴肉黄面', 'https://www.gscn.com.cn/pic/003/001/350/00300135000_1ad8847c.png', 'http://gansu.gscn.com.cn/system/2018/05/03/011942071.shtml', '中国甘肃网'),
 ('apricot-drink', '杏皮水', 'https://p2.img.cntv.cn/photoworkspace/contentimg/2024/06/23/2024062315352579869.png', 'https://news.cctv.cn/2024/06/23/ARTItOd6mBQc5c6bH14RUf5u240623.shtml', '央视网 · 西北饮品主题配图'),
 ('paper-cut', '飞天剪纸', 'https://p6.itc.cn/q_70/images03/20230831/bcd0436d881d4249820a2a74859c8018.jpeg', 'http://www.360doc.com/content/14/0420/21/13789206_370666073.shtml', '《剪纸收藏簿10：敦煌飞天》· 手工艺主题配图'),
 ('silk-scarf', '敦煌主题丝巾', 'https://gd2.alicdn.com/imgextra/i2/143455043/TB2VFLTeVXXXXblXpXXXXXXXXXX_!!143455043.jpg', 'https://item.taobao.com/item.htm?id=521715481839', '商品公开展示图 · 款式参考'),
 ('notebook', '敦煌主题笔记本', 'https://img01.yzcdn.cn/upload_files/2025/09/04/Fg9_2eqVQxi2GMwidBWUXaZfzzsM.jpg', 'https://detail.youzan.com/show/goods?alias=36bvtqdxqs9tb3l', '有赞商品展示图 · 款式参考'),
 ('news-conservation', '文物保护', 'https://www.dha.ac.cn/__local/A/9C/FE/59D5FD59ACCE0C77E9BB875A4A1_615A4F8F_6E3A4.jpg', 'https://www.dha.ac.cn/info/1019/8061.htm', '敦煌研究院 · 原文配图'),
 ('news-culture', '敦煌文化传播', 'https://www.dha.ac.cn/__local/C/58/01/71C87BE2D6CCAAE329D85211391_34C83B6E_1BFAF.jpg', 'https://www.dha.ac.cn/info/1019/8064.htm', '敦煌研究院 · 原文配图'),
 ('news-forum', '敦煌服饰文化论坛', 'https://www.dha.ac.cn/__local/7/D9/B4/38CE29405CBEEC0C227B069608B_B10C8F90_2E3C7E.jpg', 'https://www.dha.ac.cn/info/1019/8052.htm', '敦煌研究院 · 原文配图'),
 ('exhibition', '敦煌展陈', 'https://www.dha.ac.cn/images/jianzhuzhantitu.jpg', 'https://www.dha.ac.cn/clzl.htm', '敦煌研究院 · 展览主题配图'),
 ('mogao-exterior', '莫高窟景观', 'https://cdn.e-dunhuang.com/images/11.jpg', 'https://www.e-dunhuang.com/', '数字敦煌 · 主题配图'),
]

def download(item):
 slug,title,url,page,credit=item
 request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':page})
 with urllib.request.urlopen(request,timeout=28) as response: raw=response.read()
 with Image.open(io.BytesIO(raw)) as source:
  image=ImageOps.exif_transpose(source).convert('RGB')
  original=image.size
  image.thumbnail((1400,1200))
  image.save(DEST/(slug+'.webp'),quality=86,method=6)
 return {'file':slug+'.webp','title':title,'source':page,'imageUrl':url,'credit':credit,'originalSize':original,'size':image.size,'retrieved':'2026-11-18','usage':'课程项目配图；权利归原作者，公开使用前需核实授权。'}

if __name__ == '__main__':
 DEST.mkdir(parents=True,exist_ok=True)
 results=[]
 with ThreadPoolExecutor(7) as pool:
  futures=[(item,pool.submit(download,item)) for item in ITEMS]
  for item,future in futures:
   try:
    result=future.result()
    results.append(result)
    print(item[0],result['originalSize'],result['size'])
   except Exception as error:print('FAILED',item[0],str(error))
 (DEST/'sources.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
