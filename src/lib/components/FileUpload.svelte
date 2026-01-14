<script lang="ts">
	import { video } from '$lib/state/video-manager.svelte';
	import { Upload } from 'lucide-svelte';

	let { onFileSelected }: { onFileSelected?: (file: File) => void } = $props();
	let isDragOver = $state(false);

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			video.load(file);
			onFileSelected?.(file);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			if (file.type.startsWith('video/')) {
				video.load(file);
				onFileSelected?.(file);
			}
		}
	}

	function handleClick() {
		if (video.status === 'idle' || video.status === 'loading') return;
		document.getElementById('file-input')?.click();
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	const isLoading = $derived(video.status === 'idle' || video.status === 'loading');
</script>

{#if isLoading}
	<!-- Loading FFmpeg placeholder -->
	<div class="p-8 text-center card flex flex-col min-h-[220px] items-center justify-center md:p-12">
		<div class="mx-auto mb-4 rounded-2xl bg-muted flex h-16 w-16 items-center justify-center">
			<div
				class="border-3 border-surface-300 border-t-primary-500 rounded-full h-8 w-8 animate-spin dark:border-surface-600"
			></div>
		</div>
		<h3 class="text-lg text-muted font-semibold mb-2">Preparing video engine...</h3>
		<p class="text-sm text-subtle">Loading FFmpeg (first time may take a moment)</p>
		<p class="text-xs text-subtle mt-3 invisible">Placeholder</p>
	</div>
{:else}
	<div
		class={[
			'card p-8 md:p-12 text-center cursor-pointer transition-all duration-200 group min-h-[220px] flex flex-col items-center justify-center',
			'border-2 border-dashed',
			isDragOver
				? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 scale-[1.02]'
				: 'border-surface-300 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-lg'
		]}
		ondragover={(e) => {
			e.preventDefault();
			isDragOver = true;
		}}
		ondragleave={() => (isDragOver = false)}
		ondrop={handleDrop}
		onclick={handleClick}
		role="button"
		tabindex="0"
		onkeypress={handleKeyPress}
	>
		<input
			id="file-input"
			type="file"
			accept="video/*"
			class="hidden"
			onchange={handleFileChange}
		/>
		<div
			class={[
				'mx-auto mb-4 rounded-2xl flex h-16 w-16 items-center justify-center transition-all duration-200',
				isDragOver
					? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 scale-110'
					: 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 group-hover:scale-105'
			]}
		>
			<Upload class={`h-8 w-8 ${isDragOver ? 'animate-bounce' : ''}`} />
		</div>
		<h3 class="text-lg text-base font-semibold mb-2">
			{isDragOver ? 'Drop your video here' : 'Choose a video file'}
		</h3>
		<p class="text-sm text-muted">
			{isDragOver ? 'Release to upload' : 'Drag & drop or click to browse'}
		</p>
		<p class="text-xs text-subtle mt-3">Supports MP4, WebM, MOV, and more</p>
	</div>
{/if}
