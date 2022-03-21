# To do

## Critical Bugs
- waveplayer does not load until Generate button is pressed again
  - **investigation**:
    - try using url in file instead of using one passed in via props
- waveplayer is playing file that does not correlate with what is downloaded

I believe the above two bugs might just be very related: perhaps the waveplayer is playing the previous url, and since the first time there is no previous url, it doesn't load.
The problem is I don't at all see the mechanism by which that's possible.

## MP3 versions for quicker streaming to waveplayer
- convert all samples to mp3 and upload to s3: 'samples-mp3'


## Uploading of Samples
(below, *uploading* = **renaming, zipping, and uploading**)

- 1000 needs to be uploaded. Must be an off-by-1 error with condition of for-loop... that's not the error...
- 1001-2000 is currently being uploaded

- currently uploading remaining renamed stems from session 1