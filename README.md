# DGeneration-X

DGeneration-X is a document generator for JavaScript source code files.

Basically it reads in JavaScript source code files and creates HTML documentation for them based on the [JsDocs](https://jsdoc.app) that they contain.

DGeneration-X was initially created to generate documentation for [LittleJS](https://github.com/KilledByAPixel/LittleJS), but is now to be used for generating documentation for my own personal projects. I have made it available to the public on the off chance that somebody might find it of use.


There is a [live example](https://antixdevelopment.com/littlejs/docs) of generated documentation that you can checkout.


## What's New?

v1.0.0 (24 Oct 2023)

- Initial public release.

## Features

DGeneration-X Includes a basic "good enough for me" CSS style editor which provides functionality to tweak the layout of the content it generates. It currently does not support color theme editing.

DGeneration-X generated HTML documentation features light and dark color themes. The user preference will be persisted to local storage.

DGeneration-X probably contains other features that some more picky people might consider bugs. If you find one then please raise an issue and I'll try to resolve it :)

## Caveats

There will certainly exist more robust, comprehensive, and efficient methods to generate such documentation, but at the time I was really having fun dissecting and parsing text files, so I just kind of made it.

DGeneration-X is fussy. It really doesn't take kindly to badly formatted source code (or what it considers to be badly formatted source code). If your output looks a bit like digital vomit, then DGeneration-X probably didn't appreciate the spaghetti code you fed it.

DGeneration-X recognizes and parses ONLY the following JsDoc tags...

&emsp; `@namespace` 

&emsp; `@memberof`

&emsp; `@type`

&emsp; `@default`

&emsp; `@param` 

&emsp; `@return`

&emsp; `@returns`

Other JsDoc tags should be ignored but could possibly cause unexpected behavior :D

DGeneration-X has been tested working in FireFox and Chrome on Windows 10. I am unable to test on other Operating Systems and really CBF testing in other weird browsers, sorry :)

## How To Use

The `dgenerationx.json` file contains all of the information required for DGeneration-X to generate your HTML documentation.

```
{
  "projectName": "LittleJS",
  "projectTag": "The Tiny Javascript Engine That Can",
  "projectURL": "https://killedbyapixel.github.io/LittleJS/",
  "projectRepositoryURL": "https://github.com/KilledByAPixel/LittleJS/",
  "authorName": "Frank Force",
  "authorURL": "https://frankforce.com/",
  "filePath": "js/",
  "fileNames": [
    "engine", 
    "engineAudio", 
    "engineDebug", 
    "engineDraw", 
    "engineExport", 
    "engineInput", 
    "engineMedals", 
    "engineObject", 
    "engineParticles", 
    "engineSettings", 
    "engineTileLayer", 
    "engineUtilities", 
    "engineWebGL"
  ],
  "displayDebugInfo": false,
  "displayWorklog": false
}
```

It should be apparent what each entry is for, except for the last two, which you probably don;t need to mess with.

Once you have edited the file to suit your project, just open "degerationx.html" file with your web browser and everything will be magically generated.

If everything went well then you can fiddle about with the CSS styling a bit before clicking the export button to export your documentation as a single file.

If everything turned to custard then maybe your JavaScript files had some bad formatting or something. I dunno, it works for my test project (LittleJS) perfectly :D

## How Does It Work?

Once a JavaScript file is loaded:

1. A bunch of troublesome strings get removed, then it is split into parts using the JsDoc start identifier ("/**") as the delimiter, resulting in an array of JsDocs.

2. Each JsDoc is then has any code after it discarded, except for its first line of code which is a variable or function declaration.

3. Then the fun really begins and the JsDoc is parsed and all HTML content generated. It's a lot more complicated than that one sentence, but I CBF trying to explain it. I'll just point you in the rirection of my giant singleton of spaghetti code ;)

Once the JavaScript files have been processed and all of the HTML has been generated and appended to the document, DGeneration-X then does two more things...

1. Get the entire `outerHTML` of the document as a string, then split that into lines and process them one at a time, removing lines bounded by the tags "/* clip_start */" and "/* clip_end */" for the CSS style part of the file, and "&lt;!-- clip_start --&gt;" and "&lt;!-- clip_end --&gt;" for the HTML part of the file. It also trims whitespace, single line comments, and blank lines. It will also inject some CSS styles into the ":root" style as well.

2. Load the "dgenerationx.js" file as a string, and processing it in a similar manner to the HTML string, which removes ALL portions of the code that are related to generation, leaving only the parts of the code required for it to behave as a document reader.

3. Stitch the results back together, inserting some extra strings along the way where required.

That final string can then be saved as a single line file containing all HTML/CSS/JavaScript, and which has been minified as much as possible without leveraging a 3rd party "thing" like Terser or Closure Compiler.

## Thanks

Thanks for checking out DGeneration-X, the coolest dumb documentation generator ever!

If you end up using DGeneration-X, please let me know, and maybe you would also consider [buying me a coffee](https://www.buymeacoffee.com/antixdevelu) :)
