<script>
  import { open } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";
  import { mkdir, exists } from "@tauri-apps/plugin-fs";
  import { event } from "@tauri-apps/api";
  import { dirname, extname, join, basename } from "@tauri-apps/api/path";
  import Uploade from "$lib/icons/Uploade.svelte";
  import { blur } from "svelte/transition";

  let dropzone = $state({
    files: [],
    isDragging: false,
  });

  // let dragCounter = 0;

  // function handleDragEnter(e) {
  //   e.preventDefault();
  //   dragCounter++;
  //   dropzone.isDragging = true;
  // }

  // function handleDragLeave(e) {
  //   e.preventDefault();
  //   dragCounter--;
  //   if (dragCounter === 0) {
  //     dropzone.isDragging = false;
  //   }
  // }

  // function handleDragOver(e) {
  //   e.preventDefault();
  // }

  // function handleDrop(e) {
  //   e.preventDefault();
  //   dropzone.isDragging = false;
  //   dragCounter = 0;
  // }

  async function selectInputFile() {
    const selected = await open({
      multiple: true,
      title: "Select Video File",
      filters: [
        {
          name: "Video",
          extensions: ["mp4", "avi", "mov"],
        },
      ],
    });
    if (selected) {
      dropzone.files = selected.map((f) => f.path);
    }
  }

  async function compress() {
    for (const path of dropzone.files) {
      const input = path;
      const inputFolder = await dirname(path);
      const inputExtension = await extname(path);
      const inputFileName = await basename(path);
      const outputFolder = await join(inputFolder, "_output");
      const outputExtension = "mp4";

      const output = await join(
        outputFolder,
        inputFileName.replace(inputExtension, outputExtension)
      );

      const folderExists = await exists(outputFolder);

      if (!folderExists) {
        await mkdir(outputFolder);
      }

      const args = ["-i", input, "-crf", "26", "-preset", "slow", output];

      try {
        await invoke("run_ffmpeg_with_progress", { args });
      } catch (err) {
        console.error("FFmpeg error:", err);
        error = err.toString();
      }
    }
  }

  $effect(async () => {
    const unlistenDragEnter = await event.listen("tauri://drag-enter", (e) => {
      dropzone.isDragging = true;
    });
    const unlistenDragLeave = await event.listen("tauri://drag-leave", (e) => {
      dropzone.isDragging = false;
    });
    const unlistenDragDrop = await event.listen("tauri://drag-drop", (e) => {
      dropzone.files = e.payload.paths;
      dropzone.isDragging = false;
    });

    return () => {
      unlistenDragEnter;
      unlistenDragLeave;
      unlistenDragDrop;
    };
  });
</script>

{#if dropzone.files.length > 0}
  <div
    in:blur={{ duration: 300, delay: 300 }}
    out:blur={{ duration: 300 }}
    class="flex flex-col items-center justify-center h-full overflow-hidden"
  >
    <div>
      <button
        onclick={compress}
        class="rounded-2 px-5 py-3 text-sm whitespace-nowrap transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
        >Compress
      </button>
      <button
        onclick={() => {
          dropzone.files = [];
        }}
        class="rounded-2 px-5 py-3 text-sm whitespace-nowrap transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
      >
        Re-select
      </button>
    </div>
  </div>
{:else}
  <div
    in:blur={{ duration: 300, delay: 300 }}
    out:blur={{ duration: 300 }}
    class="flex flex-col items-center justify-center h-full overflow-hidden"
  >
    <div
      role="region"
      aria-label="File drop zone"
      data-dragging={dropzone.isDragging}
      class="flex flex-col justify-center items-center gap-5 transition-all duration-300 ease w-96 h-64 bg-#141414 border-1 border-#303030 border-dashed rounded-xl data-[dragging=true]:bg-background data-[dragging=true]:border-1 data-[dragging=true]:border-#606060"
    >
      <Uploade class="w-8 h-8" />
      <div class="text-center leading-8">
        <p>Drag and drop your file to compress</p>
        <p class="text-sm text-content-90 opacity-70">
          Compress video files by up to 90%
        </p>
      </div>
      <button
        onclick={selectInputFile}
        class="rounded-2 px-5 py-3 text-sm whitespace-nowrap transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
        >Select File</button
      >
    </div>
  </div>
{/if}
