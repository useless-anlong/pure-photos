// use tauri::Manager;
// use tauri_plugin_deep_link::DeepLinkExt;

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//     let mut builder = tauri::Builder::default();
//     #[cfg(desktop)]
//     {
//         builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
//             let _ = app
//                 .get_webview_window("main")
//                 .expect("no main window")
//                 .set_focus();
//         }));
//     }

//     builder
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");

//     tauri::Builder::default()
//         .plugin(tauri_plugin_deep_link::init())
//         .setup(|app| {
//             #[cfg(desktop)]
//             app.deep_link().register("photos-prue")?;
//             Ok(())
//         })
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

// use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
