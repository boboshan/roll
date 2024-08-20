<script>
  // import stringArgv from "string-argv";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { dirname, extname, basename } from "@tauri-apps/api/path";
  import { open } from "@tauri-apps/plugin-dialog";
  import { ffmpegCommand, ffmpegOptions } from "$lib/ffmpeg/";

  let progressUnlisten = null;
  let errorUnlisten = null;
  let infoUnlisten = null;

  let output = $state("");
  let error = $state("");

  let progressInfo = $state({
    progress: 0,
    frame: 0,
    fps: 0,
    totalSize: 0,
    outTime: 0,
    bitrate: 0,
    speed: 0,
  });

  let ffmpegCommandPreview = $state(ffmpegCommand.toString());

  function updateFFmpegCommandPreview() {
    ffmpegCommandPreview = ffmpegCommand.toString();
  }

  async function selectInputFile(index) {
    const selected = await open({
      multiple: false,
      title: "Select Video File",
      filters: [
        {
          name: "Video",
          extensions: ["mp4", "avi", "mov"],
        },
      ],
    });

    if (selected) {
      ffmpegCommand.inputs[index] = selected.path;
    }
    if (index === 0) {
      ffmpegCommand.output.folder = await dirname(selected.path);
      ffmpegCommand.output.extension = await extname(selected.path);
      ffmpegCommand.output.name = `${await basename(selected.path, `.${ffmpegCommand.output.extension}`)}_output`;
    }
    updateFFmpegCommandPreview();
  }

  async function selectOutputFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Output Folder",
      defaultPath: ffmpegCommand.output.folder,
    });
    if (selected) {
      ffmpegCommand.output.folder = selected;
    }
    updateFFmpegCommandPreview();
  }

  async function updateFFmpegCommandFromPreview(event) {
    console.log(event.target.value);
    // const args = stringArgv(ffmpegCommandPreview);
    // let currentInputs = $state.snapshot(ffmpegCommand.inputs);
    // let currentOutput = $state.snapshot(ffmpegCommand.output);
    // let currentArgs = $state.snapshot(ffmpegArgs);
    // let newInputs = [];
    // let newOutput = { folder: "", name: "", extension: "" };
    // let newArgs = [];

    // const outputPath = args[args.length - 1];
    // newOutput.folder = await dirname(outputPath);
    // newOutput.extension = await extname(outputPath);
    // newOutput.name = await basename(outputPath, `.${newOutput.extension}`);

    // for (let i = 1; i < args.length - 1; i++) {
    // 	if (args[i] === "-i") {
    // 		newInputs.push(args[++i]);
    // 	} else if (args[i] === "-") {
    // 		newArgs.push({ key: "", value: "" });
    // 	} else if (args[i].startsWith("-") && i + 1 === args.length - 1) {
    // 		newArgs.push({ key: args[i].substring(1), value: "" });
    // 	} else if (args[i].startsWith("-")) {
    // 		const option = ffmpegOptions.find(
    // 			(opt) => Object.values(opt)[0].value === args[i]
    // 		);
    // 		if (option && Object.values(option)[0].type === "flag") {
    // 			newArgs.push({ key: args[i].substring(1), value: true });
    // 		} else {
    // 			newArgs.push({ key: args[i].substring(1), value: args[++i] });
    // 		}
    // 	}
    // }
    // console.log(newArgs);

    // if (JSON.stringify(currentInputs) !== JSON.stringify(newInputs)) {
    // 	ffmpegCommand.inputs = newInputs;
    // }
    // if (JSON.stringify(currentOutput) !== JSON.stringify(newOutput)) {
    // 	ffmpegCommand.output = newOutput;
    // }
    // if (JSON.stringify(currentArgs) !== JSON.stringify(newArgs)) {
    // 	ffmpegArgs = newArgs;
    // }
  }

  async function runFFmpegWithProgress() {
    const args = ffmpegCommand
      .generateArgv()
      .map((arg) => arg.replace(/^["'](.*)["']$/, "$1"));

    args.push("-progress", "pipe:1");

    try {
      await invoke("run_ffmpeg_with_progress", { args });
    } catch (err) {
      console.error("FFmpeg error:", err);
      error = err.toString();
    }
  }

  $effect(async () => {
    progressUnlisten = await listen("ffmpeg-progress", (event) => {
      const info = event.payload;
      progressInfo.progress = info.progress;
      progressInfo.frame = info.frame;
      progressInfo.fps = info.fps;
      progressInfo.totalSize = info.total_size;
      progressInfo.outTime = info.out_time;
      progressInfo.bitrate = info.bitrate;
      progressInfo.speed = info.speed;
    });

    errorUnlisten = await listen("ffmpeg-error", (event) => {
      console.error("FFmpeg error:", event.payload);
      error = event.payload;
    });

    infoUnlisten = await listen("ffmpeg-info", (event) => {
      console.log("FFmpeg info:", event.payload);
      output += event.payload + "\n";
    });

    return () => {
      if (progressUnlisten) {
        progressUnlisten();
        progressUnlisten = null;
      }
      if (errorUnlisten) {
        errorUnlisten();
        errorUnlisten = null;
      }
      if (infoUnlisten) {
        infoUnlisten();
        infoUnlisten = null;
      }
    };
  });
</script>

<div class="max-w-3xl my-4 mx-a py-4 overflow-auto">
  <textarea
    bind:value={ffmpegCommandPreview}
    oninput={updateFFmpegCommandFromPreview}
    spellcheck="false"
    class="block w-full min-h-24 rounded-2 mb-3 p-4 bg-#141414 text-sm transition-border-color duration-200"
  ></textarea>

  <form
    onsubmit={(e) => {
      e.preventDefault();
      runFFmpegWithProgress();
    }}
    class="flex flex-col gap-3"
  >
    <h3 class="text-lg font-medium ml-2">Inputs</h3>

    <div class="flex flex-col gap-3">
      {#each ffmpegCommand.inputs as input, index}
        <div class="flex flex-row gap-3">
          <input
            bind:value={ffmpegCommand.inputs[index]}
            oninput={updateFFmpegCommandPreview}
            placeholder="Input file path"
            class="w-full rounded-2 px-4 py-3 bg-#141414 text-sm transition-border-color duration-200"
          />
          <button
            type="button"
            onclick={() => selectInputFile(index)}
            class="btn"
          >
            Select File
          </button>
          {#if index > 0}
            <button
              type="button"
              onclick={() => {
                ffmpegCommand.removeInput(index);
                updateFFmpegCommandPreview();
              }}
              class="btn"
              >Remove
            </button>
          {/if}
          {#if index === 0}
            <button type="button" onclick={ffmpegCommand.addInput} class="btn"
              >Add Input
            </button>
          {/if}
        </div>
      {/each}
    </div>

    <h3 class="text-lg font-medium ml-2">Output</h3>

    <div class="flex flex-row gap-3">
      <input
        bind:value={ffmpegCommand.output.folder}
        oninput={updateFFmpegCommandPreview}
        placeholder="Output folder path"
        class=" w-full rounded-2 px-4 py-3 bg-#141414 text-sm transition-border-color duration-200"
      />
      <button type="button" onclick={selectOutputFolder} class="btn">
        Select Output Folder
      </button>
    </div>
    <div class="flex flex-row gap-3">
      <input
        bind:value={ffmpegCommand.output.name}
        placeholder="Output file name"
        oninput={updateFFmpegCommandPreview}
        class="w-full rounded-2 px-4 py-3 bg-#141414 text-sm transition-border-color duration-200"
      />
      <select
        bind:value={ffmpegCommand.output.extension}
        onchange={updateFFmpegCommandPreview}
        name="Output Extension"
        class="btn"
      >
        <option value="mp4">MP4</option>
        <option value="avi">AVI</option>
        <option value="mov">MOV</option>
      </select>
    </div>

    <h3 class="text-lg font-medium ml-2">Arguments</h3>

    {#each ffmpegCommand.args as arg, index}
      <div class="flex flex-row gap-3">
        <select
          bind:value={arg.key}
          onchange={() => {
            arg.value = "";
            updateFFmpegCommandPreview();
          }}
          class="btn"
        >
          <option value="">Select Argument</option>
          {#each Object.entries(ffmpegOptions) as [key, details]}
            <option value={key}>{details.label}</option>
          {/each}
        </select>

        {#if arg.key}
          {#each Object.entries(ffmpegOptions) as [key, details]}
            {#if key === arg.key}
              {#if details.type === "input"}
                <input
                  bind:value={arg.value}
                  placeholder="Value"
                  oninput={updateFFmpegCommandPreview}
                  class="rounded-2 px-4 py-3 bg-#141414 text-sm transition-border-color duration-200"
                />
              {:else if details.type === "select"}
                <select
                  bind:value={arg.value}
                  onchange={updateFFmpegCommandPreview}
                  class="rounded-2 px-4 py-3 bg-#141414 text-sm transition-border-color duration-200"
                >
                  {#each details.options as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              {/if}
              <div class="text-sm text-gray-400 mt-1">
                {details.description}
              </div>
            {/if}
          {/each}
        {/if}
        <button
          type="button"
          onclick={() => {
            ffmpegCommand.removeArg(index);
            updateFFmpegCommandPreview();
          }}
          class="btn"
          >Remove
        </button>
      </div>
    {/each}
    <div class="flex flex-row gap-3">
      <button type="button" onclick={ffmpegCommand.addArg} class="btn">
        Add Argument
      </button>
      <button
        type="submit"
        class="ml-a rounded-2 px-5 py-3 text-sm whitespace-nowrap transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
      >
        Run
      </button>
    </div>

    <div class="mt-2 p-4 bg-#141414 rounded-2">
      <div class="w-full bg-#202020 rounded-1 overflow-hidden mb-3">
        <div
          class="h-4 bg-blue-8 text-xs font-mono text-center select-none transition-width duration-500 ease-in-out"
          style="width: {progressInfo.progress * 100}%"
        ></div>
      </div>
      <div class="text-sm font-mono select-none">
        <p>Progress: {(progressInfo.progress * 100).toFixed(2)}%</p>
        <p>Frame: {progressInfo.frame}</p>
        <p>FPS: {progressInfo.fps.toFixed(2)}</p>
        <p>Size: {(progressInfo.totalSize / 1024 / 1024).toFixed(2)} MB</p>
        <p>Time: {(progressInfo.outTime / 1000).toFixed(2)} s</p>
        <p>Bitrate: {progressInfo.bitrate.toFixed(2)} kbits/s</p>
        <p>Speed: {progressInfo.speed.toFixed(2)}x</p>
      </div>

      {#if error}
        <div
          class="mt-4 p-4 text-sm bg-#141414 rounded-1 border-red-5 border-1"
        >
          <pre
            class="whitespace-pre-wrap break-words overflow-auto">{error}</pre>
        </div>
      {/if}

      {#if output}
        <div
          class="mt-4 p-4 text-sm bg-#141414 rounded-1 border-content border-1"
        >
          <pre
            class="whitespace-pre-wrap break-words overflow-auto">{output}</pre>
        </div>
      {/if}
    </div>
  </form>
</div>
