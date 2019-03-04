# raptor-gui

This is a gui for `https://github.com/falconre/raptor-api`.

Use the raptor-api client to upload a binary to raptor-api.


## Step 1
```
cd raptor-api
cargo run --release
```

## Step 2

```
cd raptor-api/client
python client.py some-name /path/to/binary
```

You will need the python requests package.

Wait for this script to return, which will happen when raptor-api is done analyzing the binary.

## Step 3

```
cd raptor-gui
open index.html
```