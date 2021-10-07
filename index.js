import fetch from "node-fetch";
import fs from "fs";
import logUpdate from "log-update";

const download = async (link) => {
  try {
    const response = await fetch(link);
    const path = link.split("/")[link.split("/").length - 1];

    const startedAt = Date.now();
    const total = parseInt(response.headers.get("content-length"));
    let done = 0;

    const header = response.headers.get("content-disposition");
    const filename = header?.split(";")[1]?.split("=")[1]?.replace(/"/g, "");

    response.body.on("data", (chunk) => {
      done += chunk.length;
      const remaining = total - done;

      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = done / elapsed;
      const estimated = total / rate;
      const eta = estimated - elapsed;

      const timeRemaining = Math.round(eta / 60);

      logUpdate(`
File name: ${filename || path}
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

    const writableStream = fs.createWriteStream(filename || path);
    response.body.pipe(writableStream);
  } catch (err) {
    logUpdate(`Error: ${err}`);
  }
};

download(process.argv[2]);
