import json
import os

input_path = os.path.join(os.getcwd(), "data", "pincode.json")
output_path = os.path.join(os.getcwd(), "data", "pincode_map.json")

try:
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()
        if not content:
            print("Input file is empty.")
            exit()
        data = json.loads(content)

    records = data.get("records", [])
    if not records:
        if isinstance(data, list):
            print(
                "Input file appears to be in an unexpected format (already a list). No changes made."
            )
            exit()
        else:
            print(
                "No 'records' found in the JSON data. Writing an empty list to new file."
            )
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump([], f)
            exit()

    new_records_map = {}
    for record in records:
        pincode = record.get("pincode")
        if pincode:
            new_records_map[pincode] = {
                "city": record.get("district"),
                "state": record.get("statename"),
            }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(new_records_map, f, indent=2)

    print(
        f"Successfully processed {len(records)} records into {len(new_records_map)} unique pincode entries."
    )
    print(f"Cleaned data saved to: {output_path}")

except json.JSONDecodeError:
    print(
        "Error: Could not decode JSON. The file might be corrupted or not in the expected format."
    )
except FileNotFoundError:
    print(f"Error: The file was not found at {input_path}")
except Exception as e:
    print(f"An error occurred: {e}")
