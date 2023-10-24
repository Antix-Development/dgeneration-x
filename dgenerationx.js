
// 
// DGeneration-X - A Javascript documentation generator.
// 
// Copyright (c) 2023 Cliff Earl.
// 
// MIT License:
// 

// const 
// // Project details.
// projectName = 'LittleJS';

/* clip_start */

// Project details.
// const 
// projectURL = 'https://killedbyapixel.github.io/LittleJS/',
// projectRepositoryURL = 'https://github.com/KilledByAPixel/LittleJS/',

// Author details.
// authorName = 'Frank Force',
// authorURL = 'https://frankforce.com/';

const 

// Create a new HTML element with the given type.
createElement = (type) => document.createElement(type),

// Append the given child HTML element to the given parent HTML element.
appendChild = (parent, child) => parent.appendChild(child),

// Output the given text to the developer console.
log = (t) => {
  console.log(t);
  worklog.push(`${t}\n`);
},

// Output the given text to the developer console as a warning.
warn = (t) => {
  console.warn(t);
  worklog.push(`${t}\n`);
}

// Initialize performance timing.
resetPerf = () => perfStart = performance.now(),

// Dump performance timing to console prepended by the given text.
showPerf = (t) => log(`${t} in ${(performance.now() - perfStart).toFixed(4)}ms.`),

// #region - File operations.
 
// Load the text file from the given url.
loadTextFile = async (uri) => {

  try {
    const response = await fetch(uri);
    const data = await response.text();
    return data;
    
  } catch (e) {
    console.warn(`loadTextFile() ${e.message}`);

  }

},

// Allow the user to browse for and select a local, then load the selected file as text.
// loadFile = async () => {
//   const fileHandle = await window.showOpenFilePicker();
//   const file = await fileHandle.getFile();
//   const contents = await file.text();
//   return contents;
// },

// Allow the user to browse for and select a local, then save the given data as a text file.
saveFile = async (content) => {

  const options = {
    types: [
      {
        description: "HTML file",
        accept: { "text/html": [".html"] },
      },
    ],
  };

  try {
    const fileHandle = await window.showSaveFilePicker(options);
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  
  } catch (e) {
    console.warn(`saveFile() ${e.message}`);

  }

};
//#endregion

// 
// JAVASCRIPT CODE PARSING AND HTML CONTENT GENERATION.
// 

//#region - Javascript code parsing.

let 
worklog = [], // Debugging only.

project,

targetStyleSheet,
targetRule,

adt,

docID,

mObject,
mNamespace,
mClass,

inClass,
inNamespace,

mComments = [],

jsDoc,
lines,

perfStart;

const 

mNamespaces = [],
mClasses = [],

mOrphanedDocs = [],
mOrphanedMembers = [],
mOrphanedMethods = [],

// Create a new object that will be used to represent a namespace, class, member, or method. The resulting object will be merged with the given source object.
newObject = (source = {}) => Object.assign({
  id: docID, // Common.
  kind: '',
  name: '',
  description: '',

  isNamespace: false, // Namespace.
  isComment: false, // Namespace.
  isMember: false, // Namespace.
  isClass: false, // Class.
  
  isMethod: false, // Method.
  isParameter: false, // Method.
  isConstructor: false, // Method.
  isReturn: false, // Method.
  isOptional: false, // Parameter.

  extends: '',

  memberOf: '', // Member / Method.
  default: '', // Member.
  syntax: '', // Method.
  example: '', // Method.

  comments: [], // Namespace.

  members: [], // Member.

  methods: [], // Method.
  parameters: [],
  returns: [],

}, source),

// Generate debug information about the given  object, and display it in the `content` pane.
displayObject = (object) => {
  const 
  content = createElement('div'), // Container that will be appended to the `content pane.
  container = createElement('div'), // Clickable container that toggles visibility of its self.
  title = createElement('label'), // Clickable label that toggles visibility of 'container.

  // Append a new key/value pair to 'container' with the given key, value, and CSS class.
  append = (key, value, _class = '') => {
    // Create HTML elements.
    const 
    objectContainer = createElement('div'),
    keyElement = createElement('span'),
    valueElement = createElement('span'),
    commaElement = createElement('span');

    // Set CSS styles.
    keyElement.classList.add('jsdoc-key'),
    commaElement.classList.add('jsdoc-comma');
    valueElement.classList.add('jsdoc-value');
    if (_class != '') valueElement.classList.add(_class);

    // Set innerHTML.
    commaElement.innerHTML = ',';
    keyElement.innerHTML = `${key}:&nbsp;`;
    valueElement.innerHTML = value;

    // Append in order and display in the `content` pane.
    appendChild(objectContainer, keyElement);
    appendChild(objectContainer, valueElement);
    appendChild(valueElement, commaElement);
    appendChild(container, objectContainer);
  };

  container.classList.add('hidden', 'jsdoc-container');
  content.classList.add('jsdoc-display');
  title.innerHTML = `${object.id}. (${object.kind})`;
  const objectKindClass = (object.isNamespace) ? 'jsdoc-namespace' :  (object.isClass) ? 'jsdoc-class' :  (object.isMethod) ? 'jsdoc-method' : 'jsdoc-member';

  title.classList.add('jsdoc-title', objectKindClass);
  title.onclick = () => container.classList.toggle('hidden');
  container.onclick = () => container.classList.toggle('hidden');
  
  appendChild(content, title);
  appendChild(content, container);
  appendChild(contentPane, content);

  for (const key in object) {
    let value = object[key];
    switch (typeof value) {
      case 'string':
        if (value != '') {

          if (object.isComment) {
            append(key, `/*<br>${value}<br>*/`, 'jsdoc-comment');// appendString(`${key}: ${object[key]}`);

          } else {
            append(key, `${'`'}${value}${'`'}`, 'jsdoc-string');// appendString(`${key}: ${object[key]}`);

          }
        }
        break;

      case 'number':
        append(key, value, 'jsdoc-number');// appendString(`${key}: ${object[key]}`);
        break;
        
      case 'boolean':
        if (value) append(key, value, 'jsdoc-boolean');//  appendString(`${key}: ${object[key]}`);
        break;
        
      case 'object':
        if (object.isMethod && value.length > 0) append(key, `[${value.length}]`, 'jsdoc-array');//  appendString(`${key}: ${object[key]}`);
        break;
    
      default:
        warn(`displayObject() unknown type (${typeof value})`);
        break;
    } // Typeof switch.

  } // Process objects loop.
},

// Determine if the given array of lines contains comment information.
isComment = (lines) => (lines[lines.length - 1] === '@@'),

// Determine if the given array of lines contains namespace information.
isNamespace = (lines) => {
  for (const line of lines) {
    if (line.indexOf('@namespace') === 0) return true;
  }
  return false;
},

// Determine if the given array of lines contains class information.
isClass = (lines) => {
  for (const line of lines) {
    if (line.indexOf('class ') === 0) return true;
  }
  return false;
},

// Determine if the given array of lines contains member information.
isMember = (lines) => {
  for (const line of lines) {
    if (line.indexOf('@memberof') === 0) return true;
  }
  return false;
},

// Determine if the given array of lines contains method information.
isMethod = (lines) => {
  for (const line of lines) {
    if (line.indexOf('function ') === 0) return true;
    if (line.indexOf('@param') === 0) return true;
    if (line.indexOf('@return') === 0) return true;
    if (line.indexOf('=>') >= 0) return true;
    if (line.indexOf('()') >= 0 && line.indexOf('() ') === -1 && line.indexOf('@default') === -1 ) return true; // This is a bit sketchy (checking for ""() " in the doc to differentiate between functions and readme's").
  }
  return false;
},

// Close the current class by adding it to the `mClasses` array.
closeOpenClass = () => {
  mClasses.push(mClass);
  inClass = false;
},

// We assume that each source code file contains a single @namespace declaration.
createNewNamespace = (lines) => {

  if (inNamespace) { // Check for nested namespaces.

    // 
    // Nested namespaces are a nasty occurrence (IMHO) but we need to manage them as best as we are able to.
    // Our "best effort" is to hastily create a new namespace for the nested one and add it to the `mNamespaces` array.
    // 

    // warn(`>>>>> encountered a nested namespace. creating extra namespace." <<<<<`);

    const temp = newObject({isNamespace: true, kind: 'namespace'});

    let skipRemaining;

    for (const line of lines) {

      if (line.indexOf('@namespace') === 0) {
        //log(`namespace tag..`);
        temp.name = line.slice(line.indexOf('@namespace ') + '@namespace '.length);
        
      } else if (line.indexOf('@example') === 0) {
          //log(`example tag..`);
          skipRemaining = true;

      } else if (!skipRemaining) {

        if (line.indexOf('@') === 0) {
          //log(`unknown tag "${line}"..`);
  
        } else {
          //log(`description fragment..`);
          temp.description += `${line}<br>`;
        }
      }
  
    } // Line loop.

    mNamespaces.push(temp);

    //log('mNamespace{}');
    //log(mNamespace);
    return;

  } // Nested namespace check.


  //log(`initializeNamespace()`);

  mNamespace = newObject({isNamespace: true, kind: 'namespace'});

  let skipRemaining;

  for (const line of lines) {

    if (line.indexOf('@namespace') === 0) {
      //log(`namespace tag..`);
      mNamespace.name = line.slice(line.indexOf('@namespace ') + '@namespace '.length);
      
    } else if (line.indexOf('@example') === 0) {
      //log(`example tag..`);
      // break;
      skipRemaining = true;
      
    } else if (!skipRemaining) {

      if (line.indexOf('@') === 0) {
        //log(`unknown tag "${line}"..`);

      } else {
        //log(`description fragment..`);
        mNamespace.description += `${line}<br>`;

      }
    }

  } // Line loop.

  inNamespace = true;

  //log('mNamespace{}');
  //log(mNamespace);
},

// Close open class and add it to the `mClasses` array, then create and initialize a new class.
createNewClass = (lines) => {
  //log(`createNewClass()`);

  mObject.kind = 'class';

  if (inClass)  mClasses.push(mClass); // Close and add to `mClasses` array if already open.

  mClass = newObject({isClass: true, kind: 'class'});

  inClass = true;

  const name = lines.pop().replace('class ', '');

  if (name.indexOf(' extends ') != -1) {
    mClass.extends = name.slice(name.indexOf(' extends ') + ' extends '.length);
    mClass.name = name.slice(0, name.indexOf(' '));

  } else {
    mClass.name = name;

  }

  for (let line of lines) {

    if (line.indexOf('@example') != -1) {
      //log(`found example.. skipping remaining lines..`);
      break;

    } else if (line.indexOf('@') === 0) {
        //log(`unknown tag "${line}"..`);
  
    } else {
      if (line.indexOf('$') === 0) line = ` - ${line.slice(1)}`;
      
      if (line.indexOf('$') != -1) line = line.replace(/\$/g, '- ')

      //log(`description fragment..`);
      mClass.description += `${line}<br>`;

    }

  } // Line loop.

  //log('mClass{}');
  //log(mClass);
},

// Create and initialize a new method.
createNewMethod = (lines) => {
  //log(`createNewMethod()`);

  mObject.kind = 'method';

  let declaration = lines.pop();

  // log(`declaration: ${declaration}`);

  if (declaration.indexOf('this.') === 0) return; // Fix for edge case where properties might be interpretted as methods, when inside a class.

  if (declaration.indexOf('constructor') === 0) {
    //log(`class constructor..`);
    mObject.name = 'constructor';

  } else if (declaration.indexOf('()') + 2 === declaration.length) {
    //log(`class method declaration..`);
    mObject.name = declaration.slice(0, declaration.indexOf('()'));

  } else if (declaration.indexOf('function ') === 0) {
    //log(`function declaration..`);
    mObject.name = declaration.substring(declaration.indexOf(' ') + 1, declaration.indexOf('('));

  } else if (declaration.indexOf('const ') === 0 || declaration.indexOf('let ') === 0) {
    //log(`const function declaration..`);
    mObject.name = declaration.substring(declaration.indexOf(' ') + 1, declaration.indexOf('=') - 1);

  } else if (inClass) {
    //log(`class function declaration..`);
    mObject.name = declaration.slice(0, declaration.indexOf('('));
  }

  let skippingExample;

  for (let line of lines) {

    if (line.indexOf('@param') === 0) {
      //log(`parameter..`);
      //log(`${line}`);

      const mParameter = newObject({isParameter: true});

      // Check for and get description.
      if (line.indexOf('$') != -1) {
        mParameter.description = line.slice(line.indexOf('$') + 1);

        line = line.slice(0, line.indexOf('$')); // Truncate line so it no longer contains the description.
      }

      mParameter.kind = line.substring(line.indexOf('{') + 1, line.indexOf('}'));

      line = line.replace(/ /g, ''); // Strip whitespace to ease procssing.

      const defaultValueIndex = line.indexOf('=');

      if (line.indexOf('[') != -1) {
        mParameter.isOptional = true;

        if (defaultValueIndex != -1) {
          //log('    parameter IS optional AND has default.');
          mParameter.name = line.substring(line.indexOf('[') + 1, defaultValueIndex);
          mParameter.default = line.substring(line.indexOf('=') + 1, line.indexOf(']'));

        } else {
          //log('    parameter IS optional.');
          mParameter.name = line.substring(line.indexOf('[') + 1, line.indexOf(']'));

        }

      } else {
        //log(`parameter is NOT optional.`)
        mParameter.name = line.slice(line.indexOf('}') + 1);
      }

      mObject.parameters.push(mParameter);

    } else if (line.indexOf('@return') === 0) {
      //log(`return..`);

      const mReturn = newObject({isReturn: true});
      mReturn.kind = line.substring(line.indexOf('{') + 1, line.indexOf('}'))
      mObject.returns.push(mReturn);

    } else if (line.indexOf('@memberof ') === 0) {
      //log(`memberof..`);
      mObject.memberOf = line.slice(line.indexOf(' ') + 1);

    } else if (line.indexOf('@example') === 0) {
      //log(`example..`);
      skippingExample = true;

    } else {

      if (line.indexOf('@') === 0) {
        //log(`unknown tag "${line}"..`);
  
      } else {
        if (skippingExample) {
          //log(`skipping example..`)
          
        } else {

          if (line.indexOf('$') === 0) line = ` - ${line.slice(1)}`;

          //log(`description fragment..`);
          mObject.description += `${line}<br>`;
  
        }

      }
  
    }

  } // Line loop.

  if (inClass) {
    mClass.methods.push(mObject);

  } else {
    if (mNamespace) {

      if (mObject.memberOf != '' && mNamespace.name != mObject.memberOf) { // Is the method a method of `mNamespace`?
        mOrphanedMethods.push(mObject); // If no then it belings to a nested napespace that might not exist yet. In this case, orphan it and it will be relocated to the correct namespace later.

      } else { // Method is a method of `mNamespace`.
        mNamespace.methods.push(mObject);

      }

    } else {
      mOrphanedMethods.push(mObject);

    }
  
  }

  if (inClass && mObject.isMember) closeOpenClass(); // If currently in a class but a member method is encountered, then we left the class, so close it.

  //log(`mObject{}`);
  //log(mObject);
},

// Create and initialize a new member.
createNewMember = (lines) => {
  //log(`createNewMember()`);

  mObject.kind = 'member';

  const declaration = lines.pop();

  mObject.name = declaration.substring(declaration.indexOf(' ') + 1, (declaration.indexOf('=') === -1) ? declaration.indexOf(';') : declaration.indexOf('=') - 1);

  for (let line of lines) {

    if (line.indexOf('@default ') === 0) {

      //log(`default tag..`);
      let value = line.slice(line.indexOf('@default ') + '@default '.length);
      mObject.default = (isNaN(value)) ? value : value * 1;

      
    } else if (line.indexOf('@memberof ') === 0) {
      //log(`memberof..`);
      mObject.memberOf = line.slice(line.indexOf(' ') + 1);

    } else {

      if (line.indexOf('@') === 0) {
        //log(`unknown tag "${line}"..`);
  
      } else {

        if (line.indexOf('$') === 0) line = ` - ${line.slice(1)}`;

        //log(`description fragment..`);
        mObject.description += `${line}<br>`;
      }
  
    }

  } // Line loop.

  if (mNamespace) {
    mNamespace.members.push(mObject);
  } else {
    mOrphanedMembers.push(mObject);
  }
},

// Create and initialize a new comment.
createNewComment = (lines) => {
  //log(`createNewComment()`);

  mObject.kind = 'comment';

  for (const line of lines) {
    //log('comment line..')

    mObject.comment += `${line}<br>`;

  } // Line loop.

  mComments.push(mObject);
},

// Parse all .js files in the `filenames` array.
parseAllFiles = async () => {

    const // Strings to replace before parsing.
    replacements = [
      '\r',
      '<br>',
      '<b>',
      '</b>',
      "'use strict';"
    ];

    resetPerf();

    // #region - Process all javascript files.
    for (let i = 0; i < project.fileNames.length; i++) {

      // 
      // Read and parse a javascript source code file into objects that can be used to create HTML documentation.
      // 

      //log(`reading ${project.fileNames[i]}.js`);
      let input = await loadTextFile(`${project.filePath}/${project.fileNames[i]}.js`); // load next file.
  
      for (let j = 0; j < replacements.length; j++) input = input.replace(new RegExp(replacements[j], 'g'), ''); // Replace problematic strings.

      let jsDocs = input.split('/**'); // Split into jsDocs.
      //log(`found ${jsDocs.length} jsDocs:`);

      mComments = [];

      inNamespace = false;

      // Process all jsdocs that were identified in the js file.
      for (let i = 0; i < jsDocs.length; i++) {
        jsDoc = jsDocs[i];
  
        if (jsDoc.length === 0) continue; // Skip empty sections
  
        docID = i;

        jsDoc = jsDoc
        .replace(/ *\*\//g, '@@') // Replace all jsdoc terminators (*/) which are preceeded by any number of space characters, with "@@" for later identification.
        .replace(/ *\* */g, '') // Remove all asterix characters and all whitespace before and after them.
        .replace(/\//, '') // Remove extraneous division character.
        .trim(); // Remove leading and trailing whitespace.

        if (jsDoc.indexOf('@namespace') === -1) {
          jsDoc = jsDoc.replace(/ *- */g, ' $'); // Replace with string character for later identification.

          // Now we need to fix shit that got broken.

          jsDoc = jsDoc.replace(/= \$/g, '=-').replace(/\( \$/g, '(-');

        }

        let 
        pruningLines,
        tempLines = jsDoc.split(/\r|\n/); // Split into lines.

        lines = [];

        // #region - Preprocess lines.
        for (let j = 0; j < tempLines.length; j++) {
          let line = tempLines[j];

          if (line === '@example') pruningLines = true; // Begin pruning lines when this tag is encountered.

          if (!pruningLines) {

            if (line.indexOf('@@') > 0) { // Check where the terminator is not the entire content of the line.
              lines.push(line.slice(0, line.indexOf('@@')).trim()); //Isolate and add the part of the line that isn't the terminator, and add it to the lines array.
              line = '@@'; // Set line is a terminator.
              lines.push(line); // Add the new terminator to the lines array.

            } else {
              lines.push(line.trim());
            }

          } else {
            if (line.indexOf('@') === 0) pruningLines = false; // Stop pruning if we encounter another tag.
            lines.push(line);

          } // Pruning check.

          // Once we reach the terminator, add the very next line to the array as it will contain a function, variable, or class declaration.
          if (line === '@@') {
            if (j < tempLines.length - 1) {
              if (pruningLines) lines.push(tempLines[j]);
              lines.push(tempLines[j + 1].trim()); // Include the line directly after the terminator to the lines array.
            }
            break;
          }
        } // Preprocess lines loop.
        // #endregion

        // 
        // The lines array has been preprocessed. All code examples and extraneous javascript code have been removed.
        // 

        // Create a new object that will enableus to determine which type of processing will be needed for the current jsdoc.
        mObject = newObject({
          isComment: isComment(lines),
          isNamespace: isNamespace(lines),
          isClass: isClass(lines),
          isMember: isMember(lines),
          isMethod: isMethod(lines),
        });
        
        //log(`\n${''.padStart(200, '*')}\njsDoc ${i}(${jsDoc.length} bytes) (${lines.length} lines)`);
        //log(jsDoc.slice(0, 250));
        //log(lines);

        if (mObject.isNamespace) {
          createNewNamespace(lines);
          if (project.displayDebugInfo) displayObject(mNamespace);

        } else if (mObject.isComment) {
          createNewComment(lines);
          if (project.displayDebugInfo) displayObject(mObject);
  
        } else if (mObject.isClass) {
          createNewClass(lines);
          if (project.displayDebugInfo) displayObject(mClass);

        } else if (mObject.isMethod) {
          createNewMethod(lines);
          if (project.displayDebugInfo) displayObject(mObject);

        } else if (mObject.isMember) {
          createNewMember(lines);
          if (project.displayDebugInfo) displayObject(mObject);

        } else {
          //log(`docID:${docID} unable to categorize lines array`);
          mOrphanedDocs.push(lines);
        }
  
      } // jsDocs loop.

      if (mNamespace) {
        for (let k = 0; k < mComments.length; k++) mNamespace.comments.push(mComments[k]); // Copy all comments. Only first one will be used when generating documentation.
      }

      if (mNamespace) mNamespaces.push(mNamespace);

      mNamespace = null;

      inNamespace = false;
  
    } // Process files loop.
    // #endregion

    if (inClass) closeOpenClass(); // Close any open class.

    // 
    // All javascript files have now been read, and parsed into various arrays of objects.
    // 

    //log(`parsed ${mNamespaces.length} namespaces`);
    //log(mNamespaces);
  
    //log(`parsed ${mClasses.length} classes`);
    //log(mClasses);

    warn(`found ${mOrphanedDocs.length} orphaned documents`);
    //log(mOrphanedDocs);

    // 
    // Whilst parsing, some members and methods may be have been tagged as being a memberof another namespace that hasn't been parsed yet (doesn't exist).
    // During parsing, these members and methods will have been added to the 'mOrphanedMembers` and `mOrphanedMethods` arrays respectively.
    // Now that all namespaces have been identified, try to relocate the orphaned entities to the namespace they belong to.
    // 

    // #region - Relocate orphaned members and methods.
    //log(`found ${mOrphanedMethods.length} orphaned methods`);
    //log(mOrphanedMethods);

    //log(`found ${mOrphanedMembers.length} orphaned members`);
    //log(mOrphanedMembers);

    //log(`relocating orphaned members(${mOrphanedMembers.length}) and methods(${mOrphanedMethods.length})`);

    for (let j = 0; j < mNamespaces.length; j++) {
      const 
      mNamespace = mNamespaces[j],
      namespaceName = mNamespace.name;

      //log(`checking namespace ${mNamespace.name}`);

      // Relocate orphaned members.
      for (let k = mOrphanedMembers.length - 1; k >= 0; k--) {
        const mMember = mOrphanedMembers[k];
        if (mMember.memberOf === namespaceName) {
          //log(`relocated orphaned member "${mMember.name}" to namespace "${namespaceName}"..`);
          mNamespace.members.push(mMember);
          mOrphanedMembers.splice(k, 1);
        } // Member is member of namespace check.
      } // Orphaned members loop.

      // Relocate orphaned methods.
      for (let k = mOrphanedMethods.length - 1; k >= 0; k--) {
        const mMethod = mOrphanedMethods[k];
        if (mMethod.memberOf === namespaceName) {
          //log(`relocated orphaned method "${mMethod.name}" to namespace "${namespaceName}"..`);
          mNamespace.methods.push(mMethod);
          mOrphanedMethods.splice(k, 1);
        } // Method is member of namespace check.
      } // Orphaned methods loop.

    } // Namespace loop.

    if (mOrphanedMembers.length === 0 && mOrphanedMethods.length === 0) {
      log('\nall orphaned members and methods relocated');

    } else {

      // 
      // You really don't want to ever see the following warning :D
      // 

      warn(`\n${mOrphanedMembers.length} orphaned members and ${mOrphanedMethods.length} methods were unable to be relocated`);

      //log(mOrphanedMethods);
    }
    // #endregion

    // 
    // Before generating the final HTML, sort all arrays into a-z order.
    // 

    mNamespaces.sort((a, b) => (a.name > b.name) ? 1 : -1);
    for (let j = 0; j < mNamespaces.length; j++) mNamespaces[j].members.sort((a, b) => (a.name > b.name) ? 1 : -1);
    for (let j = 0; j < mNamespaces.length; j++) mNamespaces[j].methods.sort((a, b) => (a.name > b.name) ? 1 : -1);

    mClasses.sort((a, b) => (a.name > b.name) ? 1 : -1);
    for (let j = 0; j < mClasses.length; j++) mClasses[j].members.sort((a, b) => (a.name > b.name) ? 1 : -1);
    for (let j = 0; j < mClasses.length; j++) mClasses[j].methods.sort((a, b) => (a.name > b.name) ? 1 : -1);

    // 
    // This object encapsulates all of the data generated during parsing.
    // 

    adt = {
      description: 'This is the abstract data tree (adt)',
      namespaces : mNamespaces,
      classes: mClasses,
      orphanedDocs: mOrphanedDocs,
      ophanedMembers: mOrphanedMembers,
      orphanedMethods: mOrphanedMethods,
    };

    // Dump the adt to the console.
    //log('\nadt');
    //log(adt);

    if (project.displayWorklog) {
      let pre = createElement('pre');
      pre.innerHTML = worklog.join('');
      appendChild(contentPane, pre);
    }

    // 
    // Begin by generating the namespace containers which will be displayed in the navigation pane.
    // 

    // 
    // Generate HTML content for each namespace and it's associated members and methods.
    // 

    // #region - Generate namespace navigation containers.
    const 
    // Create elements.
    namespacesTitle = createElement('label'),
    allNamespaces = createElement('div');

    // Add CSS styles.
    namespacesTitle.classList.add('clickable-navigation-title');
    allNamespaces.classList.add('collapsable-navigation-container');

    // Set properties.
    namespacesTitle.innerHTML = 'Namespaces';
    namespacesTitle.onclick = () => namespacesTitle.nextElementSibling.classList.toggle('hidden');

    // Append to navigation pane.
    appendChild(navigationPane, namespacesTitle);
    appendChild(navigationPane, allNamespaces);
    // #endregion

    // #region - Create HTML content for each namespace.
    for (let i = 0; i < mNamespaces.length; i++) {
      const 
      _namespace = mNamespaces[i],

      // #region - Create title which when clicked, displays the appropriate content.
      // Create clickable title.
      namespaceTitle = createElement('label');
      namespaceTitle.classList.add('clickable-navigation-link');
      namespaceTitle.innerHTML = _namespace.name;
      namespaceTitle.id = `${_namespace.name}_title`;
      appendChild(allNamespaces, namespaceTitle);
  
      // Install click handler to display relevant content in content pane when title is clicked.
      namespaceTitle.onclick = () => {
        hideElementsWithClass('nonapi');
        // If there is already a selected namespace title, unselect it.
        if (selectedObject) {
          pagePositions[selectedObject.id] = contentPane.scrollTop;

          selectedObject.classList.toggle('hidden');
          selectedObjectTitle.classList.remove('selected');
        }

        // Display relevant content in content pane.
        const selectedObjectID = `${_namespace.name}_content`;

        selectedObject = getByID(selectedObjectID);
        selectedObject.classList.toggle('hidden');

        contentPane.scrollTop = (pagePositions[selectedObjectID]) ? pagePositions[selectedObjectID] : 0;

        // Set currently selected namespace title.
        selectedObjectTitle = getByID(`${_namespace.name}_title`);
        selectedObjectTitle.classList.add('selected');
      } // Namespace title click handler.
      // #endregion

      // #region - Generate content container, title, and description.
      const 
      // Create elements
      _namespaceDocument = createElement('div'),
      _namespaceHeader = createElement('div'),
      _namespaceTitle = createElement('h3'),
      _namespaceDescription = createElement('p');

      // Add CSS styles.
      _namespaceDocument.classList.add('document', 'hidden', 'api');
      _namespaceHeader.classList.add('document-header');
      _namespaceTitle.classList.add('document-title');
      _namespaceDescription.classList.add('document-description');

      // Set properties.
      _namespaceDocument.id = `${_namespace.name}_content`;
      _namespaceTitle.innerHTML = _namespace.name;
      _namespaceDescription.innerHTML = _namespace.description;
  
      appendChild(_namespaceHeader, _namespaceTitle);
      appendChild(_namespaceHeader, _namespaceDescription);
      appendChild(_namespaceDocument, _namespaceHeader);
      // #endregion

      // #region - Generate HTML content for namespace members.
      if (_namespace.members.length > 0) {
  
        const 
        // Create elements.
        section = createElement('div'),
        sectionTitle = createElement('h4');

        // Add CSS styles.
        section.classList.add('document-section');
        sectionTitle.classList.add('section-title');

        // Set properties.
        sectionTitle.innerHTML = 'Members';
  
        // Append to container.
        appendChild(section, sectionTitle);
        appendChild(_namespaceDocument, section);

        // Create html content for individual members.
        for (let j = 0; j < _namespace.members.length; j++) {
          const
          member = _namespace.members[j],

          // Create elements.
          block = createElement('div'),
          blockTitle = createElement('span'),
          blockBody = createElement('p');

          // Add CSS styles.
          block.classList.add('section-block');
          blockTitle.classList.add('block-title');
          blockBody.classList.add('block-body');
          
          // Set properties.
          defaultValueString = (member.default != '') ? `. Default value is ${member.default}` : '',

          blockTitle.innerHTML = member.name;

          blockBody.innerHTML = `${member.description.slice(0, member.description.length - 4)}${defaultValueString}.`;

          // Append to container.
          appendChild(block, blockTitle);
          appendChild(block, blockBody);
          appendChild(section, block);
  
        } // Generate namespace members loop
  
      } // Namespace members length check.
      // #endregion

      // #region - Generate content for namespace methods if required.
      if (_namespace.methods.length > 0) {

        const 
        // Create elements
        section = createElement('div'),
        sectionTitle = createElement('h4');

        // Add CSS styles.
        section.classList.add('document-section');
        sectionTitle.classList.add('section-title');

        // Set properties.
        sectionTitle.innerHTML = 'Methods';
  
        // Append to container.
        appendChild(section, sectionTitle);

        // Generate content for each method.
        for (let j = 0; j < _namespace.methods.length; j++) {
          const
          method = _namespace.methods[j],

          // Create elements.
          block = createElement('div'),
          blockTitle = createElement('label'),
          blockBody = createElement('div'),
          
          _hr = createElement('hr');
  
          // Add CSS styles.
          block.classList.add('section-block');
          blockTitle.classList.add('block-title');
          blockBody.classList.add('block-body');

          // Set properties.
          blockBody.innerHTML = `${method.description.slice(0, method.description.length - 4)}.<br>`;

          let 
          _allParametersContainer,
          _allReturnsContainer,

          syntaxString = `${method.name}(`;

          // Generate content for parameters if present.
          if (method.parameters.length > 0) {
            const 
            // Create elements;
            _allParametersTitle = createElement('label');
            _allParametersContainer = createElement('div');

            // Add CSS styles.
            _allParametersContainer.classList.add('parameters-return-container');
            _allParametersTitle.classList.add('parameters-return-title');

            // Set properties.
            _allParametersTitle.innerHTML = 'Parameters';

            // Append to container.
            appendChild(_allParametersContainer, _allParametersTitle);

            // Generate content for each parameter.
            for (let k = 0; k < method.parameters.length; k++) {
              const 
              _parameter = method.parameters[k],

              // Create elements.
              _parameterTitle = createElement('label');

              // Add CSS styles.
              _parameterTitle.classList.add('parameters-return-member');

              _defaultValueString = (_parameter.default != '') ? `. Default value is ${_parameter.default}` : '';

              // Set properties.
              if (_parameter.description === '') {
                _parameterTitle.innerHTML = `${_parameter.name} {${_parameter.kind}}${(_parameter.isOptional) ? ' (optional)' : ''}${_defaultValueString}.`;

              } else {
                _parameterTitle.innerHTML = `${_parameter.name} {${_parameter.kind}}${(_parameter.isOptional) ? ' (optional)' : ''} - ${_parameter.description}${_defaultValueString}.`;

              }

              // Append to container.
              appendChild(_allParametersContainer, _parameterTitle);

              syntaxString += `${_parameter.name}, `; // add to syntax string

            }
            
            syntaxString = `${syntaxString.slice(0, syntaxString.length - 2)})`;

          } else {
            syntaxString = `${syntaxString})<br>`;
          
          } // Method parameters length check.

          blockTitle.innerHTML = syntaxString;

          // Process return values if present.
          if (method.returns.length > 0) {

            // Create elements.
            const _allReturnsTitle = createElement('label');
            _allReturnsContainer = createElement('div');

            // Add CSS styles.
            _allReturnsContainer.classList.add('parameters-return-container');
            _allReturnsTitle.classList.add('parameters-return-title');

            // Set properties.
            _allReturnsTitle.innerHTML = 'Returns';

            // Append to container.
            appendChild(_allReturnsContainer, _allReturnsTitle);

            // Generate content for each return.
            for (let k = 0; k < method.returns.length; k++) {
              const 
              _return = method.returns[k];

              // Create elements.
              _returnTitle = createElement('label');

              // Add CSS styles.
              _returnTitle.classList.add('parameters-return-member')

              // Set properties.
              _returnTitle.innerHTML = `{${_return.kind}}`;

              // Append to container.
              appendChild(_allReturnsContainer, _returnTitle);
            }
            
          } // Method parameters length check.

          appendChild(block, blockTitle);
          appendChild(block, blockBody);

          if (_allParametersContainer) appendChild(block, _allParametersContainer);
          if (_allReturnsContainer) appendChild(block, _allReturnsContainer);

          appendChild(block, _hr);
          appendChild(section, block);
  
        } // Generate namespace methods loop
        appendChild(_namespaceDocument, section);
  
      } // Namespace methods length check.
      // #endregion

      appendChild(contentPane, _namespaceDocument); // Add newly generated content to content pane (right pane).
 
    } // Namespace loop.
    // #endregion

    // 
    // Repeat the above procedure to generate HTML documents for the classes.
    // 

    // #region - Generate class navigation containers.
    const 
    // Create elements.
    classesTitle = createElement('label'),
    allClasses = createElement('div');

    // Add CSS styles.
    classesTitle.classList.add('clickable-navigation-title');
    allClasses.classList.add('collapsable-navigation-container');

    // Set properties.
    classesTitle.innerHTML = 'Classes';
    classesTitle.onclick = () => classesTitle.nextElementSibling.classList.toggle('hidden');

    // Append to navigation pane.
    appendChild(navigationPane, classesTitle);
    appendChild(navigationPane, allClasses);
    // #endregion

    // #region - Create HTML content for each class.
    for (let i = 0; i < mClasses.length; i++) {
      const 
      _class = mClasses[i],

      // #region - Create title which when clicked, displays the appropriate content.
      // Create clickable title.
      classTitle = createElement('label');
      classTitle.classList.add('clickable-navigation-link');
      classTitle.innerHTML = _class.name;
      classTitle.id = `${_class.name}_title`;
      appendChild(allClasses, classTitle);
  
      // Install click handler to display relevant content in content pane when title is clicked.
      classTitle.onclick = () => {
        hideElementsWithClass('nonapi');
        // If there is already a selected class title, unselect it.
        if (selectedObject) {
          pagePositions[selectedObject.id] = contentPane.scrollTop;

          selectedObject.classList.toggle('hidden');
          selectedObjectTitle.classList.remove('selected');
        }

        // Display relevant content in content pane.
        const selectedObjectID = `${_class.name}_content`;

        selectedObject = getByID(selectedObjectID);
        selectedObject.classList.toggle('hidden');

        contentPane.scrollTop = (pagePositions[selectedObjectID]) ? pagePositions[selectedObjectID] : 0;

        // Set currently selected class title.
        selectedObjectTitle = getByID(`${_class.name}_title`);
        selectedObjectTitle.classList.add('selected');
      } // class title click handler.
      // #endregion

      // #region - Generate content container, title, and description.
      const 
      // Create elements
      _classDocument = createElement('div'),
      _classHeader = createElement('div'),
      _classTitle = createElement('h3'),
      _classDescription = createElement('p');

      // Add CSS styles.
      _classDocument.classList.add('document', 'hidden', 'api');
      _classHeader.classList.add('document-header');
      _classTitle.classList.add('document-title');
      _classDescription.classList.add('document-description');

      // Set properties.
      _classDocument.id = `${_class.name}_content`;
      _classTitle.innerHTML = _class.name;
      _classDescription.innerHTML = _class.description;
  
      appendChild(_classHeader, _classTitle);
      appendChild(_classHeader, _classDescription);
      appendChild(_classDocument, _classHeader);
      // #endregion

      // #region - Generate HTML content for class members.
      if (_class.members.length > 0) {
  
        const 
        // Create elements.
        section = createElement('div'),
        sectionTitle = createElement('h4');

        // Add CSS styles.
        section.classList.add('document-section');
        sectionTitle.classList.add('section-title');

        // Set properties.
        sectionTitle.innerHTML = 'Members';
  
        // Append to container.
        appendChild(section, sectionTitle);
        appendChild(_classDocument, section);

        // Create html content for individual members.
        for (let j = 0; j < _class.members.length; j++) {
          const
          member = _class.members[j],

          // Create elements.
          block = createElement('div'),
          blockTitle = createElement('span'),
          blockBody = createElement('p');

          // Add CSS styles.
          block.classList.add('section-block');
          blockTitle.classList.add('block-title');
          blockBody.classList.add('block-body');
          
          // Set properties.
          defaultValueString = (member.default != '') ? `. Default value is ${member.default}` : '',

          blockTitle.innerHTML = member.name;

          blockBody.innerHTML = `${member.description.slice(0, member.description.length - 4)}${defaultValueString}.`;

          // Append to container.
          appendChild(block, blockTitle);
          appendChild(block, blockBody);
          appendChild(section, block);
  
        } // Generate class members loop
  
      } // class members length check.
      // #endregion

      // #region  - Generate content for class methods if required.
      if (_class.methods.length > 0) {

        const 
        // Create elements
        section = createElement('div'),
        sectionTitle = createElement('h4');

        // Add CSS styles.
        section.classList.add('document-section');
        sectionTitle.classList.add('section-title');

        // Set properties.
        sectionTitle.innerHTML = 'Methods';
  
        // Append to container.
        appendChild(section, sectionTitle);

        let methodName;

        // Generate content for each method.
        for (let j = 0; j < _class.methods.length; j++) {
          const
          method = _class.methods[j],

          // Create elements.
          block = createElement('div'),
          blockTitle = createElement('label'),
          blockBody = createElement('div'),
          
          _hr = createElement('hr');

          // Add CSS styles.
          block.classList.add('section-block');
          blockTitle.classList.add('block-title');
          blockBody.classList.add('block-body');

          // Set properties.
          blockBody.innerHTML = `${method.description.slice(0, method.description.length - 4)}.<br>`;

          methodName = method.name;

          let 
          _allParametersContainer,
          _allReturnsContainer,

          syntaxString = `${method.name}(`;

          // Generate content for parameters if present.
          if (method.parameters.length > 0) {
            const 
            // Create elements;
            _allParametersTitle = createElement('label');
            _allParametersContainer = createElement('div');

            // Add CSS styles.
            _allParametersContainer.classList.add('parameters-return-container');
            _allParametersTitle.classList.add('parameters-return-title');

            // Set properties.
            _allParametersTitle.innerHTML = 'Parameters';

            // Append to container.
            appendChild(_allParametersContainer, _allParametersTitle);

            // Generate content for each parameter.
            for (let k = 0; k < method.parameters.length; k++) {
              const 
              _parameter = method.parameters[k],

              // Create elements.
              _parameterTitle = createElement('label');

              // Add CSS styles.
              _parameterTitle.classList.add('parameters-return-member');

              _defaultValueString = (_parameter.default != '') ? `. Default value is ${_parameter.default}` : '';

              // Set properties.
              if (_parameter.description === '') {
                _parameterTitle.innerHTML = `${_parameter.name} {${_parameter.kind}}${(_parameter.isOptional) ? ' (optional)' : ''}${_defaultValueString}.`;

              } else {
                _parameterTitle.innerHTML = `${_parameter.name} {${_parameter.kind}}${(_parameter.isOptional) ? ' (optional)' : ''} - ${_parameter.description}${_defaultValueString}.`;

              }

              // Append to container.
              appendChild(_allParametersContainer, _parameterTitle);

              syntaxString += `${_parameter.name}, `; // add to syntax string
            }
            
            syntaxString = `${syntaxString.slice(0, syntaxString.length - 2)})`;

          } else {
            syntaxString = `${syntaxString})<br>`;
          
          } // Method parameters length check.

          blockTitle.innerHTML = syntaxString;

          // Process return values if present.
          if (method.returns.length > 0) {

            // Create elements.
            const _allReturnsTitle = createElement('label');
            _allReturnsContainer = createElement('div');

            // Add CSS styles.
            _allReturnsContainer.classList.add('parameters-return-container');
            _allReturnsTitle.classList.add('parameters-return-title');

            // Set properties.
            _allReturnsTitle.innerHTML = 'Returns';

            // Append to container.
            appendChild(_allReturnsContainer, _allReturnsTitle);

            // Generate content for each return.
            for (let k = 0; k < method.returns.length; k++) {
              const 
              _return = method.returns[k];

              // Create elements.
              _returnTitle = createElement('label');

              // Add CSS styles.
              _returnTitle.classList.add('parameters-return-member')

              // Set properties.
              _returnTitle.innerHTML = `{${_return.kind}}`;

              // Append to container.
              appendChild(_allReturnsContainer, _returnTitle);
            }
            
          } // Method parameters length check.

          appendChild(block, blockTitle);
          appendChild(block, blockBody);

          if (_allParametersContainer) appendChild(block, _allParametersContainer);
          if (_allReturnsContainer) appendChild(block, _allReturnsContainer);

          appendChild(block, _hr);

          // If the method is a class constructor then place it at the head of the section.
          if (methodName === 'constructor') {

            // section.prepend(block);

            sectionTitle.parentNode.insertBefore(block, sectionTitle.nextSibling);

          } else {
            appendChild(section, block);

          }


        } // Generate class methods loop
        appendChild(_classDocument, section);
  
      } // class methods length check.
      // #endregion

      appendChild(contentPane, _classDocument); // Add newly generated content to content pane (right pane).
 
    } // class loop.
    // #endregion
    
    // 
    // All HTML content has been generated.
    // 

    // 
    // Setup HTML links and SVG image button links.
    // 

    const githubButton = getByID('go_github_button');

    if (project.projectRepositoryURL != '') {
      githubButton.onclick = () => window.open(project.projectRepositoryURL, '_blank');

    } else {
      githubButton.classList.add('hidden');

    }

    const credits = getByID('credits');
    if (project.projectName != '') {
      const a = createElement('a');
      a.setAttribute('target', '_blank');
      a.innerHTML = project.projectName;
      a.href = project.projectURL;
      appendChild(credits, a);
    }

    if (project.authorName != '') {
      credits.innerHTML += '&nbsp;by&nbsp;';
      const a = createElement('a');
      a.setAttribute('target', '_blank');
      a.innerHTML = project.authorName;
      a.href = project.authorURL;
      appendChild(credits, a);
    }

    // Set HTML misc text.
    getByID('pagetitle').innerHTML = `${project.projectName} Documentation`;
    getByID('heading').innerHTML = `${project.projectName} Documentation`;
    getByID('title').innerHTML = project.projectName;
    getByID('tagline').innerHTML = project.projectTag;
    
    
    showPerf(`\nAll operations completed`);
};

// #endregion

// 
// STYLE EDITOR.
// 

//#region - The style editor.
let 
currentClassName,
styleEditor,
stylesChanged,
backupOptions;

// Overwrite `OPTIONS` if required and reset styles to their previous settings.
const  cancelStyleEdits = () => {
  styleEditor.classList.add('hidden');

  if (stylesChanged) {
    OPTIONS = JSON.parse(backupOptions); // Overwrite options.
    setStylesFromOPTIONS();
  }
},

// Set all styles from the ones contained in persistent storage.
setStylesFromOPTIONS = () => {
    // Reset styles.
    const editableStyles = OPTIONS.editableStyles;
    for (let i = 0; i < editableStyles.length; i++) {
      const 
      style = editableStyles[i],
      rules = style.rules;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        targetRule.style.setProperty(rule.rootStyle, `${rule.value}${rule.kind}`);

      } // Rules loop.

    } // Editable styles loop.
},

// Remove outlines from any outlined HTML element.
removeOutlines = () => {

  const elements = document.getElementsByClassName(currentClassName);
  for (let i = 0; i < elements.length; i++) {
    elements.item(i).classList.remove('outlined');
  }
  currentClassName = null;
},

// Initialize the dreaded style editor.
initStyleEditor = () => {

  setStylesFromOPTIONS();
  
  styleEditor = getByID('style_editor');

  // Pressing "Escape" when the style editor is open will cancel any current edits.
  document.onkeyup = (e) => {
    //log(e.key);
    if (!styleEditor.classList.contains('hidden')) { // Only proceed if the editor IS open.
      if (e.key === 'Escape') cancelStyleEdits();
    }
  };

  // Install cancel style edit button click handler.
  getByID('cancel_style_edits_button').onclick = cancelStyleEdits;

  // Install open style editor button click handler.
  getByID('open_style_editor_button').onclick = () => {
    styleEditor.classList.remove('hidden');
    backupOptions = JSON.stringify(OPTIONS);
    stylesChanged = false;
  }

  // Install confirm style edits button click handler.
  getByID('confirm_style_edits_button').onclick = () => {
    styleEditor.classList.add('hidden');
    if (stylesChanged) {
      saveOptions();
      stylesChanged = false;
    }
  }

  // 
  // Now generate the editing controls.
  // 

  const 
  styleEditorControls = getByID('style_editor_controls'),

  editableStyles = OPTIONS.editableStyles;

  // Create controls for all editable styles.
  for (let i = 0; i < editableStyles.length; i++) {
    const 
    style = editableStyles[i],
    rules = style.rules,

    styleIndex = i,
   
    // Create header and attach to 
    container = createElement('details'),
    title = createElement('summary'),
    hr = createElement('hr');
    
    if (style.open) container.setAttribute('open', true); // Opened state is persisted to storage :)

    title.innerHTML = style.name;

    appendChild(container, title);

    // Persist details open/closed state.
    container.ontoggle = () => {
      style.open = container.open;
      OPTIONS.editableStyles[styleIndex].open = container.open;
      stylesChanged = true;
    }

    // Outline HTML elements in the other panes to make it easier to determine just what it is that you are editing.
    container.onmouseenter = () => {
      if (currentClassName) removeOutlines(); // First remove any current outlines.

      const elements = document.getElementsByClassName(style.className);
      for (let i = 0; i < elements.length; i++) {
        elements.item(i).classList.add('outlined');
      }
      currentClassName = style.className;
    }

    // Remove outlines from any currently outlined elements.
    container.onmouseleave = () => {
      if (currentClassName) removeOutlines();
    }

    // Create the actual editing controls.
    for (let j = 0; j < rules.length; j++) {
      const 
      rule = rules[j],

      ruleIndex = j,

      sliderGroup = createElement('div'),
      sliderTitle = createElement('label'),
      slider = createElement('input'),
      sliderValueLabel = createElement('label');
      resetButton = createElement('span');

      sliderGroup.classList.add('slider-group');
      sliderTitle.classList.add('slider-title');
      slider.classList.add('slider');
      sliderValueLabel.classList.add('slider-value');
      resetButton.classList.add('reset-style-button');

      appendChild(sliderGroup, sliderTitle);
      appendChild(sliderGroup, slider);
      appendChild(sliderGroup, sliderValueLabel);
      appendChild(sliderGroup, resetButton);
      appendChild(container, sliderGroup);

      resetButton.innerHTML = 'D';

      sliderTitle.innerHTML = rule.name;

      sliderValueLabel.innerHTML = `${rule.value}${rule.kind}`;

      slider.type = 'range';
      slider.min = rule.min;
      slider.max = rule.max;
      slider.step = rule.step;
      slider.value = rule.value;

      // Set value from the sliders value.
      slider.oninput = () => {
        let newValue = `${slider.value}${rule.kind}`; // Generate CSS string.
        sliderValueLabel.innerHTML = newValue;

        targetRule.style.setProperty(rule.rootStyle, newValue);

        OPTIONS.editableStyles[styleIndex].rules[ruleIndex].value = slider.value;
        stylesChanged = true; // Flag styles have been changed!
      }

      // Reset the value to it's default.
      resetButton.onclick = () => {
        let newValue = `${rule.default}${rule.kind}`; // Generate CSS string.
        sliderValueLabel.innerHTML = newValue;
        slider.value = rule.default;

        targetRule.style.setProperty(rule.rootStyle, newValue);

        OPTIONS.editableStyles[styleIndex].rules[ruleIndex].value = slider.value;
        stylesChanged = true; // Flag styles have been changed!
      }
 
    } // Rules loop.

    appendChild(styleEditorControls, container);
    appendChild(styleEditorControls, hr);

  } // Editable styles loop.

  styleEditorControls.removeChild(styleEditorControls.lastChild);

};
// #endregion

// #region - Generate and save final output.
// Generate final document and allow the user to save it.
const saveHTML = async () => {

  // 
  // Load this javascript code file and remove all code pertaining to document generation, and also comments.
  // NOTE: In an ideal world, we would also minify the code.
  // 

  const 
  clipStartTag = '/* clip_' + 'start */', // Need to declare these this way otherwise they will be recognized as actual clipping tags further along in the process.
  clipEndTag = '/* clip_' + 'end */';

  let codeInput = await loadTextFile('dgenerationx.js'); // load reader code.

  // Minimize whie space.
  codeInput = codeInput
  .replace(/ => /g, '=>')
  .replace(/ \? /g, '?')
  .replace(/ : /g, ':')
  .replace(/, /g, ',')
  .replace(/ {/g, '{')
  .replace(/} /g, '}')
  .replace(/ = /g, '=')
  .replace(/; /g, ';')
  .replace(/ > /g, '>')
  .replace(/ < /g, '<')
  .replace(/ === /g, '===')
  .replace(/ \(/g, '(')
  .replace(/ \)/g, ')')
  .replace(/ != /g, '!=')
  .replace(/ && /g, '&&')
  .replace(/ \|\| /g, '||')
  .replace(/} /g, '}');

  let 
  codeLines = codeInput.split(/\r|\n/), // Split into lines.
  codeOutput = [],
  clippingCode;

  // Process all code lines
  for (let i = 0; i < codeLines.length; i++) {
    let line = codeLines[i].trim();

    if (line.indexOf('//') != -1) {
      line = line.substring(0, line.indexOf('//')).trim(); // Strip javascript comments.
    }

    if (line === 'let') line = 'let ';
    if (line === 'const') line = 'const ';

    if (line != '') {
      
      if (line.indexOf(clipStartTag) != -1) { // Check for CSS clip start.
        //log(`Code clip_start (${i})`);
        clippingCode = true;
        
      } else if (line.indexOf(clipEndTag) != -1) { // Check for CSS clip end.
        //log(`Code clip_end (${i})`);
        clippingCode = false;
        
      } else { // This is not a special line.
        if (clippingCode) { // Check if clipping.
          //log(`clipped code (${i})`);

        } else {
          codeOutput.push(line); // Add to final output.

        }

      }

    } else {
      //log(`empty code line (${i})`);

    }
  } // Code lines loop.

  // 
  // Close all open documents and navigation containers, and show the landing page.
  // 

  if (selectedObjectTitle) selectedObjectTitle.classList.toggle('selected'); // Unselect selected nagigation link.

  hideElementsWithClass('api'); // Hide all visible documents in the content pane.

  // Close nagigation containers.
  const elements = document.getElementsByClassName('clickable-navigation-title');
  for (let i = 0; i < elements.length; i++) {
    const element = elements.item(i);
    element.nextElementSibling.classList.add('hidden');
  }
  
  getByID('landing_page').classList.remove('hidden'); // Show landing page.

  // 
  // We need to generate some styles that will be injected into the final output because when setting 
  // these styles when the application is running.. they don't actually change the entries in the :root 
  // node of the documents <style> section. This being the case we will remove them lateron, then inject 
  // our newly generated styles.
  // 

  let rootStyles = '';

  const editableStyles = OPTIONS.editableStyles;
  for (let i = 0; i < editableStyles.length; i++) {
    const 
    style = editableStyles[i],
    rules = style.rules;
    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j];
      rootStyles += `${rule.rootStyle}:${rule.value}${rule.kind};`;
    } // Rules loop.
  } // Editable styles loop.

  // 
  // Split the documents outerHTML into lines and process them one by one...
  // - Insert root styles when required.
  // - ignore blank lines and single line comments.
  // - Clip lines when required.
  // 

  let 
  output = [],

  clippingHTML,
  clippingCSS,

  lines = document.documentElement.outerHTML.split(/\r|\n/); // Split into lines because they are easier for my tiny brain to process ;)

  // Process all lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line != '') {
      
      if (line === clipStartTag) { // Check for CSS clip start.
        //log(`CSS clip_start (${i})`);
        clippingCSS = true;
        
      } else if (line === clipEndTag) { // Check for CSS clip end.
        //log(`CSS clip_end (${i})`);
        clippingCSS = false;
        
      } else if (line === '<!-- clip_start -->') { // Check for HTML clip start.
        //log(`HTML clip_start (${i})`);
        clippingHTML = true;
        
      } else if (line === '<!-- clip_end -->') { // Check for HTML clip end.
        //log(`HTML clip_end (${i})`);
        clippingHTML = false;
        
      } else { // This is not a special line.
        if (clippingCSS || clippingHTML) { // Check if clipping.
          //log(`clipped (${i})`);

        } else {
          if (line === '/* paste_root_styles_here */') { // Add styles at the appropriate place.
            output.push(rootStyles);

          } else if ((line.indexOf('/*') != -1 && line.indexOf('*/') != -1) || line.indexOf('<!--') != -1 && line.indexOf('-->') != -1) { // Skip comments.
            //log(`comment (${i})`);

          } else {

            output.push(line); // Add to final output.
          }

        }

      }

    } else {
      //log(`empty line (${i})`);

    }
  } // Lines loop.

  // 
  // Generate the final output!!!!!
  // 

  // let final = `<!DOCTYPE html>\n${output.join('\n')}\n<script>${readerCode}</script></body></html>`;

  let final = `<!DOCTYPE html>${output.join('')}<script>const projectName='${project.projectName.toLowerCase()}',repositoryURL='${project.projectRepositoryURL}';${codeOutput.join('')}</script></body></html>`;

  // //log(final);

  saveFile(final);

};
// #endregion

let 
// HTML elements.
containerPane,
headerPane,
navigationPane,
footerPane;
/* clip_end */

let 
// Color theme buttons.
goLightButton,
goDarkButton,

contentPane, // Where documents are displayed.

// Navigation pane resizing.
dragPane,
resizing,
newX,

pagePositions = [], // Array of offsets which are used to resume reading at the ame position in a document when the user clicks away from the document, and then returns to it. NOTE: Valid for session only.

selectedObject,
selectedObjectTitle,

optionsName,
OPTIONS; // Persistent options.

const 
localStorageNamespace = 'com.antix.dgenerationx',
optionsVersion = 2;

// Get the HTML element with the given id.
getByID = (id) => document.getElementById(id),

// Constrin the given value to be within the given rtange.
clamp = (v, min, max) => (v < min ? min : v > max ? max : v),

// Hide all elements with the given class name.
hideElementsWithClass = (classname) => Array.from(document.getElementsByClassName(classname)).forEach((el) => el.classList.add('hidden')),

// #region - Persistent options.
// Load the item with the given name from local storage.
loadOptions = () => {
  OPTIONS = window.localStorage.getItem(optionsName);
  if (OPTIONS) {
    OPTIONS = JSON.parse(OPTIONS);

    if (!OPTIONS.version || OPTIONS.optionsVersion != optionsVersion) {
      resetOptions(OPTIONS);
      saveOptions();
    }

  } else {
    resetOptions({
      useDarkTheme: true,
    });
    
    saveOptions();
  }

},

// Save options to local storage.
saveOptions = () => window.localStorage.setItem(optionsName, JSON.stringify(OPTIONS)),

// Reset the options to default and save them to local storage. The given will have its structure overwritten and enhanced with the default OPTIONS.
resetOptions = (target = {}) => {
  OPTIONS = Object.assign(target, {
    useDarkTheme: (target != {}) ? target.useDarkTheme : true, // Use existing setting.
    optionsVersion: optionsVersion, // Always overwrite version.

    /* clip_start */
    editableStyles: [ // New styles info will be added.

      // 
      // Navigation.
      // 

      { // Navigation title.
        name: 'Navigation title',
        className: 'clickable-navigation-title',
        open: false,
        rules: [
          { // border-radius.
            name: 'border-radius',
            rootStyle: '--clickable-navigation-title-border-radius',
            kind: 'rem',
            default: .3,
            value: .3,
            min: 0,
            max: 10,
            step: .1
          },
      
          { // font-size.
            name: 'font-size',
            rootStyle: '--clickable-navigation-title-font-size',
            kind: 'rem',
            default: 1.7,
            value: 1.7,
            min: 1,
            max: 10,
            step: .1
          },
      
          { // font-weight
            name: 'font-weight',
            rootStyle: '--clickable-navigation-title-font-weight',
            kind: '',
            default: 360,
            value: 360,
            min: 100,
            max: 1000,
            step: 20
          },
          
          { // line-height
            name: 'line-height',
            rootStyle: '--clickable-navigation-title-line-height',
            kind: '',
            default: 1.3,
            value: 1.3,
            min: 1,
            max: 10,
            step: .1
          },
      
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--clickable-navigation-title-margin-bottom',
            kind: 'rem',
            default: .1,
            value: .1,
            min: 0,
            max: 10,
            step: .1
          },
      
        ]
      },

      { // Navigation link.
        name: 'Navigation Link',
        className: 'clickable-navigation-link',
        open: false,
        rules: [
          { // border-radius.
            name: 'border-radius',
            rootStyle: '--clickable-navigation-link-border-radius',
            kind: 'rem',
            default: .3,
            value: .3,
            min: 0,
            max: 10,
            step: .1
          },
      
          { // font-size.
            name: 'font-size',
            rootStyle: '--clickable-navigation-link-font-size',
            kind: 'rem',
            default: 1.6,
            value: 1.6,
            min: 1,
            max: 10,
            step: .1
          },
      
          { // font-weight
            name: 'font-weight',
            rootStyle: '--clickable-navigation-link-font-weight',
            kind: '',
            default: 340,
            value: 340,
            min: 100,
            max: 1000,
            step: 20
          },
      
          
          { // line-height
            name: 'line-height',
            rootStyle: '--clickable-navigation-link-line-height',
            kind: '',
            default: 1.3,
            value: 1.3,
            min: 1,
            max: 10,
            step: .1
          },
      
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--clickable-navigation-link-margin-bottom',
            kind: 'rem',
            default: .1,
            value: .1,
            min: 0,
            max: 10,
            step: .1
          },
      
          { // margin-left
            name: 'margin-left',
            rootStyle: '--clickable-navigation-link-margin-left',
            kind: 'rem',
            default: 3,
            value: 3,
            min: 0,
            max: 10,
            step: .1
          },

          { // padding-left
            name: 'padding-left',
            rootStyle: '--clickable-navigation-link-padding-left',
            kind: 'rem',
            default: .6,
            value: .6,
            min: 0,
            max: 10,
            step: .1
          },
      
        ]
      },

      // 
      // Content.
      // 
      
      { // Document Header.
        name: 'Document Header',
        className: 'document-header',
        open: false,
        rules: [
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--document-header-margin-bottom',
            kind: 'rem',
            default: 3,
            value: 3,
            min: 0,
            max: 10,
            step: .1
          }
        ]
      },
    
      { // Document Title.
        name: 'Document Title',
        className: 'document-title',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--document-title-font-size',
            kind: 'rem',
            default: 4,
            value: 4,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--document-title-line-height',
            kind: '',
            default: 1.3,
            value: 1.3,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--document-title-font-weight',
            kind: '',
            default: 400,
            value: 400,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--document-title-margin-bottom',
            kind: 'rem',
            default: 2,
            value: 2,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },
    
      { // Document Description.
        name: 'Document Description',
        className: 'document-description',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--document-description-font-size',
            kind: 'rem',
            default: 1.6,
            value: 1.6,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--document-description-font-weight',
            kind: '',
            default: 280,
            value: 280,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--document-description-line-height',
            kind: '',
            default: 1.5,
            value: 1.5,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // margin-left
            name: 'margin-left',
            rootStyle: '--document-description-margin-left',
            kind: 'rem',
            default: 0,
            value: 0,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },
    
      { // Section.
        name: 'Section',
        className: 'document-section',
        open: false,
        rules: [
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--document-section-margin-bottom',
            kind: 'rem',
            default: 3,
            value: 3,
            min: 0,
            max: 10,
            step: .1
          },
    
          { // margin-left
            name: 'margin-left',
            rootStyle: '--document-section-margin-left',
            kind: 'rem',
            default: 0,
            value: 0,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },
      
      { // Section Title.
        name: 'Section Title',
        className: 'section-title',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--section-title-font-size',
            kind: 'rem',
            default: 2.9,
            value: 2.9,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--section-title-font-weight',
            kind: '',
            default: 300,
            value: 300,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--section-title-line-height',
            kind: '',
            default: 1,
            value: 1,
            min: 1,
            max: 10,
            step: .1
          },

          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--section-title-margin-bottom',
            kind: 'rem',
            default: 1,
            value: 1,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },
    
      { // Block.
        name: 'Block',
        className: 'section-block',
        open: false,
        rules: [
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--section-block-margin-bottom',
            kind: 'rem',
            default: 1.9,
            value: 1.9,
            min: 0,
            max: 10,
            step: .1
          },

          { // margin-left
            name: 'margin-left',
            rootStyle: '--section-block-margin-left',
            kind: 'rem',
            default: 1.9,
            value: 1.9,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },
    
      { // Block Title.
        name: 'Block Title',
        className: 'block-title',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--block-title-font-size',
            kind: 'rem',
            default: 2.2,
            value: 2.2,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--block-title-font-weight',
            kind: '',
            default: 300,
            value: 300,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--block-title-line-height',
            kind: '',
            default: 1,
            value: 1,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--block-title-margin-bottom',
            kind: 'rem',
            default: 1,
            value: 1,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },
    
      { // Block Body.
        name: 'Block Body',
        className: 'block-body',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--block-body-font-size',
            kind: 'rem',
            default: 1.6,
            value: 1.6,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--block-body-font-weight',
            kind: '',
            default: 280,
            value: 280,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--block-body-line-height',
            kind: '',
            default: 1,
            value: 1,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // margin-bottom
            name: 'margin-bottom',
            rootStyle: '--block-body-margin-bottom',
            kind: 'rem',
            default: 1,
            value: 1,
            min: 0,
            max: 10,
            step: .1
          },
          
          { // margin-left
            name: 'margin-left',
            rootStyle: '--block-body-margin-left',
            kind: 'rem',
            default: 0,
            value: 0,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },

      { // Parameter/Return Title.
        name: 'Parameter/Return Title',
        className: 'parameters-return-title',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--parameters-return-title-font-size',
            kind: 'rem',
            default: 1.8,
            value: 1.8,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--parameters-return-title-font-weight',
            kind: '',
            default: 360,
            value: 360,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--parameters-return-title-line-height',
            kind: '',
            default: 1,
            value: 1,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // margin-top
            name: 'margin-top',
            rootStyle: '--parameters-return-title-margin-top',
            kind: 'rem',
            default: 1.9,
            value: 1.9,
            min: 0,
            max: 10,
            step: .1
          },

        ]
      },

      { // Parameter/Return member.
        name: 'Parameter/Return member',
        className: 'parameters-return-member',
        open: false,
        rules: [
          { // font-size.
            name: 'font-size',
            rootStyle: '--parameters-return-member-font-size',
            kind: 'rem',
            default: 1.6,
            value: 1.6,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // font-weight
            name: 'font-weight',
            rootStyle: '--parameters-return-member-font-weight',
            kind: '',
            default: 280,
            value: 280,
            min: 100,
            max: 1000,
            step: 20
          },
    
          { // line-height
            name: 'line-height',
            rootStyle: '--parameters-return-member-line-height',
            kind: '',
            default: 1,
            value: 1,
            min: 1,
            max: 10,
            step: .1
          },
    
          { // margin-top
            name: 'margin-top',
            rootStyle: '--parameters-return-member-margin-top',
            kind: 'rem',
            default: 1,
            value: 1,
            min: 0,
            max: 10,
            step: .1
          },
          
          { // margin-left
            name: 'margin-left',
            rootStyle: '--parameters-return-member-margin-left',
            kind: 'rem',
            default: 2,
            value: 2,
            min: 0,
            max: 10,
            step: .1
          },
        ]
      },

      // NOTE: More editable styles can be added here.

    ], // Editable styles.
    /* clip_end */

  });
};
// #endregion

const loadProject = async () => {
    // Load project settings.
    let jsonInput = await loadTextFile('dgenerationx.json');
    project = JSON.parse(jsonInput);
};

// #region - Color theme manipulation.
// Set the color theme according to the given flag (true for dark).
const setColorTheme = (themeToUse, dontSave = false) => {

  const 
  // Colors inside CSS :root element to be modified.
  variablesToChange = [
    '--text-light-color',
    '--text-dark-color',

    '--anchor-text-color',
    '--anchor-text-light-color',

    '--background-color',
    '--background-bright-color',

    '--surface-color',
    '--surface-bright-color',

    '--primary-color',
    '--primary-bright-color',

    '--secondary-color',
    '--secondary-bright-color',

    '--error-color',

    '--scroll-bar-color',

    '--elevation-color',
  ],

  // Colors used when light theme is active.
  lightColors = [
    
    '1f1f1f', // text light
    'e3e3e3', // text dark
    
    '0b57d0', // anchor text light
    '041e49', // anchor text dark

    'ffffff', // background
    'e5e9ed', // background bright

    'f3f6fc', // surface
    'b8dbf0', // surface bright

    '92d7ff', // primary
    'c2e7ff', // primary bright

    'caffc2', // secondary
    'e5ede5', // secondary bright

    'b00', // error

    'cdcdcd', // scroll bar color

    '007c7e', // elevation
  ],
          
  // Colors used when dark theme is active.
  darkColors = [
    
    'e3e3e3', // text light
    '1f1f1f', // text dark

    'a8c7fa', // anchor text light
    'd3e3fd', // anchor text dark

    '1f1f1f', // background
    '292929', // background bright
    
    '2d2f31', // surface
    '383b3c', // surface bright

    '004a77', // primary
    '0f547d', // primary bright

    '107700', // secondary
    '1e7d0f', // secondary bright

    'd67', // error

    '7b7c7e', // scroll bar color

    '007c7e', // elevation
];

  OPTIONS.useDarkTheme = themeToUse; // Set color theme in options.

  colors = (OPTIONS.useDarkTheme) ? darkColors : lightColors; // Get palette;

  // Show / hide images as required.
  if (OPTIONS.useDarkTheme) {
    goDarkButton.classList.add('hidden');
    goLightButton.classList.remove('hidden');
  
  } else {
    goDarkButton.classList.remove('hidden');
    goLightButton.classList.add('hidden');
  
  }

  for (let i = 0; i < variablesToChange.length; i++) targetRule.style.setProperty(`${variablesToChange[i]}`, `#${colors[i]}`);

  targetRule.style.setProperty(`--hr-color`, `#${colors[0]}30`);

  if(!dontSave) saveOptions();

};
// #endregion

// 
// Main application logic (executed when page is loaded).
// 

window.onload = async () => {

  // 
  // Common code between reader and generator.
  // 


  // Get theme color changing buttons and install click handlers.
  goLightButton = getByID('go_light_button');
  goDarkButton = getByID('go_dark_button');

  goDarkButton.onclick = () => setColorTheme(true);
  goLightButton.onclick = () => setColorTheme(false);

  contentPane = getByID('content');

  // Get drag bar and install navingation pane resizing event handlers.
  dragPane = getByID('drag'),

  // Initiate resizing when primary pointer button is pressed (whilst over the drag pane).
  dragPane.onpointerdown = (e) => {
    if (e.button === 0) {
      resizing = true;
      newX = e.clientX;
    }
  };

  // Resize navigation pane when pointer moved while resizing is enabled.
  window.onpointermove = (e) => {
    if (resizing) {
      const oldX = newX;
      newX = e.clientX;
      dx = e.clientX - oldX; // Movement delta
      const width = clamp(navigationPane.offsetWidth + dx, 24, 300); // New width.
      containerPane.style.gridTemplateColumns = `${width}px 8px 1fr`;
    }
  };

  // Stop resizing if primary pointer button is released.
  window.onpointerup = (e) => {
    if (e.button === 0) resizing = false;
  };

  // Find the stylesheet with the :root node
  for (const sheet of document.styleSheets) {
    if (sheet.ownerNode.nodeName === 'STYLE' && sheet.ownerNode.textContent.includes(':root')) {
      targetStyleSheet = sheet;
      break;
    }
  }

  // Find the rule with the :root selectorText.
  if (targetStyleSheet) {
    const cssRules = targetStyleSheet.cssRules;
    for (let i = 0; i < cssRules.length; i++) {
      const rule = cssRules[i];
      if (rule.selectorText === ':root') {
        targetRule = rule;
        break;
      }
    }
  }

  // Throw a hissy-fit if it wasn't found (which should never happen).
  if (!targetRule) throw(new Error('no root style!'));

  // Determine if this instance of the code is the generator, or the reader.
  if (typeof isReader === 'undefined') { /* clip_start */

    // 
    // Generator exclusive code.
    // 

    await loadProject();

    containerPane = getByID('container');
    headerPane = getByID('header');
    navigationPane = getByID('navigation');
    footerPane = getByID('footer');

    optionsName = `${localStorageNamespace}-${project.projectName.toLowerCase()}-generator`;
    loadOptions();
    setColorTheme(OPTIONS.useDarkTheme, true);

    initStyleEditor();

    parseAllFiles();


  } else { /* clip_end */

    // 
    // Reader exclusive code.
    // 

    optionsName = `${localStorageNamespace}-${projectName.toLowerCase()}-reader`;
    loadOptions();
    setColorTheme(OPTIONS.useDarkTheme, true);

    // Setup github repository button.
    const githubButton = getByID('go_github_button');

    if (repositoryURL != '') {
      githubButton.onclick = () => window.open(repositoryURL, '_blank');

    } else {
      githubButton.classList.add('hidden');
    }

    // Install click handlers for navigation links so that when clicked they cause their associated documents to be displayed in the content pane.
    let elements = document.getElementsByClassName('clickable-navigation-link');

    for (let i = 0; i < elements.length; i++) {
      const element = elements.item(i);
      const id = element.id.slice(0, element.id.indexOf('_'));
      element.onclick = () => {
        hideElementsWithClass('nonapi');
        // If there is already a selected class title, unselect it.
        if (selectedObject) {
          pagePositions[selectedObject.id] = contentPane.scrollTop;

          selectedObject.classList.toggle('hidden');
          selectedObjectTitle.classList.remove('selected');
        }

        // Display relevant content in content pane.
        const selectedObjectID = `${id}_content`;

        selectedObject = getByID(selectedObjectID);
        selectedObject.classList.toggle('hidden');

        contentPane.scrollTop = (pagePositions[selectedObjectID]) ? pagePositions[selectedObjectID] : 0;

        // Set currently selected class title.
        selectedObjectTitle = getByID(`${id}_title`);
        selectedObjectTitle.classList.add('selected');
      }
    }

    // Install click handlers for navigation title so they expand and collapse their link containers.
    elements = document.getElementsByClassName('clickable-navigation-title');
    for (let i = 0; i < elements.length; i++) {
      const element = elements.item(i);
      element.onclick = () => element.nextElementSibling.classList.toggle('hidden');
    }
      
  } /* clip_start */
  /* clip_end */

} // window.onload
