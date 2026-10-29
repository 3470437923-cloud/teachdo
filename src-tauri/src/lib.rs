mod ai;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ai::ai_chat,
            ai::ai_models,
            ai::export_save
        ])
        .run(tauri::generate_context!())
        .expect("error while running 师作 TeachDo");
}
