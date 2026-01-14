import { FFmpeg } from '@ffmpeg/ffmpeg';
import { browser } from '$app/environment';

type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error';

interface ToolResult {
	url: string;
	size: number;
}

// IndexedDB cache for FFmpeg WASM files
const DB_NAME = 'ffmpeg-cache';
const DB_VERSION = 1;
const STORE_NAME = 'files';

async function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME);
		};
	});
}

async function getCached(key: string): Promise<ArrayBuffer | null> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const request = tx.objectStore(STORE_NAME).get(key);
			request.onsuccess = () => resolve(request.result ?? null);
			request.onerror = () => resolve(null);
		});
	} catch {
		return null;
	}
}

async function setCache(key: string, value: ArrayBuffer): Promise<void> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readwrite');
			tx.objectStore(STORE_NAME).put(value, key);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	} catch {
		// Ignore cache errors
	}
}

async function fetchAsBlobURL(url: string, mimeType: string): Promise<string> {
	// Check IndexedDB cache first (stores ArrayBuffer, not blob URL)
	const cached = await getCached(url);
	if (cached && cached instanceof ArrayBuffer && cached.byteLength > 0) {
		console.log(`[FFmpeg] Using cached: ${url.split('/').pop()}`);
		return URL.createObjectURL(new Blob([cached], { type: mimeType }));
	}

	// Fetch, cache the ArrayBuffer, return blob URL
	console.log(`[FFmpeg] Downloading: ${url.split('/').pop()}`);
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();

	// Cache ArrayBuffer for next time (don't await - fire and forget)
	setCache(url, arrayBuffer);

	return URL.createObjectURL(new Blob([arrayBuffer], { type: mimeType }));
}

class VideoManager {
	// Source file (immutable after load)
	file = $state<File | null>(null);
	sourceUrl = $state('');
	sourceSize = $state(0);
	duration = $state(0);

	// Per-tool results
	results = $state<Record<string, ToolResult>>({});

	// Processing state
	status = $state<Status>('idle');
	progress = $state(0);
	error = $state('');
	log = $state('');

	// Current tool context
	activeTool = $state('');
	isOptimal = $state(false); // Replaces alreadyCompressed

	// FFmpeg instance (non-reactive)
	#ffmpeg: FFmpeg | null = null;

	// Getters for current tool
	get result() {
		return this.results[this.activeTool];
	}

	get hasResult() {
		return !!this.result;
	}

	get resultUrl() {
		return this.result?.url ?? '';
	}

	get resultSize() {
		return this.result?.size ?? 0;
	}

	get ffmpeg() {
		return this.#ffmpeg;
	}

	// File utilities
	get extension() {
		if (!this.file) return '.mp4';
		const name = this.file.name;
		const i = name.lastIndexOf('.');
		return i >= 0 ? name.substring(i).toLowerCase() : '.mp4';
	}

	get mimeType() {
		return this.file?.type || 'video/mp4';
	}

	/** Initialize FFmpeg - call once on app start */
	async init() {
		if (!browser) return;
		if (this.#ffmpeg) return this.#ffmpeg;

		try {
			this.status = 'loading';
			const ffmpeg = new FFmpeg();

			ffmpeg.on('log', ({ message }) => {
				this.log = message;
				this.#parseProgress(message);
			});

			// Load from unpkg CDN to avoid Cloudflare's 25MB asset limit
			// Files are cached in IndexedDB after first load
			const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
			await ffmpeg.load({
				coreURL: await fetchAsBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
				wasmURL: await fetchAsBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
			});

			this.#ffmpeg = ffmpeg;
			this.status = 'ready';
			return ffmpeg;
		} catch (e) {
			console.error(e);
			this.error = 'Failed to load FFmpeg';
			this.status = 'error';
			throw e;
		}
	}

	#parseProgress(msg: string) {
		if (this.duration <= 0) return;

		const match = msg.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
		if (match) {
			const [, h, m, s] = match;
			const seconds = parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
			this.progress = Math.min((seconds / this.duration) * 100, 100);
		}
	}

	/** Load a video file */
	load(file: File) {
		this.unload();
		this.file = file;
		this.sourceSize = file.size;
		this.sourceUrl = URL.createObjectURL(file);
	}

	/** Unload current file and cleanup */
	unload() {
		if (this.sourceUrl) URL.revokeObjectURL(this.sourceUrl);
		for (const r of Object.values(this.results)) {
			if (r.url) URL.revokeObjectURL(r.url);
		}

		this.file = null;
		this.sourceUrl = '';
		this.sourceSize = 0;
		this.duration = 0;
		this.results = {};
		this.progress = 0;
		this.isOptimal = false;
		this.status = 'ready';
		this.error = '';
		this.log = '';
		this.activeTool = '';
	}

	/** Switch to a different tool */
	use(tool: string) {
		this.activeTool = tool;
		this.status = this.results[tool] ? 'done' : this.#ffmpeg ? 'ready' : 'idle';
		this.progress = 0;
		this.isOptimal = false;
		this.error = '';
	}

	/** Save result for current tool */
	saveResult(url: string, size: number) {
		const prev = this.results[this.activeTool];
		if (prev?.url) URL.revokeObjectURL(prev.url);
		this.results[this.activeTool] = { url, size };
		this.status = 'done';
	}

	/** Clear result for current tool */
	clearResult() {
		const result = this.results[this.activeTool];
		if (result?.url) URL.revokeObjectURL(result.url);
		delete this.results[this.activeTool];
		this.isOptimal = false;
		this.status = 'ready';
		this.progress = 0;
	}

	/** Start processing */
	startProcessing() {
		this.status = 'processing';
		this.progress = 0;
		this.isOptimal = false;
	}

	/** Generate download filename */
	downloadName(suffix: string) {
		const name = this.file?.name || 'video.mp4';
		const i = name.lastIndexOf('.');
		return i >= 0 ? `${name.substring(0, i)}_${suffix}${name.substring(i)}` : `${name}_${suffix}`;
	}

	/** Format bytes to human readable */
	formatBytes(bytes: number, decimals = 2) {
		if (!bytes) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
	}
}

// Singleton export
export const video = new VideoManager();
