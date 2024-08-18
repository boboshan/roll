export const ffmpegOptions = {
	"c:v": {
		label: "Video Codec",
		value: "-c:v",
		type: "select",
		category: "video",
		description: "Specify the video codec to use for encoding.",
		options: [
			{ label: "H.264", value: "libx264" },
			{ label: "H.265", value: "libx265" },
			{ label: "VP9", value: "libvpx-vp9" },
			{ label: "AV1", value: "libaom-av1" },
			{ label: "ProRes", value: "prores" },
			{ label: "Copy", value: "copy" },
		],
	},

	"c:a": {
		label: "Audio Codec",
		value: "-c:a",
		type: "select",
		category: "audio",
		description: "Specify the audio codec to use for encoding.",
		options: [
			{ label: "AAC", value: "aac" },
			{ label: "MP3", value: "libmp3lame" },
			{ label: "Opus", value: "libopus" },
			{ label: "FLAC", value: "flac" },
			{ label: "Copy", value: "copy" },
		],
	},

	crf: {
		label: "CRF",
		value: "-crf",
		type: "input",
		category: "video",
		description:
			"Constant Rate Factor: balance between quality and file size (0-51, lower is better quality).",
	},

	preset: {
		label: "Preset",
		value: "-preset",
		type: "select",
		category: "video",
		description: "Encoding speed to compression ratio preset.",
		options: [
			{ label: "Ultrafast", value: "ultrafast" },
			{ label: "Superfast", value: "superfast" },
			{ label: "Veryfast", value: "veryfast" },
			{ label: "Faster", value: "faster" },
			{ label: "Fast", value: "fast" },
			{ label: "Medium", value: "medium" },
			{ label: "Slow", value: "slow" },
			{ label: "Slower", value: "slower" },
			{ label: "Veryslow", value: "veryslow" },
		],
	},

	"b:v": {
		label: "Video Bitrate",
		value: "-b:v",
		type: "input",
		category: "video",
		description: "Set the video bitrate (e.g., 1M for 1 Mbps).",
	},

	"b:a": {
		label: "Audio Bitrate",
		value: "-b:a",
		type: "input",
		category: "audio",
		description: "Set the audio bitrate (e.g., 128k for 128 kbps).",
	},

	s: {
		label: "Resolution",
		value: "-s",
		type: "input",
		category: "video",
		description: "Set the video resolution (e.g., 1920x1080).",
	},

	r: {
		label: "Frame Rate",
		value: "-r",
		type: "input",
		category: "video",
		description: "Set the frame rate (e.g., 30).",
	},

	aspect: {
		label: "Aspect Ratio",
		value: "-aspect",
		type: "input",
		category: "video",
		description: "Set the aspect ratio (e.g., 16:9).",
	},

	vf: {
		label: "Video Filters",
		value: "-vf",
		type: "input",
		category: "video",
		description: "Set video filtergraph (e.g., 'scale=1280:720').",
	},

	af: {
		label: "Audio Filters",
		value: "-af",
		type: "input",
		category: "audio",
		description: "Set audio filtergraph (e.g., 'aresample=44100').",
	},

	ss: {
		label: "Start Time",
		value: "-ss",
		type: "input",
		category: "general",
		description: "Set the start time for cutting (e.g., 00:01:30).",
	},

	t: {
		label: "Duration",
		value: "-t",
		type: "input",
		category: "general",
		description: "Set the duration for cutting (e.g., 00:00:30).",
	},

	map: {
		label: "Stream Mapping",
		value: "-map",
		type: "input",
		category: "general",
		description: "Set stream mapping (e.g., '0:v:0 0:a:0').",
	},

	threads: {
		label: "Threads",
		value: "-threads",
		type: "input",
		category: "general",
		description: "Set number of threads to use for encoding.",
	},

	movflags: {
		label: "MOV Flags",
		value: "-movflags",
		type: "input",
		category: "format",
		description: "Set MOV muxer flags (e.g., '+faststart').",
	},

	an: {
		label: "Disable Audio",
		value: "-an",
		type: "flag",
		category: "audio",
		description: "Disable audio output.",
	},

	vn: {
		label: "Disable Video",
		value: "-vn",
		type: "flag",
		category: "video",
		description: "Disable video output.",
	},

	sn: {
		label: "Disable Subtitles",
		value: "-sn",
		type: "flag",
		category: "subtitles",
		description: "Disable subtitle output.",
	},
};
