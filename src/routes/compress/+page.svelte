<script>
  import { blur, fade } from "svelte/transition";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { event } from "@tauri-apps/api";
  import { dirname, extname, join, basename } from "@tauri-apps/api/path";
  import { open } from "@tauri-apps/plugin-dialog";
  import { mkdir, exists } from "@tauri-apps/plugin-fs";
  import { AlertDialog, Checkbox, Label } from "bits-ui";
  import { flyAndScale } from "$lib/transitions";
  import UploadIcon from "$lib/icons/Uploade.svelte";

  let ffmpegOutput = $state("");
  let ffmpegError = $state("");

  let fileStats = $state({
    total: 0,
  });

  let completedFiles = -1;

  let ffmpegProgress = $state({
    percent: 0,
    frame: 0,
    fps: 0,
    totalSize: 0,
    outTime: 0,
    bitrate: 0,
    speed: 0,
  });

  let totalProgress = $derived.by(() => {
    if (fileStats.total > 0) {
      if (ffmpegProgress.percent === 0) {
        completedFiles += 1;
        return completedFiles / fileStats.total;
      }
      return (completedFiles + ffmpegProgress.percent) / fileStats.total;
    }
    return 0;
  });

  let isCompressionComplete = $derived(!(totalProgress < 1));

  let overwriteDialog = $state({
    isOpen: false,
    message: "",
    applyToAll: false,
    showApplyToAll: false,
    resolve: null,
  });

  let fileSelection = $state({
    selectedFiles: [],
    isDragging: false,
  });

  async function openFileSelector() {
    const selectedFiles = await open({
      multiple: true,
      title: "Select Video Files",
      filters: [
        {
          name: "Video",
          extensions: ["mp4", "avi", "mov"],
        },
      ],
    });
    if (selectedFiles) {
      fileSelection.selectedFiles = selectedFiles.map((f) => f.path);
    }
  }

  function resetCompression() {
    fileSelection.selectedFiles = [];
    ffmpegProgress = {
      percent: 0,
      frame: 0,
      fps: 0,
      totalSize: 0,
      outTime: 0,
      bitrate: 0,
      speed: 0,
    };
    fileStats = {
      total: 0,
    };
    completedFiles = -1;
    ffmpegError = "";
  }

  function promptOverwrite(fileName, isLastFile = false) {
    return new Promise((resolve) => {
      overwriteDialog.isOpen = true;
      overwriteDialog.message = `File "${fileName}" already exists. Overwrite?`;
      overwriteDialog.applyToAll = false;
      overwriteDialog.showApplyToAll = !isLastFile;
      overwriteDialog.resolve = resolve;
    });
  }

  async function prepareFiles(filePaths) {
    let outputFolderExists = false;
    let filesToProcess = [];
    let globalOverwriteDecision = null;

    for (let i = 0; i < filePaths.length; i++) {
      const inputPath = filePaths[i];
      const inputFolder = await dirname(inputPath);
      const inputExtension = await extname(inputPath);
      const inputFileName = await basename(inputPath);
      const outputFolder = await join(inputFolder, "_output");
      const outputFileName = inputFileName;
      const outputExtension = "mp4";
      const outputPath = await join(
        outputFolder,
        outputFileName.replace(inputExtension, outputExtension)
      );

      if (!outputFolderExists) {
        outputFolderExists = await exists(outputFolder);

        if (!outputFolderExists) {
          await mkdir(outputFolder);
        }
      }

      const fileExists = await exists(outputPath);
      const isLastFile = i === filePaths.length - 1;

      if (fileExists) {
        if (globalOverwriteDecision === null) {
          const { overwrite, applyToAll } = await promptOverwrite(
            inputFileName,
            isLastFile
          );
          if (applyToAll) {
            globalOverwriteDecision = overwrite;
          }
          if (!overwrite) continue;
        }
        if (globalOverwriteDecision === false) {
          continue;
        }
      }

      filesToProcess.push({
        inputPath,
        outputPath,
        fileExists,
      });
    }
    return filesToProcess;
  }

  async function startCompression() {
    const filesToProcess = await prepareFiles(fileSelection.selectedFiles);
    fileStats.total = filesToProcess.length;

    for (const file of filesToProcess) {
      const ffmpegArgs = [
        "-i",
        file.inputPath,
        "-c:v",
        "libx265",
        "-crf",
        "26",
        "-preset",
        "slow",
        "-progress",
        "pipe:1",
        file.outputPath,
      ];

      if (file.fileExists) {
        ffmpegArgs.push("-y");
      }

      try {
        await invoke("run_ffmpeg_with_progress", { args: ffmpegArgs });
      } catch (err) {
        console.error("FFmpeg error:", err);
        ffmpegError = err.toString();
      }
    }
  }

  $effect(async () => {
    const unListenDragEnter = await event.listen("tauri://drag-enter", () => {
      fileSelection.isDragging = true;
    });
    const unListenDragLeave = await event.listen("tauri://drag-leave", () => {
      fileSelection.isDragging = false;
    });
    const unListenDragDrop = await event.listen("tauri://drag-drop", (e) => {
      fileSelection.selectedFiles = e.payload.paths;
      fileSelection.isDragging = false;
    });

    const unListenProgressInfo = await listen("ffmpeg-progress", (event) => {
      const info = event.payload;
      ffmpegProgress.percent = info.progress;
      ffmpegProgress.frame = info.frame;
      ffmpegProgress.fps = info.fps;
      ffmpegProgress.totalSize = info.total_size;
      ffmpegProgress.outTime = info.out_time;
      ffmpegProgress.bitrate = info.bitrate;
      ffmpegProgress.speed = info.speed;
    });

    const unListenError = await listen("ffmpeg-error", (event) => {
      console.error("FFmpeg error:", event.payload);
      ffmpegError = event.payload;
    });

    const unListenInfo = await listen("ffmpeg-info", (event) => {
      console.log("FFmpeg info:", event.payload);
      ffmpegOutput += event.payload + "\n";
    });

    return () => {
      unListenDragEnter();
      unListenDragLeave();
      unListenDragDrop();
      unListenProgressInfo();
      unListenError();
      unListenInfo();
    };
  });
</script>

{#if fileSelection.selectedFiles.length > 0}
  <div
    in:blur={{ duration: 300, delay: 300 }}
    out:blur={{ duration: 300 }}
    class="relative w-full h-full overflow-hidden"
  >
    {#if isCompressionComplete}
      <div
        in:blur={{ duration: 300, delay: 300 }}
        out:blur={{ duration: 300 }}
        class="flex w-full h-full items-center justify-center"
      >
        <button
          on:click={resetCompression}
          class="text-6xl font-bold uppercase select-none bg-inherit hover:scale-110 active:scale-120 transition-transform duration-200 ease-in-out"
          >Complete</button
        >
      </div>
    {:else}
      <div
        class="flex w-full h-full items-center justify-center"
        out:blur={{ duration: 300 }}
      >
        <button
          on:click={startCompression}
          class="rounded-2 px-5 py-3 mr-2 text-sm whitespace-nowrap select-none transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
        >
          Compress
        </button>
        <button
          on:click={resetCompression}
          class="rounded-2 px-5 py-3 text-sm whitespace-nowrap select-none transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
        >
          Reset
        </button>
      </div>
    {/if}
    <AlertDialog.Root bind:open={overwriteDialog.isOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          transition={fade}
          transitionConfig={{ duration: 150 }}
          class="fixed inset-0 z-50 bg-black/80"
        />
        <AlertDialog.Content
          transition={flyAndScale}
          class="fixed left-50% top-50% z-50 select-none grid w-full max-w-94% translate-x--50% translate-y--50% gap-3 rounded-2xl border-1 border-#303030 bg-#141414 p-7 outline-none sm:max-w-lg"
        >
          <div class="flex flex-col gap-3 pb-6">
            <AlertDialog.Title class="text-lg font-bold"
              >Replace or Skip Files
            </AlertDialog.Title>
            <AlertDialog.Description class="text-sm text-content-90 opacity-70">
              {overwriteDialog.message}
            </AlertDialog.Description>
          </div>
          {#if overwriteDialog.showApplyToAll}
            <div class="flex flex-row justify-start items-center gap-2">
              <Checkbox.Root
                id="applyToAll"
                aria-labelledby="applyToAll-label"
                bind:checked={overwriteDialog.applyToAll}
                class="peer flex w-4 h-4 items-center justify-center rounded border-1 border-#303030 transition-all duration-150 ease-in-out active:scale-98 data-[state=unchecked]:border-border-input data-[state=unchecked]:bg-background data-[state=unchecked]:hover:border-#606060"
              >
                <Checkbox.Indicator
                  let:isChecked
                  class="inline-flex items-center justify-center text-background"
                >
                  {#if isChecked}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15px"
                      height="15px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="m5 13l4 4L19 7"
                      />
                    </svg>
                  {/if}
                </Checkbox.Indicator>
              </Checkbox.Root>
              <Label.Root
                id="applyToAll-label"
                for="applyToAll"
                class="text-sm vertical-top"
              >
                Apply for remaining files
              </Label.Root>
            </div>
          {/if}
          <div class="flex w-full items-center justify-center gap-2">
            <AlertDialog.Cancel
              on:click={() => {
                overwriteDialog.resolve({
                  overwrite: false,
                  applyToAll: overwriteDialog.applyToAll,
                });
              }}
              class="btn w-full"
            >
              Skip
            </AlertDialog.Cancel>
            <AlertDialog.Action
              on:click={() => {
                overwriteDialog.resolve({
                  overwrite: true,
                  applyToAll: overwriteDialog.applyToAll,
                });
              }}
              class="w-full rounded-2 px-5 py-3 text-sm whitespace-nowrap transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
            >
              Overwrite
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    <div class="absolute bottom-0 bg-inherit h-1 w-full overflow-hidden">
      <div
        class="bg-[orangered] h-full transition-width duration-100 ease-in"
        style="width: {totalProgress * 100}%"
      ></div>
    </div>
  </div>
{:else}
  <div
    in:blur={{ duration: 300, delay: 300 }}
    out:blur={{ duration: 300 }}
    class="relative flex flex-col items-center justify-center h-full overflow-hidden"
  >
    <div
      role="region"
      aria-label="File drop zone"
      data-dragging={fileSelection.isDragging}
      class="flex flex-col justify-center items-center gap-4 transition-all duration-300 ease w-96 h-64 bg-#141414 border-1 border-#303030 border-dashed rounded-xl data-[dragging=true]:bg-background data-[dragging=true]:border-1 data-[dragging=true]:border-#606060"
    >
      <UploadIcon class="w-8 h-8" />
      <div class="text-center leading-8 mb-2">
        <p>Drag and drop your file to compress</p>
        <p class="text-sm text-content-90 opacity-70">
          Compress video files by up to 90%
        </p>
      </div>
      <button
        on:click={openFileSelector}
        class="rounded-2 px-5 py-3 text-sm whitespace-nowrap select-none transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
        >Select
      </button>
    </div>
  </div>
{/if}
