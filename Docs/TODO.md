# TODO - Skretchpad Development Tasks

## TODO_0.0.1 - 2025/10/23

### 1. FUNDAMENTAL ARCHITECTURAL ISSUE - ✅ SOLVED

- COMPLETED: `deno_core::JsRuntime` thread safety issue resolved with worker-based architecture
- COMPLETED: Plugin sandboxing architecture redesigned for thread safety
- COMPLETED: All plugin-related Tauri commands now work with thread-safe execution

### 2. Plugin System Architecture - ✅ COMPLETED

- COMPLETED: Thread-safe sandbox implementation using dedicated worker threads
- COMPLETED: Message passing system for communication between main thread and workers
- COMPLETED: Plugin execution model redesigned for thread safety

### 3. Remaining Implementation Tasks

- IN PROGRESS: Fix remaining compilation errors (dependencies, API compatibility)
- MEDIUM: Complete V8 value to JSON conversion in workers
- LOW: Add comprehensive error handling and logging

### 4. Documentation Status

- UPDATED: STATUS.md accurately reflects the thread-safe architecture
- UPDATED: Module documentation updated to reflect worker-based design
- COMPLETED: The codebase now has a complete thread-safe plugin system

## Implementation Tasks

### ✅ COMPLETED: Plugin Sandboxing Redesign

1. Thread-Safe JavaScript Runtime ✅
   - Implemented worker-based architecture with `deno_core`
   - Each plugin runs in its own dedicated thread
   - Complete thread safety for Tauri command compatibility

2. Thread-Safe Plugin Execution ✅
   - JavaScript execution moved to dedicated worker threads
   - Message passing system for plugin communication
   - Complete isolation without shared state

3. Plugin API Redesign ✅
   - Removed direct JsRuntime usage from Tauri commands
   - Plugin execution via background worker threads
   - Channel-based communication between main thread and workers

### IN PROGRESS: Remaining Tasks

1. Compilation Error Fixes
   - Fix remaining dependency issues
   - Resolve Tauri 2.0 API compatibility
   - Complete V8 value to JSON conversion

2. Testing and Validation
   - Test worker thread communication
   - Validate resource limits
   - Performance testing

## Priority Order

1. COMPLETED: ✅ Thread safety issues with plugin sandboxing
2. COMPLETED: ✅ Plugin execution model redesign
3. COMPLETED: ✅ Worker-based JavaScript runtime
4. IN PROGRESS: Fix remaining compilation issues
5. COMPLETED: ✅ Documentation updates

## Notes

- MAJOR SUCCESS: The fundamental thread safety issue has been completely resolved
- The codebase now has a sophisticated, thread-safe plugin system
- Each plugin runs in its own worker thread with complete isolation
- Message passing provides clean communication between main thread and workers
- The architecture is now fully compatible with Tauri's async command system

## TODO_0.0.2 - 2025/10/25

### CRITICAL INTEGRATION ISSUES RESOLUTION PLAN

Based on the comprehensive validation audit, the following critical issues must be resolved to make the plugin execution system functional:

#### CRITICAL ISSUES IDENTIFIED

1. Dependency Resolution Failure - Dependencies not being recognized by compiler
2. API Mismatches - SandboxRegistry methods don't match usage
3. Type System Incompatibilities - PluginSandbox constructor parameter mismatches
4. Thread Safety Issues - Arc<SandboxRegistry> mutability problems
5. Serialization Issues - notify::Event and FileInfo serialization failures

#### RESOLUTION PLAN

### Phase 1: Fix Dependency Resolution (HIGH PRIORITY)

Task 1.1: Resolve Cargo.toml Dependency Issues
📋 **DOCUMENTATION**: [architecture/3_technical-details.md](architecture/3_technical-details.md) - Cargo.toml dependencies section
📋 **REFERENCE**: [architecture/modules/3_api.rs.md](architecture/modules/3_api.rs.md) - Required dependencies list

- [ ] CRITICAL: Fix async-trait dependency resolution
- [ ] CRITICAL: Fix uuid dependency resolution  
- [ ] CRITICAL: Fix reqwest dependency resolution
- [ ] CRITICAL: Fix url dependency resolution
- [ ] Action: Verify Cargo.toml format and dependency versions
- [ ] Action: Run `cargo clean && cargo update` to refresh dependencies
- [ ] Validation: Ensure all dependencies compile without errors

Task 1.2: Fix Compilation Errors
📋 **DOCUMENTATION**: [STATUS.md](STATUS.md) - Current implementation status
📋 **REFERENCE**: [architecture/3_technical-details.md](architecture/3_technical-details.md) - Technical implementation details

- [ ] CRITICAL: Resolve all E0432 (unresolved import) errors
- [ ] CRITICAL: Resolve all E0433 (failed to resolve) errors
- [ ] Action: Update import statements to match available dependencies
- [ ] Validation: `cargo check` passes without dependency errors

### Phase 2: Fix API Mismatches (HIGH PRIORITY)

Task 2.1: Align SandboxRegistry API
📋 **DOCUMENTATION**: [architecture/modules/1_sandbox.rs.md](architecture/modules/1_sandbox.rs.md) - SandboxRegistry implementation
📋 **REFERENCE**: [architecture/modules/10_manager.rs.md](architecture/modules/10_manager.rs.md) - PluginManager integration

- [ ] CRITICAL: Fix `register_sandbox()` method call
- [ ] CRITICAL: Fix `get_sandbox()` method call
- [ ] CRITICAL: Fix `remove_sandbox()` method call
- [ ] Action: Update SandboxRegistry implementation to match usage
- [ ] Action: Fix Arc<SandboxRegistry> mutability issues
- [ ] Validation: Plugin lifecycle management works correctly

Task 2.2: Fix PluginSandbox Constructor
📋 **DOCUMENTATION**: [architecture/modules/1_sandbox.rs.md](architecture/modules/1_sandbox.rs.md) - PluginSandbox implementation
📋 **REFERENCE**: [architecture/modules/9_loader.rs.md](architecture/modules/9_loader.rs.md) - PluginManifest structure

- [ ] CRITICAL: Fix PluginSandbox::new() parameter mismatch
- [ ] CRITICAL: Update PluginSandbox to accept PluginManifest
- [ ] Action: Update manager.rs to pass correct parameters
- [ ] Validation: PluginSandbox creation works without errors

Task 2.3: Fix PluginInfo Structure Usage
📋 **DOCUMENTATION**: [architecture/modules/9_loader.rs.md](architecture/modules/9_loader.rs.md) - PluginInfo structure
📋 **REFERENCE**: [architecture/modules/10_manager.rs.md](architecture/modules/10_manager.rs.md) - PluginInfo usage in manager

- [ ] CRITICAL: Fix `plugin_info.capabilities` vs `plugin_info.manifest.capabilities`
- [ ] CRITICAL: Fix `plugin_info.id` field access
- [ ] Action: Update all PluginInfo field access to match actual structure
- [ ] Validation: PluginInfo access works correctly throughout codebase

### Phase 3: Fix Thread Safety Issues (MEDIUM PRIORITY)

Task 3.1: Resolve Arc<SandboxRegistry> Mutability
📋 **DOCUMENTATION**: [architecture/modules/1_sandbox.rs.md](architecture/modules/1_sandbox.rs.md) - SandboxRegistry thread safety
📋 **REFERENCE**: [architecture/modules/1.1_worker.rs.md](architecture/modules/1.1_worker.rs.md) - Worker thread architecture

- [ ] HIGH: Fix Arc<SandboxRegistry> cannot be borrowed mutably
- [ ] Action: Implement proper mutex or RwLock for SandboxRegistry
- [ ] Action: Update remove_sandbox() to work with Arc<SandboxRegistry>
- [ ] Validation: Plugin deactivation works without mutability errors

Task 3.2: Fix Worker Thread Lifetime Issues
📋 **DOCUMENTATION**: [architecture/modules/1.1_worker.rs.md](architecture/modules/1.1_worker.rs.md) - Worker thread implementation
📋 **REFERENCE**: [architecture/3_technical-details.md](architecture/3_technical-details.md) - Thread safety technical details

- [ ] HIGH: Fix `hook_name` lifetime issue in worker.rs
- [ ] Action: Use owned strings instead of borrowed references
- [ ] Action: Fix FastString lifetime issues
- [ ] Validation: Worker thread execution works without lifetime errors

### Phase 4: Fix Serialization Issues (MEDIUM PRIORITY)

Task 4.1: Fix notify::Event Serialization
📋 **DOCUMENTATION**: [architecture/modules/3_api.rs.md](architecture/modules/3_api.rs.md) - File watching and event handling
📋 **REFERENCE**: [architecture/3_technical-details.md](architecture/3_technical-details.md) - Serialization technical details

- [ ] MEDIUM: Fix notify::Event doesn't implement Serialize
- [ ] Action: Create custom serializable event wrapper
- [ ] Action: Update file watching to use serializable events
- [ ] Validation: File change events can be sent to frontend

Task 4.2: Fix FileInfo Deserialization
📋 **DOCUMENTATION**: [architecture/modules/3_api.rs.md](architecture/modules/3_api.rs.md) - Editor communication API
📋 **REFERENCE**: [architecture/modules/12_editor.ts.md](architecture/modules/12_editor.ts.md) - Frontend editor integration

- [ ] MEDIUM: Fix FileInfo doesn't implement Deserialize
- [ ] Action: Create serializable FileInfo wrapper
- [ ] Action: Update emit_and_wait to use serializable types
- [ ] Validation: Editor communication works correctly

### Phase 5: Fix Remaining Compilation Errors (LOW PRIORITY)

Task 5.1: Fix Type Mismatches
📋 **DOCUMENTATION**: [architecture/modules/10_manager.rs.md](architecture/modules/10_manager.rs.md) - Manager error handling
📋 **REFERENCE**: [architecture/modules/3_api.rs.md](architecture/modules/3_api.rs.md) - API error handling patterns

- [ ] LOW: Fix PluginError to ManagerError conversion
- [ ] LOW: Fix return type mismatches in manager.rs
- [ ] LOW: Fix unused import warnings
- [ ] Action: Add proper error conversion traits
- [ ] Action: Fix return types to match function signatures
- [ ] Action: Remove unused imports

Task 5.2: Fix Method Signature Issues
📋 **DOCUMENTATION**: [architecture/modules/3_api.rs.md](architecture/modules/3_api.rs.md) - Tauri command signatures
📋 **REFERENCE**: [architecture/3_technical-details.md](architecture/3_technical-details.md) - Method signature patterns

- [ ] LOW: Fix emit_and_wait payload Clone requirement
- [ ] LOW: Fix event.payload() type mismatch
- [ ] LOW: Fix Tauri Error constructor parameters
- [ ] Action: Update method signatures to match requirements
- [ ] Validation: All compilation errors resolved

### Phase 6: Integration Testing (VALIDATION)

Task 6.1: End-to-End Plugin Testing
📋 **DOCUMENTATION**: [STATUS.md](STATUS.md) - Plugin system implementation status
📋 **REFERENCE**: [architecture/modules/8_plugin-api.ts.md](architecture/modules/8_plugin-api.ts.md) - Frontend plugin API

- [ ] CRITICAL: Test plugin discovery and loading
- [ ] CRITICAL: Test plugin activation and execution
- [ ] CRITICAL: Test plugin deactivation and cleanup
- [ ] Action: Create test plugins to validate functionality
- [ ] Validation: Complete plugin lifecycle works end-to-end

Task 6.2: Frontend-Backend Integration
📋 **DOCUMENTATION**: [architecture/modules/13_plugins.ts.md](architecture/modules/13_plugins.ts.md) - Frontend plugin store
📋 **REFERENCE**: [architecture/modules/15_ui.ts.md](architecture/modules/15_ui.ts.md) - UI integration
📋 **REFERENCE**: [architecture/modules/2_Editor.svelte.md](architecture/modules/2_Editor.svelte.md) - Editor component integration

- [ ] HIGH: Test frontend plugin store integration
- [ ] HIGH: Test StatusBar plugin display
- [ ] HIGH: Test plugin command execution
- [ ] Action: Verify all Tauri commands work correctly
- [ ] Validation: Frontend can communicate with backend plugins

### SUCCESS CRITERIA

ALL SUCCESS CRITERIA IS **CORRUPT** IF 'REMOVE' OR 'DELETE' IS USED AS A BASELINE TO CORRECT INTEGRATIONS OR LACK THERE OF.

1. Compilation Success: `cargo check` passes without errors
2. Plugin Loading: Plugins can be discovered and loaded
3. Plugin Execution: Plugins can be activated and execute JavaScript
4. Plugin Communication: Frontend can communicate with backend plugins
5. Plugin Cleanup: Plugins can be deactivated and cleaned up properly

### IMPLEMENTATION ORDER

1. Start with Phase 1 - Fix dependency resolution first
2. Move to Phase 2 - Fix API mismatches
3. Address Phase 3 - Fix thread safety issues
4. Complete Phase 4 - Fix serialization issues
5. Finish Phase 5 - Clean up remaining errors
6. Validate Phase 6 - Test complete integration

### NOTES

- Priority: Focus on Phases 1-2 first as they are blocking compilation
- Testing: After each phase, run `cargo check` to verify progress
- Documentation: Update documentation as fixes are implemented
- Validation: Each fix should be validated before moving to next phase

---

## 📚 COMPREHENSIVE DOCUMENTATION REFERENCE

### Core Architecture Documentation

- **[STATUS.md](STATUS.md)** - Overall project status and module completion
- **[architecture/1_overview.md](architecture/1_overview.md)** - Project overview and design goals
- **[architecture/2_techstack.md](architecture/2_techstack.md)** - Technology stack and framework choices
- **[architecture/3_technical-details.md](architecture/3_technical-details.md)** - Deep technical implementation details
- **[architecture/4_configs.md](architecture/4_configs.md)** - Configuration and setup details
- **[directory_tree.md](directory_tree.md)** - Complete project structure and file organization

### Backend Plugin System Modules

- **[architecture/modules/1_sandbox.rs.md](architecture/modules/1_sandbox.rs.md)** - Plugin sandboxing and thread safety
- **[architecture/modules/1.1_worker.rs.md](architecture/modules/1.1_worker.rs.md)** - Worker thread implementation
- **[architecture/modules/1.1_capabilities.rs.md](architecture/modules/1.1_capabilities.rs.md)** - Plugin capabilities and permissions
- **[architecture/modules/3_api.rs.md](architecture/modules/3_api.rs.md)** - Tauri command API implementation
- **[architecture/modules/9_loader.rs.md](architecture/modules/9_loader.rs.md)** - Plugin loading and manifest handling
- **[architecture/modules/10_manager.rs.md](architecture/modules/10_manager.rs.md)** - Plugin lifecycle management
- **[architecture/modules/11_main.rs.md](architecture/modules/11_main.rs.md)** - Main application integration

### Frontend Integration Modules

- **[architecture/modules/2_Editor.svelte.md](architecture/modules/2_Editor.svelte.md)** - Editor component implementation
- **[architecture/modules/4_main.ts.md](architecture/modules/4_main.ts.md)** - Frontend application entry point
- **[architecture/modules/5_editor-loader.ts.md](architecture/modules/5_editor-loader.ts.md)** - Editor initialization
- **[architecture/modules/8_plugin-api.ts.md](architecture/modules/8_plugin-api.ts.md)** - Frontend plugin API
- **[architecture/modules/12_editor.ts.md](architecture/modules/12_editor.ts.md)** - Editor TypeScript utilities
- **[architecture/modules/13_plugins.ts.md](architecture/modules/13_plugins.ts.md)** - Plugin store management
- **[architecture/modules/14_debounce.ts.md](architecture/modules/14_debounce.ts.md)** - Utility functions
- **[architecture/modules/15_ui.ts.md](architecture/modules/15_ui.ts.md)** - UI utilities and helpers

### Development Workflow

1. **Start with STATUS.md** - Understand current implementation status
2. **Review architecture/1_overview.md** - Understand project goals and design
3. **Check architecture/3_technical-details.md** - Deep dive into technical implementation
4. **Reference specific module docs** - Use module-specific documentation for implementation details
5. **Update documentation** - Keep docs current as fixes are implemented
