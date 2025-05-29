import json

with open("output.json") as f:
    data = json.load(f)

latex = data["elements"][6]["text"]  # get the right element
latex_2 = data["elements"][3]["text"]
latex_clean = latex.replace('\\\\\\\\', '\\\\')  # Convert 4 backslashes to 2 backslashes
latex_clean_2 = latex_2.replace('\\\\\\\\', '\\\\')

print(latex_clean)
print(latex_clean_2)

