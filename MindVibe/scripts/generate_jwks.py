#!/usr/bin/env python3
import json, os, argparse
def load_public_keys(input_dir):
    keys=[]
    if not os.path.isdir(input_dir):
        return keys
    for fname in os.listdir(input_dir):
        if not fname.endswith("-pub.json"): continue
        try:
            with open(os.path.join(input_dir,fname),"r",encoding="utf-8") as fh:
                data=json.load(fh)
                if isinstance(data,dict): keys.append(data)
        except Exception as e:
            print(f"Skipping {fname}: {e}")
    return keys
def write_jwks(keys,output_file):
    os.makedirs(os.path.dirname(output_file),exist_ok=True)
    with open(output_file,"w",encoding="utf-8") as fh:
        json.dump({"keys":keys},fh,indent=2)
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--input-dir",default="keyset_eddsa")
    p.add_argument("--output-file",default="static/.well-known/jwks.json")
    args=p.parse_args()
    keys=load_public_keys(args.input_dir)
    write_jwks(keys,args.output_file)
