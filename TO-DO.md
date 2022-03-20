# To do

## Critical Bugs
- waveplayer does not load until Generate button is pressed again
  - **investigation**:
    - try using url in file instead of using one passed in via props
- waveplayer is playing file that does not correlate with what is downloaded

I believe the above two bugs might just be very related: perhaps the waveplayer is playing the previous url, and since the first time there is no previous url, it doesn't load.
The problem is I don't at all see the mechanism by which that's possible.
