import os

# 获取当前文件夹路径
current_directory = os.getcwd()

# 列举所有文件
files = os.listdir(current_directory)

# 过滤出PNG文件并打印文件名
png_files = [file for file in files if file.endswith('.png')]

# 打印所有PNG文件名
for png_file in png_files:
    p = png_file.replace(".png", "")
    print(f"oryx/{p}")