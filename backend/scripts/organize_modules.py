import shutil
import os

root = r"E:\Nirikshak\frontend"
src_gov = os.path.join(root, "government", "src")
src_con = os.path.join(root, "contractor", "src")
src_usr = os.path.join(root, "user", "src")

dst_gov = os.path.join(root, "src", "modules", "government")
dst_con = os.path.join(root, "src", "modules", "contractor")
dst_usr = os.path.join(root, "src", "modules", "user")

for src, dst, name in [(src_gov, dst_gov, "government"), (src_con, dst_con, "contractor"), (src_usr, dst_usr, "user")]:
    if os.path.exists(src):
        os.makedirs(dst, exist_ok=True)
        shutil.copytree(src, dst, dirs_exist_ok=True)
        print(f"Copied {name} src to {dst}")

# Also copy public assets (logos, images, etc.) from government/public and user/public to frontend/public
pub_gov = os.path.join(root, "government", "public")
pub_usr = os.path.join(root, "user", "public")
pub_con = os.path.join(root, "contractor", "public")
dst_pub = os.path.join(root, "public")
os.makedirs(dst_pub, exist_ok=True)

for p in [pub_gov, pub_usr, pub_con]:
    if os.path.exists(p):
        shutil.copytree(p, dst_pub, dirs_exist_ok=True)
        print(f"Copied public assets from {p} to {dst_pub}")
