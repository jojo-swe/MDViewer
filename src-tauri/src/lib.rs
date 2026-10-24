use serde::Serialize;
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};

static TEMP_FILE_COUNTER: AtomicU64 = AtomicU64::new(0);

fn sibling_work_path(path: &Path, kind: &str) -> Result<PathBuf, String> {
    let parent = path
        .parent()
        .ok_or_else(|| "The destination has no parent directory".to_string())?;
    let filename = path
        .file_name()
        .ok_or_else(|| "The destination has no file name".to_string())?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_nanos();
    let sequence = TEMP_FILE_COUNTER.fetch_add(1, Ordering::Relaxed);
    Ok(parent.join(format!(
        ".{}.mdviewer-{}-{}-{}.{}",
        filename.to_string_lossy(),
        std::process::id(),
        timestamp,
        sequence,
        kind
    )))
}

fn write_and_sync(path: &Path, content: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|error| format!("Failed to create temporary save file: {error}"))?;

    if let Err(error) = file.write_all(content).and_then(|_| file.sync_all()) {
        drop(file);
        let _ = fs::remove_file(path);
        return Err(format!("Failed to write temporary save file: {error}"));
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn replace_file(temp_path: &Path, destination: &Path) -> Result<(), String> {
    fs::rename(temp_path, destination).map_err(|error| {
        let _ = fs::remove_file(temp_path);
        format!("Failed to replace destination file: {error}")
    })
}

#[cfg(target_os = "windows")]
fn replace_file(temp_path: &Path, destination: &Path) -> Result<(), String> {
    if !destination.exists() {
        return fs::rename(temp_path, destination).map_err(|error| {
            let _ = fs::remove_file(temp_path);
            format!("Failed to move saved file into place: {error}")
        });
    }

    let backup_path = sibling_work_path(destination, "bak")?;
    fs::rename(destination, &backup_path).map_err(|error| {
        format!("Failed to protect the existing file before replacement: {error}")
    })?;

    if let Err(error) = fs::rename(temp_path, destination) {
        let restore_result = fs::rename(&backup_path, destination);
        let _ = fs::remove_file(temp_path);
        return match restore_result {
      Ok(()) => Err(format!("Failed to replace destination file; the original was restored: {error}")),
      Err(restore_error) => Err(format!(
        "Failed to replace destination file and could not restore the backup at {}: {error}; restore error: {restore_error}",
        backup_path.display()
      )),
    };
    }

    // Replacement succeeded. A cleanup failure is non-fatal because the target
    // contains the fully flushed new content and the backup remains recoverable.
    let _ = fs::remove_file(backup_path);
    Ok(())
}

#[derive(Debug, PartialEq, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
enum AtomicWriteResult {
    Saved,
    Conflict {
        reason: &'static str,
        #[serde(rename = "diskContent", skip_serializing_if = "Option::is_none")]
        disk_content: Option<String>,
    },
}

fn detect_external_change(
    path: &Path,
    expected_content: Option<&str>,
) -> Result<Option<AtomicWriteResult>, String> {
    let Some(expected_content) = expected_content else {
        return Ok(None);
    };

    match fs::read_to_string(path) {
        Ok(disk_content) if disk_content == expected_content => Ok(None),
        Ok(disk_content) => Ok(Some(AtomicWriteResult::Conflict {
            reason: "changed",
            disk_content: Some(disk_content),
        })),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            Ok(Some(AtomicWriteResult::Conflict {
                reason: "deleted",
                disk_content: None,
            }))
        }
        Err(error) => Err(format!("Failed to verify destination file: {error}")),
    }
}

fn atomic_write_text_file_impl(
    path: &Path,
    content: &str,
    expected_content: Option<&str>,
) -> Result<AtomicWriteResult, String> {
    if path.exists() && !path.is_file() {
        return Err("The destination exists but is not a regular file".to_string());
    }
    if let Some(conflict) = detect_external_change(path, expected_content)? {
        return Ok(conflict);
    }

    let temp_path = sibling_work_path(path, "tmp")?;
    write_and_sync(&temp_path, content.as_bytes())?;

    // Check again immediately before replacement so changes that happened
    // while the temporary file was being written are also protected.
    if let Some(conflict) = detect_external_change(path, expected_content)? {
        let _ = fs::remove_file(temp_path);
        return Ok(conflict);
    }

    replace_file(&temp_path, path)?;
    Ok(AtomicWriteResult::Saved)
}

#[tauri::command]
fn atomic_write_text_file(
    path: String,
    content: String,
    expected_content: Option<String>,
) -> Result<AtomicWriteResult, String> {
    atomic_write_text_file_impl(Path::new(&path), &content, expected_content.as_deref())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![atomic_write_text_file])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_directory(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!(
            "mdviewer-{name}-{}-{}",
            std::process::id(),
            TEMP_FILE_COUNTER.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).expect("create test directory");
        path
    }

    #[test]
    fn creates_and_replaces_a_text_file() {
        let directory = test_directory("atomic-write");
        let destination = directory.join("document.md");

        atomic_write_text_file_impl(&destination, "first", None).expect("create file");
        atomic_write_text_file_impl(&destination, "second", Some("first")).expect("replace file");

        assert_eq!(fs::read_to_string(&destination).unwrap(), "second");
        let leftovers = fs::read_dir(&directory)
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| entry.file_name().to_string_lossy().contains(".mdviewer-"))
            .count();
        assert_eq!(leftovers, 0);
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn refuses_to_replace_a_directory() {
        let directory = test_directory("directory-destination");
        let destination = directory.join("not-a-file.md");
        fs::create_dir(&destination).unwrap();

        let result = atomic_write_text_file_impl(&destination, "content", None);

        assert!(result.is_err());
        assert!(destination.is_dir());
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn blocks_replacement_when_the_file_changed_externally() {
        let directory = test_directory("changed-file");
        let destination = directory.join("document.md");
        fs::write(&destination, "external edit").unwrap();

        let result = atomic_write_text_file_impl(&destination, "my edit", Some("original"))
            .expect("return conflict");

        assert_eq!(
            result,
            AtomicWriteResult::Conflict {
                reason: "changed",
                disk_content: Some("external edit".to_string()),
            }
        );
        assert_eq!(fs::read_to_string(&destination).unwrap(), "external edit");
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn blocks_recreation_when_the_file_was_deleted_externally() {
        let directory = test_directory("deleted-file");
        let destination = directory.join("document.md");

        let result = atomic_write_text_file_impl(&destination, "my edit", Some("original"))
            .expect("return conflict");

        assert_eq!(
            result,
            AtomicWriteResult::Conflict {
                reason: "deleted",
                disk_content: None,
            }
        );
        assert!(!destination.exists());
        fs::remove_dir_all(directory).unwrap();
    }
}
