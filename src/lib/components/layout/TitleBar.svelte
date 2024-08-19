<script>
	import { getCurrentWindow } from "@tauri-apps/api/window";

	let isMaximized = $state(false);
	let appWindow = getCurrentWindow();

	async function minimize() {
		await appWindow.minimize();
	}

	async function maximize() {
		isMaximized = await appWindow.isMaximized();
		if (isMaximized) {
			await appWindow.unmaximize();
		} else {
			await appWindow.maximize();
		}
		isMaximized = await appWindow.isMaximized();
	}

	async function close() {
		await appWindow.close();
	}
</script>

<div data-tauri-drag-region class="h-6 flex w-full justify-end select-none">
	<!-- minimize button -->
	<button
		class="inline-flex justify-center items-center w-8 h-6 bg-inherit hover:bg-background-70"
		onclick={minimize}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12px"
			height="12px"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M3.996 13H20a1 1 0 1 0 0-2H3.996a1 1 0 1 0 0 2"
			/>
		</svg>
	</button>
	<!-- maximize button -->
	<button
		class="inline-flex justify-center items-center w-8 h-6 bg-inherit hover:bg-background-70"
		onclick={maximize}
	>
		{#if isMaximized}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12px"
				height="12px"
				viewBox="0 0 24 24"
			>
				<path
					fill="currentColor"
					d="M16 20v-9H4v9zm2-5v-2h2V4H8v5H6V4q0-.825.588-1.412T8 2h12q.825 0 1.413.588T22 4v9q0 .825-.587 1.413T20 15zM4 22q-.825 0-1.412-.587T2 20v-9q0-.825.588-1.412T4 9h12q.825 0 1.413.588T18 11v9q0 .825-.587 1.413T16 22zm6-6.5"
				/>
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12px"
				height="12px"
				viewBox="0 0 24 24"
			>
				<path
					fill="currentColor"
					d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3m0 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"
				/>
			</svg>
		{/if}
	</button>
	<!-- close button -->
	<button
		class="inline-flex justify-center items-center w-8 h-6 bg-inherit hover:bg-red-7"
		onclick={close}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12px"
			height="12px"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M10.586 12L2.793 4.207l1.414-1.414L12 10.586l7.793-7.793l1.414 1.414L13.414 12l7.793 7.793l-1.414 1.414L12 13.414l-7.793 7.793l-1.414-1.414z"
			/>
		</svg>
	</button>
</div>
