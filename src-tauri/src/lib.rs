use serde::Serialize;
use std::{
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};
use tauri_plugin_fs::FsExt;

static TEMP_FILE_COUNTER: AtomicU64 = AtomicU64::new(0);
static FILE_WRITE_LOCK: Mutex<()> = Mutex::new(());
const MAX_DOCUMENT_BYTES: usize = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES: usize = 10 * 1024 * 1024;

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
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(path)
        .map_err(|error| format!("Failed to create temporary save file: {error}"))?;

    if let Err(error) = file.write_all(content).and_then(|_| file.sync_all()) {
        drop(file);
        let _ = fs::remove_file(path);
        return Err(format!("Failed to write temporary save file: {error}"));
    }
    Ok(())
}

fn read_bounded_text_file_impl(path: &Path) -> Result<String, String> {
    let path_metadata = fs::symlink_metadata(path)
        .map_err(|error| format!("Failed to inspect document: {error}"))?;
    if path_metadata.file_type().is_symlink() {
        return Err("Refusing to open a symbolic link".to_string());
    }
    if !path_metadata.is_file() {
        return Err("The selected path is not a regular file".to_string());
    }

    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    let file = options
        .open(path)
        .map_err(|error| format!("Failed to open document: {error}"))?;
    let metadata = file
        .metadata()
        .map_err(|error| format!("Failed to inspect opened document: {error}"))?;
    if !metadata.is_file() {
        return Err("The selected path is not a regular file".to_string());
    }
    if metadata.len() > MAX_DOCUMENT_BYTES as u64 {
        return Err("The selected document exceeds the 5 MiB limit".to_string());
    }

    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    file.take((MAX_DOCUMENT_BYTES + 1) as u64)
        .read_to_end(&mut bytes)
        .map_err(|error| format!("Failed to read document: {error}"))?;
    if bytes.len() > MAX_DOCUMENT_BYTES {
        return Err("The selected document exceeds the 5 MiB limit".to_string());
    }
    String::from_utf8(bytes)
        .map_err(|_| "The selected document is not valid UTF-8 text".to_string())
}

#[cfg(unix)]
fn preserve_unix_metadata(source: &Path, destination: &Path) -> Result<(), String> {
    use std::{ffi::CString, os::unix::ffi::OsStrExt, os::unix::fs::MetadataExt};

    let source_metadata = fs::metadata(source)
        .map_err(|error| format!("Failed to read destination metadata: {error}"))?;
    let destination_metadata = fs::metadata(destination)
        .map_err(|error| format!("Failed to read temporary-file metadata: {error}"))?;

    if source_metadata.uid() != destination_metadata.uid()
        || source_metadata.gid() != destination_metadata.gid()
    {
        let path = CString::new(destination.as_os_str().as_bytes())
            .map_err(|_| "The temporary-file path contains an invalid null byte".to_string())?;
        let changed =
            unsafe { libc::chown(path.as_ptr(), source_metadata.uid(), source_metadata.gid()) };
        if changed != 0 {
            return Err(format!(
                "Failed to preserve destination ownership: {}",
                std::io::Error::last_os_error()
            ));
        }
    }

    fs::set_permissions(destination, source_metadata.permissions())
        .map_err(|error| format!("Failed to preserve destination permissions: {error}"))?;

    let acl = exacl::getfacl(source, None)
        .map_err(|error| format!("Failed to read destination ACL: {error}"))?;
    exacl::setfacl(&[destination], &acl, None)
        .map_err(|error| format!("Failed to preserve destination ACL: {error}"))?;

    for name in xattr::list(source)
        .map_err(|error| format!("Failed to list destination extended attributes: {error}"))?
    {
        // POSIX ACLs are copied through exacl so they retain platform semantics.
        if name == "system.posix_acl_access" || name == "system.posix_acl_default" {
            continue;
        }
        let value = xattr::get(source, &name)
            .map_err(|error| format!("Failed to read extended attribute {name:?}: {error}"))?
            .ok_or_else(|| format!("Extended attribute {name:?} changed during save"))?;
        xattr::set(destination, &name, &value)
            .map_err(|error| format!("Failed to preserve extended attribute {name:?}: {error}"))?;
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

    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::ReplaceFileW;

    let backup_path = sibling_work_path(destination, "bak")?;
    let destination_wide: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();
    let temp_wide: Vec<u16> = temp_path.as_os_str().encode_wide().chain(Some(0)).collect();
    let backup_wide: Vec<u16> = backup_path
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();

    // ReplaceFileW performs the replacement as one OS operation and merges the
    // original file's ACLs, encryption, compression, streams, and attributes.
    let replaced = unsafe {
        ReplaceFileW(
            destination_wide.as_ptr(),
            temp_wide.as_ptr(),
            backup_wide.as_ptr(),
            0,
            std::ptr::null(),
            std::ptr::null(),
        )
    };
    if replaced == 0 {
        return Err(format!(
            "Failed to replace destination file; recovery files may remain at {} and {}: {}",
            temp_path.display(),
            backup_path.display(),
            std::io::Error::last_os_error()
        ));
    }

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

    match fs::symlink_metadata(path) {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Some(AtomicWriteResult::Conflict {
                reason: "deleted",
                disk_content: None,
            }));
        }
        Err(error) => return Err(format!("Failed to verify destination file: {error}")),
        Ok(_) => {}
    }

    let disk_content = read_bounded_text_file_impl(path)?;
    if disk_content == expected_content {
        Ok(None)
    } else {
        Ok(Some(AtomicWriteResult::Conflict {
            reason: "changed",
            disk_content: Some(disk_content),
        }))
    }
}

fn atomic_write_text_file_impl(
    path: &Path,
    content: &str,
    expected_content: Option<&str>,
) -> Result<AtomicWriteResult, String> {
    let _write_guard = FILE_WRITE_LOCK
        .lock()
        .map_err(|_| "The document write lock is unavailable".to_string())?;

    if path
        .symlink_metadata()
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Refusing to replace a symbolic link; use Save As instead".to_string());
    }
    if path.exists() && !path.is_file() {
        return Err("The destination exists but is not a regular file".to_string());
    }
    if let Some(conflict) = detect_external_change(path, expected_content)? {
        return Ok(conflict);
    }

    let temp_path = sibling_work_path(path, "tmp")?;
    write_and_sync(&temp_path, content.as_bytes())?;

    #[cfg(unix)]
    if path.exists() {
        if let Err(error) = preserve_unix_metadata(path, &temp_path) {
            let _ = fs::remove_file(&temp_path);
            return Err(error);
        }
    }

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
    window: tauri::Window,
    path: String,
    content: String,
    expected_content: Option<String>,
) -> Result<AtomicWriteResult, String> {
    let destination = Path::new(&path);
    if !window.fs_scope().is_allowed(destination) {
        return Err("The destination was not approved by a file dialog".to_string());
    }
    atomic_write_text_file_impl(destination, &content, expected_content.as_deref())
}

#[tauri::command]
fn read_bounded_text_file(window: tauri::Window, path: String) -> Result<String, String> {
    let document = Path::new(&path);
    if !window.fs_scope().is_allowed(document) {
        return Err("The document was not approved by a file dialog".to_string());
    }
    read_bounded_text_file_impl(document)
}

fn image_directory_for_document(document: &Path) -> Result<PathBuf, String> {
    let metadata = fs::symlink_metadata(document)
        .map_err(|error| format!("Failed to inspect the document: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("Pasted images require an existing, regular document file".to_string());
    }

    let parent = document
        .parent()
        .ok_or_else(|| "The document has no parent directory".to_string())?;
    let canonical_parent = fs::canonicalize(parent)
        .map_err(|error| format!("Failed to resolve the document directory: {error}"))?;
    let canonical_document = fs::canonicalize(document)
        .map_err(|error| format!("Failed to resolve the document: {error}"))?;
    if canonical_document.parent() != Some(canonical_parent.as_path()) {
        return Err("The document path does not resolve inside its parent directory".to_string());
    }

    let images_dir = canonical_parent.join("images");
    match fs::symlink_metadata(&images_dir) {
        Ok(images_metadata)
            if images_metadata.file_type().is_symlink() || !images_metadata.is_dir() =>
        {
            return Err("The images path is not a regular directory".to_string());
        }
        Ok(_) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            fs::create_dir(&images_dir)
                .map_err(|error| format!("Failed to create the images directory: {error}"))?;
        }
        Err(error) => return Err(format!("Failed to inspect the images directory: {error}")),
    }

    let canonical_images = fs::canonicalize(&images_dir)
        .map_err(|error| format!("Failed to resolve the images directory: {error}"))?;
    if canonical_images.parent() != Some(canonical_parent.as_path()) {
        return Err("The images directory resolves outside the document directory".to_string());
    }
    Ok(canonical_images)
}

fn save_pasted_image_impl(
    document: &Path,
    bytes: &[u8],
    extension: &str,
) -> Result<String, String> {
    const ALLOWED_EXTENSIONS: [&str; 5] = ["png", "jpg", "gif", "webp", "bmp"];

    if bytes.len() > MAX_IMAGE_BYTES {
        return Err("The pasted image exceeds the 10 MiB limit".to_string());
    }
    if !ALLOWED_EXTENSIONS.contains(&extension) {
        return Err("Unsupported pasted image type".to_string());
    }

    let images_dir = image_directory_for_document(document)?;
    let filename = format!(
        "image-{}-{}.{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| error.to_string())?
            .as_millis(),
        TEMP_FILE_COUNTER.fetch_add(1, Ordering::Relaxed),
        extension
    );
    let destination = images_dir.join(&filename);
    write_and_sync(&destination, bytes)?;
    Ok(format!("images/{filename}"))
}

#[tauri::command]
fn save_pasted_image(
    window: tauri::Window,
    document_path: String,
    bytes: Vec<u8>,
    extension: String,
) -> Result<String, String> {
    let document = Path::new(&document_path);
    if !window.fs_scope().is_allowed(document) {
        return Err("The document was not approved by a file dialog".to_string());
    }
    save_pasted_image_impl(document, &bytes, &extension)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            atomic_write_text_file,
            read_bounded_text_file,
            save_pasted_image
        ])
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
    fn reads_a_bounded_utf8_document_from_one_file_handle() {
        let directory = test_directory("bounded-read");
        let document = directory.join("document.md");
        fs::write(&document, "# safe text").unwrap();

        assert_eq!(
            read_bounded_text_file_impl(&document).unwrap(),
            "# safe text"
        );

        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn rejects_oversized_and_non_regular_documents() {
        let directory = test_directory("bounded-read-rejections");
        let oversized = directory.join("oversized.md");
        fs::write(&oversized, vec![b'x'; MAX_DOCUMENT_BYTES + 1]).unwrap();

        assert!(read_bounded_text_file_impl(&oversized).is_err());
        assert!(read_bounded_text_file_impl(&directory).is_err());

        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn saves_images_only_beside_an_existing_document() {
        let directory = test_directory("pasted-image");
        let document = directory.join("document.md");
        fs::write(&document, "document").unwrap();

        let relative_path = save_pasted_image_impl(&document, b"image", "png").unwrap();

        assert!(relative_path.starts_with("images/image-"));
        assert!(directory.join(&relative_path).is_file());
        assert!(save_pasted_image_impl(&directory, b"image", "png").is_err());
        assert!(save_pasted_image_impl(&directory.join("missing.md"), b"image", "png").is_err());
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

    #[cfg(unix)]
    #[test]
    fn preserves_unix_permission_bits_when_replacing_a_file() {
        use std::os::unix::fs::PermissionsExt;

        let directory = test_directory("permissions");
        let destination = directory.join("document.md");
        fs::write(&destination, "original").unwrap();
        fs::set_permissions(&destination, fs::Permissions::from_mode(0o600)).unwrap();

        atomic_write_text_file_impl(&destination, "replacement", Some("original")).unwrap();

        assert_eq!(
            fs::metadata(&destination).unwrap().permissions().mode() & 0o777,
            0o600
        );
        fs::remove_dir_all(directory).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn refuses_to_replace_a_symbolic_link() {
        use std::os::unix::fs::symlink;

        let directory = test_directory("symlink-destination");
        let target = directory.join("target.md");
        let destination = directory.join("document.md");
        fs::write(&target, "original").unwrap();
        symlink(&target, &destination).unwrap();

        let result = atomic_write_text_file_impl(&destination, "replacement", Some("original"));

        assert!(result.is_err());
        assert_eq!(fs::read_to_string(&target).unwrap(), "original");
        assert!(destination.is_symlink());
        fs::remove_dir_all(directory).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn refuses_symbolic_links_for_reads_and_image_directories() {
        use std::os::unix::fs::symlink;

        let directory = test_directory("symlink-reads-and-images");
        let target = directory.join("target.md");
        let linked_document = directory.join("linked.md");
        fs::write(&target, "original").unwrap();
        symlink(&target, &linked_document).unwrap();

        assert!(read_bounded_text_file_impl(&linked_document).is_err());

        let outside = test_directory("symlink-images-outside");
        let images = directory.join("images");
        symlink(&outside, &images).unwrap();
        assert!(save_pasted_image_impl(&target, b"image", "png").is_err());
        assert!(fs::read_dir(&outside).unwrap().next().is_none());

        fs::remove_dir_all(directory).unwrap();
        fs::remove_dir_all(outside).unwrap();
    }
}
