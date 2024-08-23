use std::time::Instant;
use tauri::Emitter;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

#[derive(serde::Serialize, Debug)]
struct ProgressInfo {
    progress: f32,
    frame: i32,
    fps: f32,
    total_size: i64,
    out_time: i64,
    bitrate: f32,
    speed: f32,
    finished: bool,
    elapsed_ms: u128,
}

#[tauri::command]
async fn run_ffmpeg_with_progress(
    app: tauri::AppHandle,
    window: tauri::Window,
    args: Vec<String>,
) -> Result<(), String> {
    let start_time = Instant::now();
    let mut duration_ms = 0;
    let ffmpeg_command = app.shell().sidecar("ffmpeg").map_err(|e| e.to_string())?;

    let (mut rx, _child) = ffmpeg_command
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;

    let mut info = ProgressInfo {
        progress: 0.0,
        frame: 0,
        fps: 0.0,
        total_size: 0,
        out_time: 0,
        bitrate: 0.0,
        speed: 0.0,
        finished: false,
        elapsed_ms: 0,
    };

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                let line_str = String::from_utf8_lossy(&line).to_string();
                let parts: Vec<&str> = line_str.split('=').collect();

                if parts.len() == 2 {
                    match parts[0].trim() {
                        "frame" => info.frame = parts[1].trim().parse().unwrap_or(info.frame),
                        "fps" => info.fps = parts[1].trim().parse().unwrap_or(info.fps),
                        "total_size" => {
                            info.total_size = parts[1].trim().parse().unwrap_or(info.total_size);
                        }
                        "out_time" => {
                            info.out_time = parse_time(parts[1].trim());
                        }
                        "bitrate" => {
                            info.bitrate = parts[1]
                                .trim()
                                .trim_end_matches("kbits/s")
                                .parse()
                                .unwrap_or(info.bitrate);
                        }
                        "speed" => {
                            info.speed = parts[1]
                                .trim()
                                .trim_end_matches('x')
                                .parse()
                                .unwrap_or(info.speed);
                        }
                        _ => {}
                    }
                }

                if duration_ms > 0 {
                    info.progress = (info.out_time as f32 / duration_ms as f32).min(1.0);
                    info.finished = false;
                    info.elapsed_ms = start_time.elapsed().as_millis();
                    window
                        .emit("ffmpeg-progress", &info)
                        .map_err(|e| e.to_string())?;
                }
            }
            CommandEvent::Stderr(line) => {
                let line_str = String::from_utf8_lossy(&line);
                let trimmed_line = line_str.trim();
                if trimmed_line.starts_with("Duration: ") {
                    let duration_str = trimmed_line.trim_start_matches("Duration: ");
                    if let Some(duration) = duration_str.split(',').next() {
                        duration_ms = parse_time(duration);
                    }
                }
                window
                    .emit("ffmpeg-error", &line_str)
                    .map_err(|e| e.to_string())?;
            }
            CommandEvent::Terminated(_) => {
                info.progress = 1.0;
                info.finished = true;
                info.elapsed_ms = start_time.elapsed().as_millis();
                window
                    .emit("ffmpeg-progress", &info)
                    .map_err(|e| e.to_string())?;
            }
            _ => {}
        }
    }

    Ok(())
}

fn parse_time(time_str: &str) -> i64 {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() == 3 {
        let hours: i64 = parts[0].parse().unwrap_or(0);
        let minutes: i64 = parts[1].parse().unwrap_or(0);
        let seconds: f64 = parts[2].parse().unwrap_or(0.0);
        return (hours * 3600 + minutes * 60) * 1000 + (seconds * 1000.0) as i64;
    }
    0
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![run_ffmpeg_with_progress])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
