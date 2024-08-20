import { ffmpegOptions } from "./ffmpegOptions";
import { sep } from "@tauri-apps/api/path";

class FFmpegCommand {
  inputs = $state([""]);
  output = $state({ folder: "", name: "output", extension: "mp4" });
  args = $state([]);

  addInput = () => {
    this.inputs.push("");
  };

  removeInput = (index) => {
    this.inputs = this.inputs.filter((_, i) => i !== index);
  };

  addArg = () => {
    this.args.push({ key: "", value: "" });
  };

  removeArg = (index) => {
    this.args = this.args.filter((_, i) => i !== index);
  };

  removeQuotes = (path) => path.replace(/^["']|["']$/g, "").trim();

  generateArgv = () => {
    const argv = [];

    // Add input files
    for (const input of this.inputs) {
      if (input) {
        argv.push("-i", `"${this.removeQuotes(input)}"`);
      }
    }

    // Add other arguments
    for (const arg of this.args) {
      if (arg.key) {
        const optionDetails = ffmpegOptions[arg.key];
        if (optionDetails) {
          if (optionDetails.type === "flag") {
            // For flag type options, just add the value (e.g., "-an")
            argv.push(optionDetails.value);
          } else if (arg.value) {
            // For other types, add both the option and its value
            argv.push(optionDetails.value, arg.value);
          }
        }
      }
    }

    // Add output file
    const outputFolder = this.removeQuotes(this.output.folder);
    const outputName = this.removeQuotes(this.output.name);
    const outputPath = `${outputFolder}${
      outputFolder ? sep() : ""
    }${outputName}.${this.output.extension}`;
    argv.push(`"${outputPath}"`);

    return argv;
  };

  toString = () => `ffmpeg ${this.generateArgv().join(" ")}`;
}

export const createFFmpegCommand = () => new FFmpegCommand();

export const ffmpegCommand = new FFmpegCommand();
