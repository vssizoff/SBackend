#!/usr/bin/env node

import {spawn} from "child_process";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const Process = spawn(`cross-env PORT=${process.argv[3] || 8080} nodemon "${path.resolve(process.argv[2] || "main.js")}"`, [], {
    stdio: 'inherit',
    shell: true
});

process.on('SIGTERM', () => Process.kill('SIGTERM'));
process.on('SIGINT', () => Process.kill('SIGINT'));
process.on('SIGBREAK', () => Process.kill('SIGBREAK'));
process.on('SIGHUP', () => Process.kill('SIGHUP'));