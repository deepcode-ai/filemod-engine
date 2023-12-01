# @deepcode-ai/filemod-engine

## Local Installation
    pnpm link --global # link this local package system-wide

## Usage

    filemod-engine --help

### Usage with a declarative filemod

    filemod-engine transform [transformFilePath] [rootDirectoryPath]

Where:
* `transformFilePath` is the absolute path to the YML file (DSL) that contains the transform declaration
* `rootDirectoryPath` is the absolute path to the root of your project

You can also pass `--dryRun` if you want to see what changes will be written.

In order to use a declarative filemod, one needs to be written. Such codemods are written in YAML, like this:

```
version: 1
posix: true
includePattern: '**/pages/**/*.{js,jsx,ts,tsx}'
excludePatterns:
    - '**/node_modules/**'
    - '**/pages/api/**'
deleteRules:
    fileRoot:
        - '_app'
        - '_document'
        - '_error'
replaceRules:
    - replaceDirectoryName:
          - 'pages'
          - 'app'
    - appendDirectoryName:
          - '@fileRoot'
          - fileRootNot: 'index'
    - replaceFileRoot: 'page'
tests:
    - - 'move'
      - '/opt/project/pages/index.tsx'
      - '/opt/project/app/page.tsx'
```

You need to define the following properties:
* `version`: 1
* `posix` (for now we support only POSIX platforms)
* `includePattern` - the glob pattern to run against the root directory path
* `excludePattern` - the glob pattern to run against the root directory path for exclusion of file paths
* `deleteRules` - the union of rules that tell whether to remove the files or not
* `replaceRules` - the ordered list of rules that modify the filePath
* `copyRules` - the ordered list of rules that create the copy path for the filePath
* `tests` - the set of tests for patterns

### How to work on paths?

Any path is split into the following elements:
* `pathRoot`
* `directoryNames`
* `fileRoot`
* `fileExtension`

For instance, a path like `opt/project/pages/index.tsx` has the following properties (defined using pseudocode):
* `pathRoot = "/"`
* `directoryNames = ["", "project", "pages"]`
* `fileRoot = "index"`
* `fileExtension = "tsx"`

These properties are accessible for reading and writing in the DSL.

### Delete Rules

The `fileRoot` equals rule delete a file path if any of the provided labels match the file root. Check the example below:

    fileRoot:
        - '_app'
        - '_document'
        - '_error'

### Replace/Copy Rules

Each replace/copy rule with have a read/write access to all the 4 path properties mentioned before. Each rule is executed in the declaration order.

The `replaceDirectoryName` rule replaces any directory Name that matches the 0th literal with the 1st literal. Check the example below:
    
    replaceDirectoryName:
            - 'pages'
            - 'app'
 
The `appendDirectoryName` rule add a new directory name to the end of the list of directory names based on a condition. In the following example, if the file root does not equal `index`, a new directory named the same as file root will be appended.

    appendDirectoryName:
          - '@fileRoot'
          - fileRootNot: 'index'

The `replaceFileRoot` rule replaces the the existing file root with a new literal, like `page` in the following example:
    
    replaceFileRoot: 'page'

### Usage with an imperative codemod

TBD
