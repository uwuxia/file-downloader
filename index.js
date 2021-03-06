#! /usr/bin/env node

import https from 'https';
import fetch from "node-fetch";
import logUpdate from "log-update";

import fs from "fs";
import os from "os";

const download = async (link, fileNameFromUser) => {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await fetch(link, { agent });

    const startedAt = Date.now();
    const total = parseInt(response.headers.get("content-length"));
    let done = 0;

    const header = response.headers.get("content-disposition");
    const fileNameFromServer = header
      ?.split(";")[1]
      ?.split("=")[1]
      ?.replace(/"/g, "");

    const path = fileNameFromServer || fileNameFromUser;

    response.body.on("data", (chunk) => {
      done += chunk.length;
      const remaining = total - done;

      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = done / elapsed;
      const estimated = total / rate;
      const eta = estimated - elapsed;

      const timeRemaining = Math.round(eta / 60);

      logUpdate(`
File name: ${path}
Percentage: ${Math.round((done / total) * 100)}%
Size: ${Math.round((total / 1000 / 1000) * 100) / 100} MB
Downloaded: ${Math.round((done / 1000 / 1000) * 100) / 100} MB
Remaining: ${Math.round((remaining / 1000 / 1000) * 100) / 100} MB
Time remaining: ${
        eta < 60
          ? `${Math.round(eta)} second(s)`
          : timeRemaining >= 60
          ? `${Math.round(timeRemaining / 60)} hour(s)`
          : `${timeRemaining} minute(s)`
      }`);
    });

    const writableStream = fs.createWriteStream(
      `${os.userInfo().homedir}/Downloads/${path}`
    );
    response.body.pipe(writableStream).on("finish", () => {
      const elapsed = (Date.now() - startedAt) / 1000;

      logUpdate(`File downloaded!
Downloaded file path: ${os.userInfo().homedir}/Downloads/${path}
Elapsed time: ${
        elapsed < 60
          ? `${Math.round(elapsed)} second(s)`
          : elapsed >= 60
          ? `${Math.round(elapsed / 60 / 60)} hour(s)`
          : `${Math.round(elapsed / 60)} minute(s)`
      }`);
    });
  } catch (err) {
    logUpdate(`Error: ${err}`);
  }
};

download(process.argv[2], process.argv[3]);
