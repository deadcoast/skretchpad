// src-tauri/src/git.rs
//
// Git CLI wrapper providing Tauri commands for source control operations.
// Shells out to `git` binary rather than linking libgit2.

use serde::{Deserialize, Serialize};
use std::process::Command;

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileChange {
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub old_path: Option<String>,
    pub status: String, // "M", "A", "D", "R", "C", "U"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub is_repo: bool,
    pub branch: String,
    pub upstream: Option<String>,
    pub ahead: i32,
    pub behind: i32,
    pub staged: Vec<GitFileChange>,
    pub unstaged: Vec<GitFileChange>,
    pub untracked: Vec<String>,
    pub merge_conflicts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitLogEntry {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub date: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub current: bool,
    pub remote: bool,
    pub upstream: Option<String>,
}

// ============================================================================
// HELPERS
// ============================================================================

fn run_git(workdir: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(workdir)
        .output()
        .map_err(|e| format!("Failed to execute git: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr.trim().to_string())
    }
}

/// Parse a single status character into a change type string
fn parse_status_char(c: char) -> &'static str {
    match c {
        'M' => "M",
        'A' => "A",
        'D' => "D",
        'R' => "R",
        'C' => "C",
        'T' => "M", // type change -> treat as modified
        _ => "M",
    }
}

/// Parse `git status --porcelain=v2 --branch` output
fn parse_porcelain_v2(output: &str) -> GitStatus {
    let mut status = GitStatus {
        is_repo: true,
        branch: String::from("HEAD"),
        upstream: None,
        ahead: 0,
        behind: 0,
        staged: Vec::new(),
        unstaged: Vec::new(),
        untracked: Vec::new(),
        merge_conflicts: Vec::new(),
    };

    for line in output.lines() {
        if let Some(head) = line.strip_prefix("# branch.head ") {
            status.branch = head.to_string();
        } else if let Some(upstream) = line.strip_prefix("# branch.upstream ") {
            status.upstream = Some(upstream.to_string());
        } else if let Some(ab) = line.strip_prefix("# branch.ab ") {
            let parts: Vec<&str> = ab.split_whitespace().collect();
            if parts.len() >= 2 {
                status.ahead = parts[0].trim_start_matches('+').parse().unwrap_or(0);
                status.behind = parts[1].trim_start_matches('-').parse().unwrap_or(0);
            }
        } else if let Some(path) = line.strip_prefix("? ") {
            // Untracked
            status.untracked.push(path.to_string());
        } else if line.starts_with("u ") {
            // Unmerged / conflict
            let parts: Vec<&str> = line.splitn(11, ' ').collect();
            if parts.len() >= 11 {
                status.merge_conflicts.push(parts[10].to_string());
            }
        } else if line.starts_with("1 ") {
            // Ordinary changed entry: 1 XY sub mH mI mW hH hI path
            let parts: Vec<&str> = line.splitn(9, ' ').collect();
            if parts.len() >= 9 {
                let xy = parts[1];
                let path = parts[8].to_string();
                let chars: Vec<char> = xy.chars().collect();

                if chars.len() >= 2 {
                    // X = staged status
                    if chars[0] != '.' {
                        status.staged.push(GitFileChange {
                            path: path.clone(),
                            old_path: None,
                            status: parse_status_char(chars[0]).to_string(),
                        });
                    }
                    // Y = unstaged status
                    if chars[1] != '.' {
                        status.unstaged.push(GitFileChange {
                            path,
                            old_path: None,
                            status: parse_status_char(chars[1]).to_string(),
                        });
                    }
                }
            }
        } else if line.starts_with("2 ") {
            // Renamed/copied: 2 XY sub mH mI mW hH hI X{score} path\torigPath
            let parts: Vec<&str> = line.splitn(10, ' ').collect();
            if parts.len() >= 10 {
                let xy = parts[1];
                let rest = parts[9];
                let chars: Vec<char> = xy.chars().collect();

                // path\torigPath
                let path_parts: Vec<&str> = rest.splitn(2, '\t').collect();
                let path = path_parts[0].to_string();
                let old_path = path_parts.get(1).map(|s| s.to_string());

                if chars.len() >= 2 {
                    if chars[0] != '.' {
                        status.staged.push(GitFileChange {
                            path: path.clone(),
                            old_path: old_path.clone(),
                            status: parse_status_char(chars[0]).to_string(),
                        });
                    }
                    if chars[1] != '.' {
                        status.unstaged.push(GitFileChange {
                            path,
                            old_path,
                            status: parse_status_char(chars[1]).to_string(),
                        });
                    }
                }
            }
        }
    }

    status
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
pub async fn git_is_repo(workdir: String) -> Result<bool, String> {
    let result = tokio::task::spawn_blocking(move || {
        run_git(&workdir, &["rev-parse", "--is-inside-work-tree"])
    })
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Ok(output) => Ok(output.trim() == "true"),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn git_status(workdir: String) -> Result<GitStatus, String> {
    let result = tokio::task::spawn_blocking(move || {
        run_git(&workdir, &["status", "--porcelain=v2", "--branch"])
    })
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Ok(output) => Ok(parse_porcelain_v2(&output)),
        Err(e) => {
            // Not a repo or git not installed
            if e.contains("not a git repository") || e.contains("not found") {
                Ok(GitStatus {
                    is_repo: false,
                    branch: String::new(),
                    upstream: None,
                    ahead: 0,
                    behind: 0,
                    staged: Vec::new(),
                    unstaged: Vec::new(),
                    untracked: Vec::new(),
                    merge_conflicts: Vec::new(),
                })
            } else {
                Err(e)
            }
        }
    }
}

#[tauri::command]
pub async fn git_diff_file_content(
    workdir: String,
    path: String,
    ref_name: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let spec = format!("{}:{}", ref_name, path);
        run_git(&workdir, &["show", &spec])
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_stage(workdir: String, paths: Vec<String>) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let mut args: Vec<&str> = vec!["add", "--"];
        let path_refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        args.extend(path_refs);
        run_git(&workdir, &args)?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_unstage(workdir: String, paths: Vec<String>) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let mut args: Vec<&str> = vec!["reset", "HEAD", "--"];
        let path_refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        args.extend(path_refs);
        run_git(&workdir, &args)?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_discard_changes(workdir: String, paths: Vec<String>) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let mut args: Vec<&str> = vec!["checkout", "--"];
        let path_refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        args.extend(path_refs);
        run_git(&workdir, &args)?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_commit(workdir: String, message: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let output = run_git(&workdir, &["commit", "-m", &message])?;
        // Try to extract commit hash from output
        // Typical: "[branch hash] message"
        let hash = output
            .lines()
            .next()
            .and_then(|line| {
                line.split_whitespace()
                    .nth(1)
                    .map(|s| s.trim_end_matches(']').to_string())
            })
            .unwrap_or_default();
        Ok(hash)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_log(workdir: String, count: u32) -> Result<Vec<GitLogEntry>, String> {
    let count_str = count.to_string();
    tokio::task::spawn_blocking(move || {
        let format = "%H|%h|%an|%ai|%s";
        let output = run_git(
            &workdir,
            &[
                "log",
                &format!("--format={}", format),
                &format!("-n{}", count_str),
            ],
        )?;

        let entries: Vec<GitLogEntry> = output
            .lines()
            .filter(|line| !line.is_empty())
            .filter_map(|line| {
                let parts: Vec<&str> = line.splitn(5, '|').collect();
                if parts.len() >= 5 {
                    Some(GitLogEntry {
                        hash: parts[0].to_string(),
                        short_hash: parts[1].to_string(),
                        author: parts[2].to_string(),
                        date: parts[3].to_string(),
                        message: parts[4].to_string(),
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_branches(workdir: String) -> Result<Vec<GitBranch>, String> {
    tokio::task::spawn_blocking(move || {
        let output = run_git(
            &workdir,
            &[
                "branch",
                "-a",
                "--format=%(refname:short)|%(HEAD)|%(upstream:short)",
            ],
        )?;

        let branches: Vec<GitBranch> = output
            .lines()
            .filter(|line| !line.is_empty())
            .map(|line| {
                let parts: Vec<&str> = line.splitn(3, '|').collect();
                let name = parts.first().unwrap_or(&"").to_string();
                let current = parts.get(1).map(|s| s.trim() == "*").unwrap_or(false);
                let upstream = parts
                    .get(2)
                    .filter(|s| !s.is_empty())
                    .map(|s| s.to_string());
                let remote = name.starts_with("remotes/") || name.contains('/');

                GitBranch {
                    name,
                    current,
                    remote,
                    upstream,
                }
            })
            .collect();

        Ok(branches)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_checkout(workdir: String, branch: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        run_git(&workdir, &["checkout", &branch])?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_push(workdir: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || run_git(&workdir, &["push"]))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_pull(workdir: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || run_git(&workdir, &["pull"]))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_fetch(workdir: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        run_git(&workdir, &["fetch", "--all"])?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn git_stash(workdir: String, message: Option<String>) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        if let Some(msg) = message {
            run_git(&workdir, &["stash", "push", "-m", &msg])?;
        } else {
            run_git(&workdir, &["stash"])?;
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_workspace_root() -> Result<String, String> {
    if cfg!(debug_assertions) {
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let root = manifest_dir
            .parent()
            .ok_or("Cannot determine workspace root")?;
        Ok(root.to_string_lossy().to_string())
    } else {
        // In release, return current working directory
        std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .map_err(|e| e.to_string())
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_porcelain_v2_branch_info() {
        let output = "# branch.oid abc123\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +3 -1\n";
        let status = parse_porcelain_v2(output);
        assert_eq!(status.branch, "main");
        assert_eq!(status.upstream, Some("origin/main".to_string()));
        assert_eq!(status.ahead, 3);
        assert_eq!(status.behind, 1);
        assert!(status.is_repo);
    }

    #[test]
    fn test_parse_porcelain_v2_modified_files() {
        let output = "# branch.head main\n1 .M N... 100644 100644 100644 abc123 def456 src/main.rs\n1 M. N... 100644 100644 100644 abc123 def456 src/lib.rs\n";
        let status = parse_porcelain_v2(output);
        assert_eq!(status.unstaged.len(), 1);
        assert_eq!(status.unstaged[0].path, "src/main.rs");
        assert_eq!(status.unstaged[0].status, "M");
        assert_eq!(status.staged.len(), 1);
        assert_eq!(status.staged[0].path, "src/lib.rs");
        assert_eq!(status.staged[0].status, "M");
    }

    #[test]
    fn test_parse_porcelain_v2_untracked() {
        let output = "# branch.head main\n? new_file.txt\n? another.txt\n";
        let status = parse_porcelain_v2(output);
        assert_eq!(status.untracked.len(), 2);
        assert_eq!(status.untracked[0], "new_file.txt");
        assert_eq!(status.untracked[1], "another.txt");
    }

    #[test]
    fn test_parse_porcelain_v2_added_deleted() {
        let output = "# branch.head main\n1 A. N... 000000 100644 100644 0000000 abc1234 new.ts\n1 .D N... 100644 100644 000000 abc1234 0000000 old.ts\n";
        let status = parse_porcelain_v2(output);
        assert_eq!(status.staged.len(), 1);
        assert_eq!(status.staged[0].status, "A");
        assert_eq!(status.staged[0].path, "new.ts");
        assert_eq!(status.unstaged.len(), 1);
        assert_eq!(status.unstaged[0].status, "D");
        assert_eq!(status.unstaged[0].path, "old.ts");
    }

    #[test]
    fn test_parse_porcelain_v2_empty() {
        let output = "# branch.head main\n";
        let status = parse_porcelain_v2(output);
        assert_eq!(status.branch, "main");
        assert!(status.staged.is_empty());
        assert!(status.unstaged.is_empty());
        assert!(status.untracked.is_empty());
    }

    #[test]
    fn test_parse_status_char() {
        assert_eq!(parse_status_char('M'), "M");
        assert_eq!(parse_status_char('A'), "A");
        assert_eq!(parse_status_char('D'), "D");
        assert_eq!(parse_status_char('R'), "R");
        assert_eq!(parse_status_char('C'), "C");
        assert_eq!(parse_status_char('T'), "M");
    }
}
