const { spawn } = require("child_process");
const path = require("path");

// Function to start a process in a separate shell
const runProcess = (command, args, workingDir) => {
  const process = spawn(command, args, {
    cwd: workingDir, // Set the working directory
    stdio: "inherit", // Pipe logs to the main terminal
    shell: true, // Run in a shell
  });

  process.on("exit", (code) => {
    console.log(`Process in ${workingDir} exited with code ${code}`);
  });
};

// Get absolute paths for frontend and backend directories
const frontendDir = path.join(__dirname, "frontend");
const backendDir = path.join(__dirname, "backend");

// Run frontend (`npm run dev`) and backend (`npm start`) in separate processes
runProcess("npm", ["run", "dev"], frontendDir);
runProcess("npm", ["start"], backendDir);
