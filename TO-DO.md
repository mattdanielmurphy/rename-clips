# To do

## Terminology
- *sample*: 5PITCH MELODIC, drumless master, has stems for it with the same id in /stems-zipped
- *stem*: single stem, in /stems
- *clips*: samples and stems

## Fix stem and sample ids
### The Problem
On S3:
- Stems are all from Session 2
- Samples are from *both* Session 1 and Session 2 (although there's 362 missing)
  
On sample generator site:
- pulls from list of uploaded clips, which are all from Session 1
  - but what it thinks is Session 1 is actually Session 2

Therefore,
- I must swap IDs **for stems** from Session 1 for Session 2
- because the Sample IDs are correct, but the stems are not
- then I must rename the stems

**One more issue**
- because the stems were overwritten but the samples and zipped stems were not, I cannot use the same IDs from Session 1 for Session 2, and I must store the alternate IDs for Session 1


**when someone downloads a *stem***
- ❌ the id for it is Session **1**, but the file is Session **2**

**when someone downloads a *sample***
- ✅ the id is Session **1**, the file is Session **1**
- I BELIEVE THE ABOVE IS WRONG

**when someone downloads a *zip of stems***
- ✅ the id for the zip is Session **1**, the file is Session **1**
- ✅ the id for the stems is Session **1**, and the file is Session **1**
session 2 did not overwrite session 1 files here because ~~Sample IDs are unique across sessions~~ this is not true, because while the IDs are unique across sessions, it was still reading from the session 1 data...
However, the session 2 zips have session 1 IDs inside them

### What to do
Store Session 1 stem IDs as an alt ID for Session 2, and create new stem IDs for Session 1

**session 2 IDs have never been used**
**some session 1 IDs are now alt-IDs for session 2 stems**

#### Steps to complete
1. ~~modify samples.json, adding alt IDs to Session 2 and creating new stem IDs for Session 1~~
   1. ~~for each sample,~~
      1. ~~for each stem~~
         1. ~~get ID and insert that in the sample that is +1000 from that sample~~
   2. ~~to create new IDs, use an `overallIndex + 1` of the last Sample ID~~
2. Reupload stems for Session 1 and Session 2, Session 1 having new IDs and Session 2 having original IDs.
   - Luckily, the one Session files backup I made was for Session 2, so I don't need to re-render or unzip
   1. **upload Session 1 stems with new IDs**
   2. **rename ids for Session 2 stems**
3. **Reupload stems and zipped-stems of Session 2 with the new stem IDs (Sample IDs remain the same so will just replace the old files on S3)**
   3 TASKS ABOVE ARE IN PROGRESS ^

4. get list of uploaded stems and sessions and replace the current one on the site


5. **not a priority because nobody will see them or download them:** delete zipped-stems and zipped-stems without BPMs on s3 (theyre last alphabetically, just go to page 4 or 5, select, and delete manually on s3 console website) because they wont be replaced with the new ones
   - I wouldn't have to worry about figuring out which bpm-less stems and samples to delete if I know for sure that they're all Session 1.

Alright. Investigating with session files in Ableton:
- audio in zipped-stem *does not* match session 1 audio for their IDs *-- checked with two files*
- audio in stem *does* match session 1 audio for its ID *-- checked with two files*


Therefore, I can continue as I was
  - Session 1 IDs must be replaced with new ones so they stop conflicting with alt-IDs for session 2
  - Session 2 IDs can remain as they were
  - Session 2 FILES must be reuploaded with proper Session 2 IDs
    - Session 2 zipped stems and samples *✅ DONE*
    - Session 2 stems



Right now if someone wants to clear a stem, their ID could correspond to two different samples, for Session 1 and Session 2. Few people have used it so far, so I want to resolve that disparity as soon as possible.

Want to avoid rezipping... I just need to keep Session 1 IDs for both the stems and the samples, but add an alternate ID for the Session 2 stems *that people could have downloaded (are in `uploaded.json`)*, just in case anyone has downloaded one and wants to use it.

So need to reupload stems for Session 1, keeping their original IDs (which are now also alternates for some Session 2 stems).

Not a huge deal, just need to be aware that in rare instances the ID of the sample will be incorrect. So: if the creation date of the stem is Mar 18, it's correct. Otherwise, it might not be.

Alright well there's nothing I can do about the overlap, I just need to get this fixed ASAP so it's as rare as possible that this comes up.

Each stem will become:
```json 
{
  "id": "9b",
  "altId": "G1",   // NEW ADDITION, ALT ID for Session 1 stems only
  "name": "G.A.B Main",
  "trackIndex": 0
},
```

## Fix API Problem
- api routes don't work on preview deployments
- thought perhaps I'd add an env var to manually specify the route (instead of just `/api...`, make it `ghostsamples.io/api...`); the problem with that is that CORS is disabled. I can enable it, but then I'd have to remember to redisable it after testing
- **possible solution** is to clone the project and have it deploy *main* on a separate testing domain
  - to pull changes from test repo: `git pull <git_url> <branch> --allow-unrelated-histories`
  - alternatively just add a remote: `git remote add working-repo https://location/of/working-repo.git` and pull changes with `git pull working-repo`

## Improvements

- **add loading icon for waveplayer**
- **get type of stem/sample based on Tyler's weighting**
  - odds of getting each one:
    - 0.4 - Samples (5pitch)
    - 0.2 - Drums
    - 0.2 - Main
    - 0.1 - Mel
    - 0.1 - perc
- record history of download with date and sample id
- **MP3 versions for quicker streaming to waveplayer**
  - convert all samples to mp3 and upload to s3: 'samples-mp3'
- dark mode
- remove second spinner when signing in (two diff spinners look weird)

### All Ghost Sites -> AWS
- create multi-region access point for faster access


## Uploading of Samples
(below, *uploading* = **renaming, zipping, and uploading**)

- 1000 needs to be uploaded. Must be an off-by-1 error with condition of for-loop... that's not the error...
- 1001-2000 is currently being uploaded

- currently uploading remaining renamed stems from session 1