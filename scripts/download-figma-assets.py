"""Download only the original URLs supplied in captured Figma design contexts."""
import re, pathlib, subprocess, concurrent.futures, json
root = pathlib.Path(__file__).resolve().parents[1]
entries = []
for source in (root/'docs/design/source').glob('*.txt'):
    for name,url in re.findall(r'const (img\w+) = "(https://www.figma.com/api/mcp/asset/[^\"]+)";',source.read_text()):
        path = 'public/assets/figma/'+source.stem+'-'+name[3:]+pathlib.Path(url).suffix
        entries.append(dict(section=source.stem,constant=name,path=path,url=url))
def download(e):
    subprocess.run(['curl','-fsSL','--retry','2','-o',str(root/e['path']),e['url']],check=True)
    assert (root/e['path']).stat().st_size
    return e['path']
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for p in pool.map(download,entries): print(p)
(root/'docs/design/asset-manifest.json').write_text(json.dumps([{k:v for k,v in e.items() if k!='url'} for e in entries],indent=2)+'\n')
