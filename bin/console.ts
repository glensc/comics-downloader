#!/usr/bin/env -S node --unhandled-rejections=throw -r ts-node/register

import { Application } from "../src/Application";

const program = new Application();
program.parse();
