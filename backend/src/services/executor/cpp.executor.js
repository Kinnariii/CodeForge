const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const execAsync = promisify(exec);

// Check if Docker is available on this system
let dockerAvailable = null;
const checkDocker = async () => {
    if (dockerAvailable !== null) return dockerAvailable;
    try {
        await execAsync("docker info", { timeout: 5000 });
        dockerAvailable = true;
        console.log("Docker available — using sandboxed execution");
    } catch {
        dockerAvailable = false;
        console.warn("Docker not available — using direct execution (demo mode)");
    }
    return dockerAvailable;
};

// ─── Docker-based execution (secure, used locally) ───────────────────────────
const executeCppWithDocker = async (code, testCases, tempDir, codePath) => {
    const results = [];

    const compileCommand =
        `docker run --rm ` +
        `--network none ` +
        `--memory 256m ` +
        `--cpus 1 ` +
        `--pids-limit 64 ` +
        `-v "${tempDir}:/workspace:rw" ` +
        `codeforge-cpp-runner:1.1 ` +
        `bash -c "cd /workspace && g++ -O2 -Werror=return-type main.cpp -o main"`;

    try {
        await execAsync(compileCommand, { timeout: 10000, maxBuffer: 1024 * 1024 });
    } catch (error) {
        return {
            results: testCases.map(() => ({
                status: "compile_error",
                output: "",
                error: error.stderr || error.message,
                runtime: 0
            }))
        };
    }

    for (const testCase of testCases) {
        const inputPath = path.join(tempDir, `input-${results.length}.txt`);
        await fs.writeFile(inputPath, testCase.input);

        const command =
            `docker run --rm -i ` +
            `--network none ` +
            `--memory 128m ` +
            `--cpus 0.5 ` +
            `--pids-limit 64 ` +
            `--read-only ` +
            `--tmpfs /tmp ` +
            `-v "${tempDir}:/workspace:rw" ` +
            `codeforge-cpp-runner:1.1 ` +
            `bash -c "cd /workspace && /usr/bin/time -f '__MEMORY__%M' timeout 2s ./main < input-${results.length}.txt"`;

        const startTime = Date.now();
        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 5000, maxBuffer: 1024 * 1024 });
            const runtime = Date.now() - startTime;
            const memoryMatch = stderr.match(/__MEMORY__(\d+)/);
            const memory = memoryMatch ? Number(memoryMatch[1]) : null;
            results.push({ status: "success", output: stdout, error: stderr, runtime, memory });
        } catch (error) {
            const runtime = Date.now() - startTime;
            if (error.code === 124 || error.stderr?.includes("timed out") || error.stderr?.includes("timeout")) {
                results.push({ status: "time_limit_exceeded", output: "", error: "Time limit exceeded", runtime });
            } else {
                results.push({ status: "runtime_error", output: error.stdout || "", error: error.stderr || error.message, runtime });
            }
        }
    }
    return { results };
};

// ─── Direct execution fallback (demo/cloud mode, no Docker) ──────────────────
const executeCppDirect = async (code, testCases, tempDir, codePath) => {
    const results = [];
    const binaryPath = path.join(tempDir, "main");

    // Compile once
    try {
        await execAsync(`g++ -O2 -Werror=return-type "${codePath}" -o "${binaryPath}"`, {
            timeout: 10000,
            maxBuffer: 1024 * 1024
        });
    } catch (error) {
        return {
            results: testCases.map(() => ({
                status: "compile_error",
                output: "",
                error: error.stderr || error.message,
                runtime: 0
            }))
        };
    }

    for (const testCase of testCases) {
        const inputPath = path.join(tempDir, `input-${results.length}.txt`);
        await fs.writeFile(inputPath, testCase.input);

        const startTime = Date.now();
        try {
            const { stdout, stderr } = await execAsync(
                `"${binaryPath}" < "${inputPath}"`,
                { timeout: 5000, maxBuffer: 1024 * 1024 }
            );
            const runtime = Date.now() - startTime;
            results.push({ status: "success", output: stdout, error: stderr, runtime, memory: null });
        } catch (error) {
            const runtime = Date.now() - startTime;
            if (error.killed || runtime >= 4900) {
                results.push({ status: "time_limit_exceeded", output: "", error: "Time limit exceeded", runtime });
            } else {
                results.push({ status: "runtime_error", output: error.stdout || "", error: error.stderr || error.message, runtime });
            }
        }
    }
    return { results };
};

// ─── Main exported executor ───────────────────────────────────────────────────
const executeCpp = async (code, testCases) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codeforge-"));
    const codePath = path.join(tempDir, "main.cpp");
    await fs.writeFile(codePath, code);

    try {
        const useDocker = await checkDocker();
        if (useDocker) {
            return await executeCppWithDocker(code, testCases, tempDir, codePath);
        } else {
            return await executeCppDirect(code, testCases, tempDir, codePath);
        }
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
};

module.exports = { executeCpp };