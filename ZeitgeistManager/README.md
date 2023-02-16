### Video Timestamps

[Youtube Link](https://youtu.be/gMp3x6y8VZc)

1. 00:00 - 00:40 navigate to zeitgeist sdk
2. 00:40 - 03:50 setup zeitgeist sdk & enjoy my bonbon
3. 03:50 - 04:45 create index write hello world
4. 04:45 - ??:?? try to log out something, try blockinfo  
5. 06:15 - ??:?? swtich to sdk
6. 07:15 - ??:?? first bug
7. 07:35 - ??:?? fix bug, with type module declartion
8. 07:50 - ??:?? new bug, try log Sdk, see what happens
10. 9:35 - ??:?? slidling thruh the code and search for sdk
11. 9:55 - ??:?? found sdk,
12. 10:55 - ??:?? hurrreei i got something loged out
13. 11:05 - 13:14 try to use intitalise but yeah no clue

### My steps:

1. `mkdir ztg` 
2. `cd zgt`
3. `npm init -y`
4. `npm i @zeitgeistpm/sdk`
5. `cat package.json`
6. `node --version`  --> version 18
7. `touch index.js`
8. `echo "console.log("Hello World") >> index.js`
9. `node index.js` --> Hello World

10. `echo 'import SDK from "@zeitgeistpm/sdk"' > index.js`
11. `node index.js` --> error
12. add `"type":"module"` in package.json
13. `node index.js` --> doesnt work
14. `echo 'import {sdk} from "@zeitgeistpm/sdk"' > index.js`
15. `echo "console.log(${sdk})" >> index.js`
16. `node index.js` --> Hurei, a respondse  `[Function: sdk]`
17. try finding initialize() somwhere
16. ... continue to find initialize() in sdk.
17. make a video, write steps down, ask jorn. 
18. grab a coffee ☕


