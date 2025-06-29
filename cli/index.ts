#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import Stripe from "stripe";
import { spawnSync, spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";

dotenv.config();
const program = new Command();

program
  .name("launchlayer")
  .description("LaunchLayer developer CLI")
  .version("0.1.0");

// ── Dev: frontend + backend ───────────────────────────────────────────────────
program
  .command("dev")
  .description("Start frontend and backend in dev mode")
  .action(() => {
    console.log("Starting frontend on http://localhost:3000");
    console.log("Starting backend on http://localhost:4000");
    
    // Debug logging to validate assumptions
    const backendDir = path.resolve(__dirname, "..", "backend");
    console.log("🔍 Debug Info:");
    console.log("  - Current working directory:", process.cwd());
    console.log("  - Backend directory:", backendDir);
    console.log("  - Backend directory exists:", fs.existsSync(backendDir));
    console.log("  - Process PATH:", process.env.PATH);
    console.log("  - Process platform:", process.platform);
    console.log("  - Node version:", process.version);
    
    // Check if npm exists in PATH
    let npmPath = "";
    try {
      const npmPaths = execSync("where npm", { encoding: "utf8" }).trim().split('\n');
      npmPath = npmPaths[0]; // Use the first npm found
      console.log("  - npm location:", npmPath);
    } catch {
      console.log("  - npm not found in PATH");
    }
    
    // Check if npm.cmd exists (Windows)
    let npmCmdPath = "";
    if (process.platform === "win32") {
      try {
        const npmCmdPaths = execSync("where npm.cmd", { encoding: "utf8" }).trim().split('\n');
        npmCmdPath = npmCmdPaths[0]; // Use the first npm.cmd found
        console.log("  - npm.cmd location:", npmCmdPath);
      } catch {
        console.log("  - npm.cmd not found");
      }
    }
    
    // Use the full path to npm for more reliable execution
    const npmExecutable = process.platform === "win32" ? npmCmdPath : npmPath;
    console.log("  - Using npm executable:", npmExecutable);
    
    // Start both frontend and backend using spawn
    console.log("  - Starting both services...");
    
    // Start frontend
    const front = spawn("npm", ["run", "dev"], { stdio: "inherit" });
    
    // Start backend with proper path handling
    const back = spawn(`"${npmExecutable}"`, ["run", "dev"], { 
      cwd: backendDir, 
      stdio: "inherit",
      shell: true
    });

    // Handle process exits
    front.on("exit", (code) => {
      console.log(`Frontend exited with code ${code}`);
      process.exit(code || 0);
    });
    
    back.on("exit", (code) => {
      console.log(`Backend exited with code ${code}`);
      process.exit(code || 0);
    });
    
    back.on("error", (err) => {
      console.error("Backend spawn error:", err);
      const spawnError = err as Error & { code?: string; errno?: number; syscall?: string; path?: string; spawnargs?: string[] };
      console.error("Error details:", {
        code: spawnError.code,
        errno: spawnError.errno,
        syscall: spawnError.syscall,
        path: spawnError.path,
        spawnargs: spawnError.spawnargs
      });
      process.exit(1);
    });
  });

// ── Deploy: Terraform infra ───────────────────────────────────────────────────
program
  .command("deploy")
  .description("Apply Terraform infrastructure")
  .action(() => {
    const infraDir = path.resolve(__dirname, "..", "infra", "aws");
    console.log(`Initializing Terraform in ${infraDir}`);
    spawnSync("terraform", ["init"], { cwd: infraDir, stdio: "inherit" });

    console.log("Applying Terraform (auto-approve)");
    spawnSync(
      "terraform",
      ["apply", "-auto-approve"],
      { cwd: infraDir, stdio: "inherit" }
    );
  });

// ── Init: scaffold a fresh project ─────────────────────────────────────────────
program
  .command("init <projectName>")
  .description("Scaffold a new LaunchLayer project")
  .action((projectName: string) => {
    console.log(`Creating new Next.js app "${projectName}"...`);
    spawnSync(
      "npx",
      [
        "create-next-app@latest",
        projectName,
        "--typescript",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
      ],
      { stdio: "inherit" }
    );

    const root = path.resolve(process.cwd(), projectName);
    console.log("Adding backend, infra, and cli folders...");
    fs.mkdirSync(path.join(root, "backend"));
    fs.mkdirSync(path.join(root, "infra"));
    fs.mkdirSync(path.join(root, "cli"));

    // Basic Express backend stub
    const backendSrc = path.join(root, "backend", "src");
    fs.mkdirSync(backendSrc, { recursive: true });
    fs.writeFileSync(
      path.join(backendSrc, "index.ts"),
      `import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get("/hello-world", (_req, res) =>
  res.json({ message: "Hello from ${projectName} backend!" })
);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(\`Backend running on http://localhost:\${PORT}\`)
);
`
    );

    // Basic Terraform stub
    const tfDir = path.join(root, "infra", "aws");
    fs.mkdirSync(tfDir, { recursive: true });
    fs.writeFileSync(
      path.join(tfDir, "main.tf"),
      `terraform {
  required_providers { aws = { source = "hashicorp/aws" } }
}
provider "aws" { region = var.region }
module "launchlayer_db" {
  source         = "terraform-aws-modules/rds/aws"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"
  name           = "${projectName}"
  username       = var.db_username
  password       = var.db_password
}
`
    );

    // CLI stub
    fs.writeFileSync(
      path.join(root, "cli", "index.ts"),
      `#!/usr/bin/env node
console.log("LaunchLayer CLI for ${projectName}");
`
    );

    console.log(`Scaffold complete!  
  > cd ${projectName}  
  > npm install  
  > npm run cli -- dev  
`);
  });

// ── Sync-Plans: fetch Stripe prices ─────────────────────────────────────────────
program
  .command("sync-plans")
  .description("Fetch active Stripe prices and save to cli/plans.json")
  .action(async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-05-28.basil",
    });
    console.log("Fetching prices from Stripe...");
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
    });

    const data = prices.data.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      amount: p.unit_amount,
      interval: p.recurring?.interval,
    }));

    const outPath = path.resolve(process.cwd(), "cli", "plans.json");
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} plans to ${outPath}`);
  });

// ── Sync-Infra: wrapper for Terraform ───────────────────────────────────────────
program
  .command("sync-infra")
  .description("Run Terraform init & apply for infra/aws")
  .action(() => {
    const infraDir = path.resolve(__dirname, "..", "infra", "aws");
    console.log("Terraform init...");
    spawnSync("terraform", ["init"], { cwd: infraDir, stdio: "inherit" });
    console.log("Terraform apply...");
    spawnSync("terraform", ["apply", "-auto-approve"], {
      cwd: infraDir,
      stdio: "inherit",
    });
  });

program.parse();
