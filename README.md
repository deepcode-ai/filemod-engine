# filemod-engine

The monorepo for the **filemod-engine** project.

**filemod-engine** is a toolkit for executing filemods over directories.

A filemod is like a codemod, but changes the placement of files based on file path patterns.

## Installation

    pnpm install

## Linting and Testing

    pnpm turbo run lint # check linting rules
    pnpm test # run all the tests

    pnpm run lint:eslint:write
    pnpm run lint:prettier:write


### The filemod-engine package

Go [here](./packages/filemod-engine/README.md)
