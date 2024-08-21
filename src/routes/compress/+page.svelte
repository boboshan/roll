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
	import Uploade from "$lib/icons/Uploade.svelte";

	let output = $state("");
	let error = $state("");

	let overallProgressInfo = $state({
		totalFiles: 0,
	});

	let completed = -1;

	let progressInfo = $state({
		progress: 0,
		frame: 0,
		fps: 0,
		totalSize: 0,
		outTime: 0,
		bitrate: 0,
		speed: 0,
	});

	let overallProgress = $derived.by(() => {
		if (overallProgressInfo.totalFiles > 0) {
			if (progressInfo.progress === 0) {
				completed += 1;
				return completed / overallProgressInfo.totalFiles;
			}
			return (
				(completed + progressInfo.progress) / overallProgressInfo.totalFiles
			);
		}
		return 0;
	});

	let isComplete = $derived(!(overallProgress < 1));

	let dialog = $state({
		open: false,
		message: "",
		applyForRest: false,
		resolve: null,
	});

	let dropzone = $state({
		files: [],
		isDragging: false,
	});

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

	function reset() {
		dropzone.files = [];
		progressInfo = {
			progress: 0,
			frame: 0,
			fps: 0,
			totalSize: 0,
			outTime: 0,
			bitrate: 0,
			speed: 0,
		};
		overallProgressInfo = {
			totalFiles: 0,
		};
		completed = 0;
		error = "";
	}

	function getUserChoice(fileName) {
		return new Promise((resolve) => {
			dialog.open = true;
			dialog.message = `File "${fileName}" already exists. Overwrite?`;
			dialog.applyForRest = false;
			dialog.resolve = resolve;
		});
	}

	async function getProcessInfo(filePaths) {
		let folderExists = false;
		let processInfo = [];
		let globalOverwrite = null;

		for (const inputPath of filePaths) {
			const inputFolder = await dirname(inputPath);
			const inputExtension = await extname(inputPath);
			const inputFileName = await basename(inputPath);
			const outputFolder = await join(inputFolder, "_output");
			const outputfileName = inputFileName;
			const outputExtension = "mp4";
			const outputPath = await join(
				outputFolder,
				outputfileName.replace(inputExtension, outputExtension)
			);

			if (!folderExists) {
				folderExists = await exists(outputFolder);

				if (!folderExists) {
					await mkdir(outputFolder);
				}
			}

			const fileExists = await exists(outputPath);

			if (fileExists) {
				if (globalOverwrite === null) {
					const { overwrite, applyForRest } =
						await getUserChoice(inputFileName);
					if (applyForRest) {
						globalOverwrite = overwrite;
					}
					if (!overwrite) continue;
				}
				if (globalOverwrite === false) {
					continue;
				}
			}

			processInfo.push({
				inputPath,
				outputPath,
				fileExists,
			});
		}
		return processInfo;
	}

	async function compress() {
		const processInfo = await getProcessInfo(dropzone.files);
		overallProgressInfo.totalFiles = processInfo.length;

		for (const info of processInfo) {
			const args = [
				"-i",
				info.inputPath,
				"-c:v",
				"libx265",
				"-crf",
				"26",
				"-preset",
				"slow",
				"-progress",
				"pipe:1",
				info.outputPath,
			];

			if (info.fileExists) {
				args.push("-y");
			}

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

		const unlistenProgressInto = await listen("ffmpeg-progress", (event) => {
			const info = event.payload;
			progressInfo.progress = info.progress;
			progressInfo.frame = info.frame;
			progressInfo.fps = info.fps;
			progressInfo.totalSize = info.total_size;
			progressInfo.outTime = info.out_time;
			progressInfo.bitrate = info.bitrate;
			progressInfo.speed = info.speed;
		});

		const unlistenError = await listen("ffmpeg-error", (event) => {
			console.error("FFmpeg error:", event.payload);
			error = event.payload;
		});

		const unlistenInfo = await listen("ffmpeg-info", (event) => {
			console.log("FFmpeg info:", event.payload);
			output += event.payload + "\n";
		});

		return () => {
			unlistenDragEnter;
			unlistenDragLeave;
			unlistenDragDrop;
			unlistenProgressInto;
			unlistenError;
			unlistenInfo;
		};
	});
</script>

{#if dropzone.files.length > 0}
	<div
		in:blur={{ duration: 300, delay: 300 }}
		out:blur={{ duration: 300 }}
		class="relative w-full h-full overflow-hidden"
	>
		{#if isComplete}
			<div
				in:blur={{ duration: 300, delay: 300 }}
				out:blur={{ duration: 300 }}
				class="flex w-full h-full items-center justify-center"
			>
				<button
					onclick={reset}
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
					onclick={compress}
					class="rounded-2 px-5 py-3 mr-2 text-sm whitespace-nowrap select-none transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
				>
					Compress
				</button>
				<button
					onclick={reset}
					class="rounded-2 px-5 py-3 text-sm whitespace-nowrap select-none transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
				>
					Reset
				</button>
			</div>
		{/if}
		<AlertDialog.Root bind:open={dialog.open}>
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
							{dialog.message}
						</AlertDialog.Description>
					</div>
					{#if overallProgressInfo.totalFiles > 1}
						<div class="flex flex-row justify-start items-center gap-2">
							<Checkbox.Root
								id="applyForRest"
								aria-labelledby="applyForRest-label"
								bind:checked={dialog.applyForRest}
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
								id="applyForRest-label"
								for="applyForRest"
								class="text-sm vertical-top"
							>
								Apply for remaining files
							</Label.Root>
						</div>
					{/if}
					<div class="flex w-full items-center justify-center gap-2">
						<AlertDialog.Cancel
							onclick={() => {
								dialog.resolve({
									overwrite: false,
									applyForRest: dialog.applyForRest,
								});
							}}
							class="btn w-full"
						>
							Skip
						</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() => {
								dialog.resolve({
									overwrite: true,
									applyForRest: dialog.applyForRest,
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
				style="width: {overallProgress * 100}%"
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
			data-dragging={dropzone.isDragging}
			class="flex flex-col justify-center items-center gap-4 transition-all duration-300 ease w-96 h-64 bg-#141414 border-1 border-#303030 border-dashed rounded-xl data-[dragging=true]:bg-background data-[dragging=true]:border-1 data-[dragging=true]:border-#606060"
		>
			<Uploade class="w-8 h-8" />
			<div class="text-center leading-8 mb-2">
				<p>Drag and drop your file to compress</p>
				<p class="text-sm text-content-90 opacity-70">
					Compress video files by up to 90%
				</p>
			</div>
			<button
				onclick={selectInputFile}
				class="rounded-2 px-5 py-3 text-sm whitespace-nowrap select-none transition-border-color duration-200 cursor-pointer bg-#f3f3f3 text-#141414 font-500 hover:bg-content"
				>Select
			</button>
		</div>
	</div>
{/if}
