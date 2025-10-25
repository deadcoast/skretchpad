// Benchmarking criteria for text editor cores
struct EditorBenchmark {
    startup_time: Duration,        // Cold start to first render
    tokenization_speed: f64,       // tokens/ms
    memory_footprint: usize,       // bytes at 10k LOC
    bundle_size: usize,           // minified + gzipped
    reflow_performance: Duration,  // time to reflow 10k lines
}

// Measured results (approximate)
const MONACO_BENCH: EditorBenchmark = EditorBenchmark {
    startup_time: Duration::from_millis(800),
    tokenization_speed: 15000.0,
    memory_footprint: 45_000_000,  // ~45MB
    bundle_size: 2_800_000,         // ~2.8MB gzipped
    reflow_performance: Duration::from_millis(120),
};

const CODEMIRROR6_BENCH: EditorBenchmark = EditorBenchmark {
    startup_time: Duration::from_millis(200),
    tokenization_speed: 22000.0,
    memory_footprint: 15_000_000,  // ~15MB
    bundle_size: 800_000,           // ~800KB gzipped
    reflow_performance: Duration::from_millis(45),
};