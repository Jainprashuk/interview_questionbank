import { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   QUESTION BANK DATA
   d: 1 = warm-up / basic, 2 = expected at 2+ YOE, 3 = hard / senior probe
   ============================================================ */

const DATA = [
{
  id: "linux",
  name: "Linux, Shell & Networking",
  blurb: "The layer under everything. Interviewers use this to check if you have actually SSH-ed into a box.",
  questions: [
    { d:1, q:"Walk me through what happens when you type a URL and hit enter.", a:[
      "DNS resolution: browser cache to OS cache to resolver to root/TLD/authoritative NS, returns an IP.",
      "TCP handshake (SYN, SYN-ACK, ACK), then TLS handshake if HTTPS (ClientHello, cert exchange, key agreement).",
      "HTTP request goes out, usually hits a CDN edge or load balancer before your server.",
      "Server responds, browser parses HTML, builds DOM/CSSOM, downloads subresources, paints.",
      "Follow-up they will ask: where would you cache, and what breaks if DNS TTL is 24 hours."] },
    { d:1, q:"How do you check what is running on port 8080 and kill it?", a:[
      "lsof -i :8080 or ss -ltnp | grep 8080 (netstat is deprecated on modern distros).",
      "kill PID sends SIGTERM (graceful), kill -9 sends SIGKILL (no cleanup, no chance to flush).",
      "Say you prefer SIGTERM first because SIGKILL skips shutdown hooks and can corrupt in-flight writes."] },
    { d:1, q:"Difference between a process and a thread, and what is a zombie process?", a:[
      "Process has its own memory space; threads share the parent memory and file descriptors.",
      "A zombie has exited but its parent has not called wait(), so the exit code still sits in the process table.",
      "Common in containers: PID 1 does not reap children, which is why you use tini or the init flag in Docker."] },
    { d:1, q:"How do you find which directory is eating disk on a server?", a:[
      "df -h to see which mount is full, then du -sh * | sort -h inside the suspect path.",
      "Classic gotcha: df shows full but du shows nothing, which means a deleted file is still held open by a process. Find it with lsof | grep deleted and restart that process.",
      "Second classic: inode exhaustion. df -i. Millions of tiny session or log files."] },
    { d:2, q:"Explain file permissions 644 vs 755 and why your deploy script fails with permission denied.", a:[
      "Digits are owner/group/other, r=4 w=2 x=1. 644 is rw-r--r--, 755 is rwxr-xr-x.",
      "A shell script needs the execute bit; chmod +x. A directory needs x to be traversed, not just r.",
      "In containers the usual cause is a non-root USER writing to a root-owned volume mount."] },
    { d:2, q:"What do you look at first when a server is slow?", a:[
      "uptime for load average vs core count, then top/htop to split user vs system vs iowait.",
      "High iowait means disk or network storage. High sys means syscall or context-switch churn. High user means real CPU work.",
      "free -h for memory and swap, dmesg -T | tail for OOM killer messages, ss -s for socket exhaustion.",
      "Name the sequence out loud: USE method, utilisation, saturation, errors."] },
    { d:2, q:"What is the difference between a hard link and a symlink, and why does it matter in deployments?", a:[
      "Hard link points at the same inode; symlink is a path pointer that can dangle.",
      "The atomic deploy pattern uses a symlink: build into releases/2024-05-01, then swap the current symlink. The swap is a single operation so there is no half-deployed state.",
      "Rollback becomes repointing the symlink at the previous release."] },
    { d:2, q:"TCP vs UDP, and where does each show up in your stack?", a:[
      "TCP is ordered, reliable, connection-oriented with congestion control. UDP is fire and forget.",
      "TCP: HTTP/1.1 and HTTP/2, Postgres, Redis. UDP: DNS, statsd metrics, QUIC (HTTP/3 rebuilds reliability on top of UDP in userspace).",
      "Mention head-of-line blocking as the reason HTTP/3 moved off TCP."] },
    { d:2, q:"What is the difference between 502, 503 and 504?", a:[
      "502 Bad Gateway: the proxy reached upstream but got a garbage or broken response, often the app crashed or the socket closed.",
      "503 Service Unavailable: no healthy upstream at all, or the app is deliberately shedding load.",
      "504 Gateway Timeout: upstream accepted but did not answer inside the proxy timeout, so usually a slow query or an external call.",
      "Being able to split these three instantly is a strong signal you have debugged production."] },
    { d:2, q:"Explain CIDR notation and how you would design a VPC subnet layout.", a:[
      "10.0.0.0/16 gives you 65k addresses; the /number is how many bits are fixed as network.",
      "Split into public subnets (with an internet gateway route) for load balancers, private subnets for app servers, isolated subnets for databases.",
      "Spread across at least two availability zones for HA. Private subnets reach the internet via a NAT gateway.",
      "Say why: the database should have no route to the internet at all."] },
    { d:2, q:"What is a reverse proxy and why not expose the app server directly?", a:[
      "TLS termination, request buffering for slow clients, static file serving, gzip/brotli, rate limiting, and a single point for routing.",
      "App servers like gunicorn are bad at slow-client handling; nginx buffers so a worker is not held hostage.",
      "Also gives you a place to do blue-green traffic shifting without touching the app."] },
    { d:3, q:"Your app cannot reach an external API from inside the cluster but curl works from your laptop. Debug it.", a:[
      "Layer by layer. DNS first: nslookup or dig from inside the pod, check the cluster DNS config and search domains.",
      "Then connectivity: curl -v with a timeout, telnet on the port, check whether it hangs (firewall drop) or refuses (nothing listening).",
      "Then egress rules: security groups, NACLs, NetworkPolicy, NAT gateway route, and whether the target allowlists IPs.",
      "Then TLS: cert chain missing in a slim base image (ca-certificates not installed) is a very common one.",
      "Then proxy env vars: HTTP_PROXY set in the image but not honoured by the HTTP client."] },
    { d:3, q:"What are file descriptors and how do you hit the limit?", a:[
      "Every socket, file and pipe is an fd. Default ulimit -n is often 1024, which a busy server blows through.",
      "Symptom: too many open files errors, accept failures, connections hanging.",
      "Fix: raise ulimit via systemd LimitNOFILE or the container runtime, and fix the actual leak (unclosed HTTP clients, connections not pooled)."] },
    { d:3, q:"Explain what happens with the OOM killer and how it interacts with containers.", a:[
      "Kernel picks a victim by oom_score when memory is exhausted. In a container with a memory limit, the cgroup limit triggers it for that cgroup only.",
      "Exit code 137 = 128 + 9, SIGKILL. That is your signal in Kubernetes as OOMKilled.",
      "Fix path: raise the limit, cut the actual usage, or find the leak. Note that JVM/Node need to be told the container limit or they size the heap off host memory."] },
    { d:3, q:"How does SSH key-based auth work and how would you manage keys across a fleet?", a:[
      "Client proves possession of the private key against the public key in authorized_keys; no secret crosses the wire.",
      "At scale you do not hand-manage authorized_keys: use a bastion plus short-lived certificates (SSH CA), or drop SSH entirely for SSM Session Manager.",
      "The senior answer is: remove interactive SSH from the normal path so all changes go through CI."] },
  ]
},
{
  id: "git",
  name: "Git & Branching Strategy",
  blurb: "Cheap to ask, and interviewers use rebase-vs-merge to find out if you have ever cleaned up a broken main.",
  questions: [
    { d:1, q:"Difference between git merge and git rebase.", a:[
      "Merge preserves history and creates a merge commit. Rebase replays your commits on top of the target, creating new commit SHAs and a linear history.",
      "Rule of thumb: rebase your own local branch, never rebase a shared branch that others have pulled.",
      "Say what you actually use: rebase feature branches to keep main linear, merge with a merge commit for release branches."] },
    { d:1, q:"git reset --soft vs --mixed vs --hard.", a:[
      "soft: moves HEAD, keeps changes staged. mixed (default): moves HEAD, unstages, keeps working tree. hard: throws away everything.",
      "revert is the safe production answer: it creates a new commit that undoes, so shared history is not rewritten."] },
    { d:2, q:"You committed a secret and pushed. What now?", a:[
      "Rotate the secret first. That is the actual fix; the git history cleanup is secondary and the key is already compromised.",
      "Then purge with git filter-repo or BFG, force push, and get everyone to re-clone.",
      "Then prevent: pre-commit hooks with gitleaks or trufflehog, plus push protection on the remote."] },
    { d:2, q:"Explain trunk-based development vs GitFlow. Which would you pick?", a:[
      "GitFlow has develop, release, hotfix and feature branches; suits versioned software with long QA cycles.",
      "Trunk-based means short-lived branches merged to main daily, with feature flags hiding incomplete work; suits continuous deployment.",
      "Pick trunk-based for a web/SaaS product and justify it: less merge pain, faster feedback, and release decoupled from deploy via flags.",
      "Be honest about the cost: trunk-based needs good tests and feature flags, or it is just chaos."] },
    { d:2, q:"What is git cherry-pick and when is it a smell?", a:[
      "Copies a single commit onto another branch. Legit for hotfix backports.",
      "Smell when it becomes the routine way to move code, because you end up with duplicated commits and drifting branches."] },
    { d:2, q:"How do you bisect a regression?", a:[
      "git bisect start, mark a known bad and known good commit, git bisects and you test each step; git bisect run with a script automates it.",
      "It is binary search over history, so it needs small, individually working commits, which is an argument for atomic commits."] },
    { d:2, q:"What goes into a good PR and what do you look for reviewing one?", a:[
      "Small, one concern, description with the why and the test evidence, and a rollback note.",
      "Reviewing: correctness, error handling, N+1 queries, missing indexes, secrets, logging levels, backward compatibility of migrations and API contracts.",
      "Say you leave blocking vs non-blocking comments explicitly so the author knows what stops the merge."] },
    { d:2, q:"What is a monorepo, and how do you handle CI in one?", a:[
      "One repo, many deployable units. Advantage: atomic cross-service changes and shared tooling.",
      "CI must be path-filtered, otherwise every commit runs every test. Tools: Nx, Turborepo, Bazel, or just paths filters in GitHub Actions.",
      "Mention affected-graph builds and remote caching as the thing that keeps it fast."] },
    { d:3, q:"How would you enforce that main is always deployable?", a:[
      "Branch protection: required status checks, required review, no force push, linear history.",
      "CI must run the same commands as local, tests must be deterministic, and flaky tests get quarantined not ignored.",
      "Merge queue so PRs are tested against the post-merge state, not a stale base."] },
    { d:3, q:"Explain git submodules vs subtree vs package registry for shared code.", a:[
      "Submodule: pointer to another repo, exact SHA, easy to forget to update, painful for contributors.",
      "Subtree: vendored copy, no extra clone step, harder to push changes upstream.",
      "Published package (npm/PyPI private registry): cleanest versioning and the usual right answer for a shared UI or SDK library."] },
  ]
},
{
  id: "cicd",
  name: "CI/CD Pipelines",
  blurb: "The single most asked DevOps area for app engineers. Expect to whiteboard a pipeline.",
  questions: [
    { d:1, q:"What is the difference between continuous integration, continuous delivery and continuous deployment?", a:[
      "CI: every merge is built and tested automatically.",
      "Continuous delivery: every green build produces a deployable artifact and could be released with one button.",
      "Continuous deployment: that release happens automatically with no human gate.",
      "Most companies are at delivery, not deployment, and being clear about that distinction reads as experience."] },
    { d:1, q:"Walk me through your ideal pipeline for a web app.", a:[
      "Trigger on PR: install with a lockfile, restore cache, lint, typecheck, unit tests, build.",
      "On merge to main: build a versioned immutable artifact (docker image or bundle) tagged with the commit SHA.",
      "Deploy to staging automatically, run smoke and integration tests.",
      "Promote the same artifact to production, never rebuild for prod. Rebuild means you shipped something you did not test.",
      "Post-deploy: health check, canary window, automatic rollback trigger."] },
    { d:2, q:"Why should you never rebuild the artifact between staging and production?", a:[
      "Dependencies can resolve differently, base images move, build-time env vars differ. You would be testing one binary and shipping another.",
      "Build once, promote by reference. Env-specific config comes in at runtime, not build time.",
      "Caveat for frontend: if env vars are baked at build time (Next.js NEXT_PUBLIC_, Vite import.meta.env), you either build per env or move that config to runtime. Be ready for this follow-up."] },
    { d:2, q:"How do you handle secrets in CI?", a:[
      "Secrets store in the CI provider or a vault, injected as env vars at runtime, masked in logs, never in the repo.",
      "For cloud access prefer OIDC federation over long-lived keys, so the pipeline exchanges a short-lived token per run.",
      "Scope by environment with required approvals for prod, and remember a fork PR must not get access to secrets."] },
    { d:2, q:"How do you speed up a slow pipeline?", a:[
      "Measure first: which stage owns the minutes.",
      "Dependency caching keyed on the lockfile hash, docker layer caching or buildx cache, parallel test shards, path filters so unrelated changes skip jobs.",
      "Move slow e2e off the PR path and onto post-merge or nightly, with a smaller smoke subset on PRs.",
      "Bigger runners are a legitimate answer when engineer time costs more than compute."] },
    { d:2, q:"What is a matrix build and when do you need one?", a:[
      "Same job run across a dimension: node versions, python versions, OS, browser.",
      "Needed for a library that supports many versions; usually overkill for an app that pins one runtime."] },
    { d:2, q:"How would you set up CI for a React or Next.js app specifically?", a:[
      "npm ci not npm install, so the lockfile is authoritative.",
      "Lint, tsc --noEmit, unit tests with vitest/jest, build, and a bundle-size check that fails the PR on regression.",
      "Cache node_modules or the package manager store plus the framework build cache (.next/cache).",
      "Preview deploy per PR is the highest-value addition for frontend teams."] },
    { d:2, q:"How do you manage database migrations in a pipeline?", a:[
      "Migrations run as a separate step before the new code, and must be backward compatible with the currently running version.",
      "Expand and contract: add a nullable column, backfill, deploy code that writes both, then deploy code that reads new, then drop the old column in a later release.",
      "Never destructive in the same deploy as the code change, because rollback then becomes impossible.",
      "Long-running migrations on a big table need to be run out-of-band, not inside a deploy that has a timeout."] },
    { d:2, q:"What is the difference between a job, a step, a runner and a workflow in GitHub Actions?", a:[
      "Workflow: the YAML file with triggers. Job: a set of steps on one runner, jobs run in parallel by default. Step: a single command or action. Runner: the VM/container executing a job.",
      "needs: creates a dependency graph, artifacts pass data between jobs since jobs do not share a filesystem.",
      "Know concurrency groups for cancelling superseded runs, and environments for approval gates."] },
    { d:2, q:"How do you version your releases?", a:[
      "Semver for libraries. For apps, the commit SHA plus an incrementing build number is more useful than a marketing version.",
      "Tag the docker image with both the SHA and a moving tag, and never deploy from a moving tag.",
      "Mention automated versioning with conventional commits and semantic-release if the team wants changelogs for free."] },
    { d:3, q:"Blue-green vs canary vs rolling deploy. Trade-offs.", a:[
      "Rolling: replace instances gradually, cheapest, but two versions run at once so contracts must be compatible.",
      "Blue-green: full second environment, instant cutover and instant rollback, costs double infra during the switch, and shared state like the database is still shared.",
      "Canary: send a small percent of real traffic to the new version, watch error rate and latency, then ramp. Best risk profile, needs good metrics and traffic splitting.",
      "The honest answer: canary needs observability to be meaningful, otherwise it is just a slow rollout."] },
    { d:3, q:"How do you roll back a bad deploy that also ran a migration?", a:[
      "You cannot un-run a destructive migration cleanly, which is exactly why migrations must be additive and backward compatible.",
      "With expand-and-contract, rolling back the code is safe because the old code still works against the new schema.",
      "If it is already destructive: restore from a point-in-time backup, accept data loss for the window, or write a forward fix. Say plainly that forward-fix is usually faster than restore."] },
    { d:3, q:"What is a self-hosted runner and when would you use one?", a:[
      "Runner on your infra, used for access to private networks, large caches, special hardware, or cost at high volume.",
      "Risk: a compromised job runs on your network. Never use them for public fork PRs; use ephemeral runners so state does not leak between jobs."] },
    { d:3, q:"How would you build CI/CD for a mobile app?", a:[
      "Build on a macOS runner for iOS; signing certs and provisioning profiles in a secure store (fastlane match or the CI secret store).",
      "Version code must be generated, not hand-edited, or you ship two builds with the same code.",
      "Distribute internal builds to Firebase App Distribution or TestFlight, promote to stores on tag.",
      "Android specifics: signed release APK/AAB, R8 and ProGuard rules verified in CI because release-only crashes are the classic failure."] },
    { d:3, q:"How do you test the pipeline itself?", a:[
      "Lint the YAML, run it on a branch before merging, keep logic in scripts in the repo rather than inline YAML so it can be run locally.",
      "act for local GitHub Actions, or just: make the pipeline call make deploy so the same entrypoint works everywhere.",
      "Say the principle: the pipeline should be a thin orchestrator over scripts you can run by hand at 2am."] },
    { d:3, q:"What is GitOps?", a:[
      "Desired state lives in git; a controller in the cluster (ArgoCD, Flux) continuously reconciles reality to it.",
      "Benefits: git is the audit log, rollback is a revert, drift is detected and corrected.",
      "Trade-off: the deploy is now async, so your pipeline finishing does not mean it is live. You need to watch the sync status."] },
  ]
},
{
  id: "docker",
  name: "Docker & Containers",
  blurb: "Guaranteed to come up. Know the layer model and multi-stage builds cold.",
  questions: [
    { d:1, q:"What is a container, and how is it different from a VM?", a:[
      "A container is a process on the host kernel isolated with namespaces (pid, net, mount, user) and limited with cgroups.",
      "A VM virtualises hardware and runs its own kernel, so it is heavier but has a stronger isolation boundary.",
      "Consequence to state: containers share the host kernel, so a Linux container cannot run on a Windows kernel natively, and a kernel exploit crosses the boundary."] },
    { d:1, q:"Image vs container vs registry.", a:[
      "Image: immutable layered filesystem plus metadata. Container: a running instance with a thin writable layer on top. Registry: where images are stored and pulled from.",
      "Data written into the writable layer dies with the container. That is why you mount volumes."] },
    { d:1, q:"Difference between CMD and ENTRYPOINT.", a:[
      "ENTRYPOINT is the executable, CMD is the default arguments. Args passed to docker run replace CMD, not ENTRYPOINT.",
      "Use exec form (JSON array), because shell form wraps in /bin/sh -c and your process no longer receives SIGTERM as PID 1, so graceful shutdown breaks."] },
    { d:1, q:"COPY vs ADD.", a:[
      "COPY just copies. ADD also auto-extracts tarballs and can fetch a URL.",
      "Use COPY by default; ADD surprises people. Fetch URLs explicitly with curl so you can verify a checksum."] },
    { d:2, q:"Explain Docker layer caching and how you order a Dockerfile because of it.", a:[
      "Each instruction is a layer keyed by the instruction and the content it touches. A changed layer invalidates everything after it.",
      "So: copy the lockfile and install dependencies first, then copy the source. Otherwise every source edit reinstalls node_modules.",
      "Combine apt-get update and install in one RUN, and clean the apt lists in the same layer or the files stay in the image."] },
    { d:2, q:"What is a multi-stage build and why does it matter?", a:[
      "Build in a fat image with compilers and dev dependencies, then COPY only the artifact into a slim runtime image.",
      "Cuts image size massively, removes build tools from the attack surface, and keeps source and secrets out of the final layers.",
      "Concrete example: node:20 builder producing dist/, copied into nginx:alpine or node:20-slim."] },
    { d:2, q:"Why is your image 1.8 GB and how do you shrink it?", a:[
      "Multi-stage, slim or alpine base, .dockerignore so node_modules and .git are not sent as build context, no dev dependencies in the final stage.",
      "Do not delete files in a later layer expecting size to drop; the data is still in the earlier layer.",
      "Caveat on alpine: musl instead of glibc can break native modules and has caused real DNS and performance issues. slim is often the safer default."] },
    { d:2, q:"How do you get configuration and secrets into a container?", a:[
      "Environment variables for config, injected at run time from the orchestrator.",
      "Secrets should not be baked into the image or passed as build args, because build args are visible in image history.",
      "Use the platform secret mechanism (K8s secrets with a KMS backend, ECS secrets from Secrets Manager, docker buildkit secret mounts for build-time)."] },
    { d:2, q:"What are volumes and bind mounts?", a:[
      "Bind mount maps a host path into the container; great for local dev hot reload, dangerous in prod because it couples you to host layout.",
      "Named volumes are managed by the runtime and are the right choice for stateful data like a local Postgres.",
      "tmpfs for secrets or scratch that should never touch disk."] },
    { d:2, q:"What is a health check and why does it matter to the orchestrator?", a:[
      "HEALTHCHECK or the orchestrator probe tells the platform whether to route traffic and whether to restart.",
      "Liveness: am I broken, restart me. Readiness: am I ready for traffic, take me out of the pool.",
      "Getting these backwards is a classic incident: a liveness probe that hits the database restarts every pod when the database is slow, turning a degradation into an outage."] },
    { d:2, q:"How do containers talk to each other?", a:[
      "On a user-defined docker network they resolve each other by service name via the embedded DNS.",
      "localhost inside a container is that container, which is the number one beginner bug when connecting to a database on the host.",
      "In compose, depends_on controls start order but not readiness; you still need retry logic or a wait-for script."] },
    { d:2, q:"Why should a container run as non-root?", a:[
      "Reduces blast radius if the process is compromised, and many platforms enforce it.",
      "Add a USER instruction and make sure file ownership matches, otherwise you get permission denied on writes.",
      "Also: do not run as root just to bind port 80, use a high port and let the proxy handle 80."] },
    { d:3, q:"Your container exits immediately with code 0. What is happening?", a:[
      "A container lives as long as PID 1. If the main process forks to background or the command completes, it exits.",
      "Exit 0 means clean exit; 1 is a generic app error; 137 is SIGKILL/OOM; 139 is segfault; 143 is SIGTERM.",
      "Debug by overriding the entrypoint with sh and inspecting, or docker logs plus docker inspect for the exit reason."] },
    { d:3, q:"How do you handle graceful shutdown in a container?", a:[
      "The orchestrator sends SIGTERM, waits a grace period, then SIGKILL.",
      "Your app must catch SIGTERM, stop accepting new connections, finish in-flight requests, close DB pools, then exit.",
      "Two traps: shell-form entrypoint swallowing the signal, and the pod being removed from the load balancer after SIGTERM rather than before, which is why you add a preStop sleep."] },
    { d:3, q:"What is the difference between docker-compose and an orchestrator?", a:[
      "Compose is single-host, declarative, great for local dev and small deployments. No scheduling, no self-healing across nodes, no rolling update guarantees.",
      "An orchestrator adds scheduling, service discovery, autoscaling, rollout control and multi-node failure handling.",
      "Honest answer for a small team: compose on one big box plus a managed database goes further than people admit."] },
    { d:3, q:"How would you scan and secure your images?", a:[
      "Trivy or Grype in CI, fail on high or critical with a documented exception process.",
      "Pin base images by digest, rebuild regularly so patched bases actually land, use distroless or minimal bases.",
      "Sign images (cosign) and verify at admission if the org needs supply-chain guarantees. Generate an SBOM."] },
    { d:3, q:"Explain what happens on docker build in terms of build context.", a:[
      "The whole directory is tarred and sent to the daemon before any instruction runs, which is why a missing .dockerignore makes builds slow and can leak .env or .git into the context.",
      "BuildKit improves this with parallel stages, cache mounts for package managers, and secret mounts that do not persist in layers."] },
    { d:3, q:"How do you debug a container that has no shell?", a:[
      "Distroless has no shell by design. Use kubectl debug with an ephemeral container sharing the process namespace, or docker run with the same image and a different entrypoint.",
      "Better: make sure logs and metrics tell you enough that you rarely need a shell. Exec-into-prod is a smell you should name as such."] },
  ]
},
{
  id: "k8s",
  name: "Kubernetes",
  blurb: "You do not need to be a cluster admin. You do need to explain pods, services, probes and a rollout without hedging.",
  questions: [
    { d:1, q:"What is a pod, and why not just a container?", a:[
      "A pod is one or more containers sharing a network namespace and volumes, scheduled together on one node.",
      "Sidecars are the reason for multiple containers: log shipper, service mesh proxy, or an init container that runs migrations before the app starts.",
      "Pods are ephemeral and get a new IP each time, which is why you never talk to a pod IP directly."] },
    { d:1, q:"Deployment vs StatefulSet vs DaemonSet vs Job.", a:[
      "Deployment: stateless replicas, interchangeable, rolling updates.",
      "StatefulSet: stable network identity and stable persistent volume per replica, ordered start and stop. For databases and queues.",
      "DaemonSet: one pod per node. For log collectors and node agents.",
      "Job/CronJob: run to completion, batch work and scheduled tasks."] },
    { d:1, q:"What is a Service and what are the types?", a:[
      "A stable virtual IP and DNS name in front of a changing set of pods, selected by labels.",
      "ClusterIP: internal only. NodePort: opens a port on every node. LoadBalancer: provisions a cloud LB. ExternalName: a DNS alias.",
      "Ingress sits above services for HTTP routing by host and path with TLS termination."] },
    { d:2, q:"Liveness vs readiness vs startup probe.", a:[
      "Liveness failing restarts the container. Readiness failing removes it from the service endpoints but leaves it running. Startup gives a slow-booting app time before liveness begins.",
      "Rule: readiness should check dependencies you need to serve traffic; liveness should only check that the process itself is wedged.",
      "The classic outage: liveness checks the database, database blips, every pod restarts simultaneously."] },
    { d:2, q:"Explain requests vs limits.", a:[
      "Request is what the scheduler reserves and uses for placement. Limit is the hard ceiling enforced by cgroups.",
      "CPU over limit gets throttled; memory over limit gets OOMKilled.",
      "QoS classes: Guaranteed (request equals limit), Burstable, BestEffort. BestEffort is evicted first under node pressure.",
      "Common advice: set memory request equal to limit, be careful with tight CPU limits because throttling causes latency spikes that look like app slowness."] },
    { d:2, q:"How does a rolling update actually work?", a:[
      "The Deployment creates a new ReplicaSet and shifts replicas over, governed by maxSurge and maxUnavailable.",
      "New pods must pass readiness before old ones are removed. kubectl rollout status watches it; kubectl rollout undo reverts to the previous ReplicaSet.",
      "Requires N-1 compatibility because both versions serve traffic simultaneously."] },
    { d:2, q:"ConfigMap vs Secret.", a:[
      "Both are key-value objects mounted as env vars or files. Secrets are only base64 encoded, not encrypted, unless you enable encryption at rest.",
      "Real answer for production: external secrets operator or CSI driver pulling from Vault, AWS Secrets Manager or GCP Secret Manager.",
      "Note that env var changes need a pod restart; mounted files can update in place, which is why some teams mount config as files."] },
    { d:2, q:"How does autoscaling work in Kubernetes?", a:[
      "HPA scales replica count on CPU, memory or custom metrics. VPA adjusts requests. Cluster Autoscaler adds nodes when pods are unschedulable. KEDA scales on queue depth or external events.",
      "HPA on CPU is a proxy metric; queue length or request latency is usually the honest signal.",
      "Mention scale-down stabilisation to avoid thrashing."] },
    { d:2, q:"What is a namespace and how do you use it?", a:[
      "Logical partition for names, RBAC, resource quotas and network policy scoping. Not a hard security boundary on its own.",
      "Common split: per environment or per team. Cross-namespace DNS is service.namespace.svc.cluster.local."] },
    { d:2, q:"Your pod is stuck in Pending. Why?", a:[
      "No node has enough allocatable CPU or memory for the requests, so the scheduler cannot place it.",
      "Or: no node matches nodeSelector, affinity or taints/tolerations. Or a PVC cannot bind because the storage class or zone does not match.",
      "kubectl describe pod and read the Events section. That is the answer to almost every K8s debugging question."] },
    { d:2, q:"CrashLoopBackOff. Walk me through it.", a:[
      "Container starts, exits, kubelet restarts with exponential backoff.",
      "kubectl logs pod --previous to see the crashed instance, then describe for exit codes and probe failures.",
      "Usual causes: bad config or missing env var, failing migration on boot, OOMKilled (137), or a liveness probe that is too aggressive for the boot time."] },
    { d:3, q:"How does traffic reach a pod, end to end?", a:[
      "Cloud LB to Ingress controller (nginx, traefik, ALB controller) to Service to pod. kube-proxy or eBPF programs the node-level rules that pick an endpoint.",
      "The Service selects pods by label; the Endpoints/EndpointSlice object holds the ready pod IPs.",
      "Pods must pass readiness to be in EndpointSlice, which is the link between probes and traffic."] },
    { d:3, q:"How would you achieve zero-downtime deploys in Kubernetes?", a:[
      "Readiness probes accurate, maxUnavailable 0 with maxSurge 1, PodDisruptionBudget so voluntary evictions do not take the whole service.",
      "preStop hook with a short sleep so the endpoint removal propagates before the process stops accepting connections.",
      "terminationGracePeriodSeconds longer than your longest request, app handles SIGTERM, and connection draining at the LB.",
      "Plus backward-compatible schema and API changes, since both versions run at once."] },
    { d:3, q:"What is a Helm chart and what is the alternative?", a:[
      "Templated, versioned, parameterised manifests with release tracking and rollback. Values files per environment.",
      "Alternatives: Kustomize for overlay-based patching without templating, or plain manifests generated by a script.",
      "Trade-off: Helm templating in YAML gets unreadable fast; Kustomize is simpler but less expressive for reusable third-party packaging."] },
    { d:3, q:"What is a NetworkPolicy?", a:[
      "Default in Kubernetes is that every pod can reach every pod. NetworkPolicy restricts ingress and egress by label selector and namespace.",
      "Requires a CNI that implements it (Calico, Cilium); on a CNI that ignores it, the policy silently does nothing, which is a dangerous false sense of safety.",
      "Standard pattern: default deny in the namespace, then explicitly allow."] },
    { d:3, q:"Do you actually need Kubernetes? Argue against it.", a:[
      "Strong answer for a 2 YOE engineer. K8s buys you multi-service scheduling, self-healing and portability at the price of a whole operational discipline.",
      "For a small team a managed platform (ECS Fargate, Cloud Run, Render, Fly, App Runner) gives 80 percent of the value with a fraction of the surface area.",
      "Say the deciding factors: number of services, team size, whether someone owns the platform, and compliance or multi-cloud needs."] },
  ]
},
{
  id: "cloud",
  name: "Cloud & Infrastructure",
  blurb: "AWS-flavoured but the concepts transfer. Interviewers want the reasoning, not the console clicks.",
  questions: [
    { d:1, q:"IaaS vs PaaS vs SaaS, with examples from what you have used.", a:[
      "IaaS: EC2, raw compute, you own the OS. PaaS: Elastic Beanstalk, Cloud Run, Render, Vercel; you hand over code. SaaS: the finished product.",
      "Answer in terms of what you stop being responsible for at each level, and what you give up in control."] },
    { d:1, q:"What is a load balancer and what is the difference between L4 and L7?", a:[
      "L4 routes on IP and port, fast, protocol agnostic (NLB). L7 understands HTTP so it can route by host, path and header, terminate TLS, and retry (ALB).",
      "L7 is what you want for a web app; L4 for raw TCP, websockets at extreme scale, or non-HTTP protocols."] },
    { d:1, q:"Explain object storage vs block storage.", a:[
      "Object (S3, GCS): flat namespace, HTTP API, cheap, infinitely scalable, eventually strong-consistent, no partial writes. For assets, backups, logs.",
      "Block (EBS): a disk attached to one instance, for databases and filesystems.",
      "Never store user uploads on the instance filesystem: it dies with the instance and does not scale horizontally."] },
    { d:2, q:"What is a CDN and what should you cache on it?", a:[
      "Edge PoPs that serve cached content near the user, cutting latency and origin load.",
      "Cache hashed static assets with a one-year immutable max-age; cache HTML carefully or not at all; use stale-while-revalidate for near-static pages.",
      "Know cache invalidation: you do not purge hashed assets, you ship a new filename. Purge is only for HTML and unhashed files."] },
    { d:2, q:"Explain autoscaling and what metric you would scale on.", a:[
      "Target tracking on a metric with a scaling policy plus cooldowns. CPU is the default but often wrong.",
      "Better: requests per instance, p95 latency, or queue depth for workers.",
      "Talk about warm-up time: if an instance takes 3 minutes to be ready, reactive scaling arrives after the spike. Hence scheduled scaling for known patterns and headroom in the target."] },
    { d:2, q:"What is infrastructure as code and why does it matter?", a:[
      "Terraform, Pulumi, CloudFormation, CDK: infra defined in version-controlled code, planned and applied.",
      "Benefits: reviewable diffs, reproducible environments, no snowflake servers, and disaster recovery becomes a re-apply.",
      "Say you know terraform plan is the review artifact and state is the source of truth that must be remote and locked."] },
    { d:2, q:"What is Terraform state and what goes wrong with it?", a:[
      "State maps your config to real resources. Local state means only you can apply, and losing it means Terraform no longer knows what it owns.",
      "Remote backend (S3 plus DynamoDB lock, or Terraform Cloud) so the team shares it with locking.",
      "Drift when someone changes things in the console. terraform import to adopt existing resources; never edit state by hand unless you must, and then take a backup."] },
    { d:2, q:"Explain IAM roles vs users vs policies.", a:[
      "User: a long-lived identity with credentials. Role: assumed temporarily, returns short-lived credentials. Policy: the JSON permission document attached to either.",
      "Prefer roles everywhere: instance profiles for EC2, IRSA for EKS pods, OIDC for CI. Long-lived access keys are the thing that leaks.",
      "Least privilege plus explicit deny, and scope by resource ARN not wildcard."] },
    { d:2, q:"How do you handle multi-environment infrastructure?", a:[
      "Separate accounts or projects per environment for a real blast-radius boundary, not just separate namespaces.",
      "Same Terraform modules parameterised per env, so staging is structurally identical to prod at a smaller size.",
      "Say the failure mode you are avoiding: staging that does not resemble prod tests nothing."] },
    { d:2, q:"What is a NAT gateway and why do you need one?", a:[
      "Lets private subnet resources make outbound connections without being reachable inbound.",
      "It is a real cost line, and data processing charges surprise people. VPC endpoints for S3 and other AWS services avoid routing that traffic through NAT."] },
    { d:2, q:"Serverless: when would you use it and when would you not?", a:[
      "Good for spiky or low-volume workloads, event handlers, cron, glue code. You pay per request and scale to zero.",
      "Bad for: sustained high throughput where a container is cheaper, long-running jobs beyond the timeout, workloads needing a persistent connection pool to a database (hence RDS Proxy), and latency-sensitive paths where cold starts hurt.",
      "Mention vendor lock-in honestly rather than as a slogan."] },
    { d:3, q:"How would you design a disaster recovery plan?", a:[
      "Define RPO (how much data you can lose) and RTO (how long you can be down) first; everything follows from those numbers.",
      "Tiers: backup and restore (cheap, hours), pilot light, warm standby, active-active (expensive, seconds).",
      "Backups are worthless untested. Say you restore-test on a schedule.",
      "Include the non-obvious: DNS TTLs, secrets replication, and whether your IaC can actually rebuild the environment."] },
    { d:3, q:"How do you control cloud cost?", a:[
      "Tagging and cost allocation first, so you can attribute spend.",
      "Usual wins: right-sizing over-provisioned instances, spot for stateless and batch, savings plans for steady baseline, S3 lifecycle rules to cheaper tiers, deleting orphaned volumes and idle load balancers, and cutting NAT and cross-AZ data transfer.",
      "Alerting on anomaly rather than reviewing monthly."] },
    { d:3, q:"Explain availability zones vs regions and how you design for failure.", a:[
      "AZ: an isolated datacentre within a region, single-digit ms apart. Region: geographically separate, independent failure domain.",
      "Multi-AZ is the default expectation for production: LB across AZs, database with a standby in another AZ.",
      "Multi-region is a big step up in complexity because of data replication and consistency, so justify it with a real requirement."] },
    { d:3, q:"What is the shared responsibility model?", a:[
      "Provider secures the cloud (hardware, hypervisor, managed service internals); you secure what is in it (IAM, data, network config, patching your images and code).",
      "The interesting part is the middle: a managed database is patched for you but the security group and credentials are yours, and that is where breaches happen."] },
    { d:3, q:"How would you migrate a monolith on a single VM to something modern, with zero downtime?", a:[
      "Containerise as-is first, no rewrite. Get it building reproducibly and running in staging.",
      "Move state out: sessions to Redis, uploads to object storage, scheduled jobs to a proper scheduler.",
      "Stand up the new environment in parallel, shift traffic gradually at the DNS or load balancer level, keep the old one warm for rollback.",
      "Then, and only then, consider splitting services, driven by actual pain points rather than fashion."] },
  ]
},
{
  id: "web",
  name: "Nginx, Proxies & Web Serving",
  blurb: "The glue between the internet and your app. Frequently asked because most engineers only half know it.",
  questions: [
    { d:1, q:"What does nginx do in a typical stack?", a:[
      "TLS termination, static file serving, reverse proxy to the app, gzip/brotli, caching, rate limiting, and request buffering.",
      "It is event-driven with a small worker count, so it handles many idle connections cheaply, which is exactly what app workers are bad at."] },
    { d:1, q:"What is CORS and how do you fix a CORS error?", a:[
      "Browser-enforced rule: a page on origin A cannot read a response from origin B unless B sends Access-Control-Allow-Origin.",
      "It is fixed on the server, never in the frontend. A preflight OPTIONS request happens for non-simple requests, so the server must answer OPTIONS too.",
      "With credentials you cannot use the wildcard origin and must set Allow-Credentials. Say this precisely, it is a common trap."] },
    { d:2, q:"Explain HTTP caching headers.", a:[
      "Cache-Control is the main one: max-age, s-maxage for shared caches, no-store vs no-cache (which means revalidate, not do not cache), immutable, stale-while-revalidate.",
      "ETag and Last-Modified drive conditional requests returning 304.",
      "Practical policy: hashed assets get max-age=31536000, immutable. HTML gets no-cache so users always get the latest reference to those assets."] },
    { d:2, q:"How do you configure a reverse proxy for a single page app plus an API?", a:[
      "Serve the built static files, with try_files falling back to index.html so client-side routes do not 404 on refresh.",
      "Proxy /api to the backend upstream, forwarding X-Forwarded-For, X-Forwarded-Proto and Host so the app knows the real client and scheme.",
      "Long-lived connections (SSE, websockets) need Upgrade headers and a raised proxy_read_timeout."] },
    { d:2, q:"What is TLS termination and what is an SSL certificate chain?", a:[
      "The proxy decrypts and forwards plaintext (or re-encrypts) to the backend. Certificate proves ownership; the chain links your cert to a trusted root.",
      "A missing intermediate is the classic bug: works in the browser (which caches intermediates) but fails from curl and mobile clients.",
      "Automate renewal with ACME/Let's Encrypt or a managed cert; expired certs are a top-five outage cause."] },
    { d:2, q:"How do you rate limit, and what are the algorithms?", a:[
      "Token bucket allows bursts; leaky bucket smooths; fixed window is simple but has a boundary spike; sliding window fixes that.",
      "Key on user ID for authenticated traffic and IP for anonymous, and return 429 with Retry-After.",
      "At the edge (nginx, Cloudflare, API gateway) for cheap protection, plus in-app for per-tenant fairness. In a multi-instance app the counter has to be shared, hence Redis."] },
    { d:2, q:"What is a websocket and what breaks when you scale it?", a:[
      "Long-lived bidirectional TCP connection upgraded from HTTP.",
      "Scaling problems: sticky sessions or a shared pub-sub backplane (Redis) because a message must reach whichever instance holds that socket.",
      "Load balancer idle timeouts kill idle sockets, so you need heartbeats. Deploys drop every connection, so the client must reconnect with backoff."] },
    { d:2, q:"What headers would you set for security?", a:[
      "Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options nosniff, Referrer-Policy, X-Frame-Options or CSP frame-ancestors, and Permissions-Policy.",
      "CSP is the one that actually stops XSS damage and the one that takes real effort to roll out; start in report-only mode."] },
    { d:2, q:"HTTP/1.1 vs HTTP/2 vs HTTP/3.", a:[
      "1.1: one request at a time per connection, so browsers open six and we used to bundle everything and sprite images.",
      "2: multiplexed streams over one connection plus header compression, so aggressive bundling matters less. Still suffers TCP head-of-line blocking.",
      "3: QUIC over UDP, no TCP head-of-line blocking, faster handshake, better on lossy mobile networks."] },
    { d:3, q:"Nginx returns 502 intermittently. How do you diagnose it?", a:[
      "Correlate the nginx error log with the app log at the same timestamp. Look for upstream prematurely closed connection.",
      "Candidates: app worker crashing or being OOM killed, keepalive timeout mismatch where the upstream closes an idle connection nginx thinks is open, worker count too low so requests queue past a timeout, or a deploy cycling instances without draining.",
      "Fix the keepalive mismatch by making the upstream idle timeout longer than nginx's."] },
    { d:3, q:"How would you do a canary release at the proxy layer?", a:[
      "Weighted upstreams or a split rule that routes a percentage, optionally pinned by a cookie or header so a user has a consistent experience.",
      "Tag metrics by version so you can compare error rate and latency between the two pools.",
      "Automate the abort: if the canary error rate exceeds baseline by a threshold, shift weight back to zero."] },
    { d:3, q:"What is an API gateway and do you need one?", a:[
      "Single entrypoint doing auth, rate limiting, routing, request transformation, and usage metering across services.",
      "Worth it when you have several services and shared cross-cutting concerns. For one backend it is an extra hop and an extra thing to break, so an ingress plus middleware is enough."] },
  ]
},
{
  id: "frontend",
  name: "Frontend Build & Deployment",
  blurb: "Where DevOps meets the browser. This is your differentiator if you are interviewing as a full-stack engineer.",
  questions: [
    { d:1, q:"What actually happens when you run the build for a React app?", a:[
      "Transpile (Babel/SWC/esbuild), resolve the module graph, tree-shake unused exports, bundle and code-split, minify, hash filenames, emit an asset manifest, and inline env vars.",
      "Output is static files that any web server or CDN can serve; there is no runtime build step."] },
    { d:1, q:"CSR vs SSR vs SSG vs ISR.", a:[
      "CSR: empty HTML shell, JS renders. Fast to deploy, bad first paint and SEO.",
      "SSR: HTML rendered per request on a server. Good TTFB-to-content and SEO, but needs a running server and caching strategy.",
      "SSG: rendered at build, served from CDN, fastest and cheapest, but stale until you rebuild.",
      "ISR: SSG plus background regeneration after a revalidate window, the pragmatic middle.",
      "Answer with the trade-off axis: freshness vs cost vs infrastructure."] },
    { d:2, q:"How do environment variables work in a frontend build, and what is the trap?", a:[
      "They are substituted at build time, so anything in NEXT_PUBLIC_ or VITE_ ends up in the shipped bundle and is fully public.",
      "Trap one: putting a secret there. Anyone can read it in devtools.",
      "Trap two: build-once-deploy-everywhere breaks, because the artifact is env-specific. Solutions: build per environment, or fetch runtime config from an endpoint or inject a window.__CONFIG__ script at serve time."] },
    { d:2, q:"How do you deploy a static frontend properly?", a:[
      "Upload to object storage behind a CDN. Upload the hashed assets first, then the HTML last, so the HTML never references a file that is not there yet.",
      "index.html gets no-cache; hashed assets get immutable long max-age. Invalidate only the HTML.",
      "SPA fallback rule so deep links serve index.html with a 200, and a real 404 page for genuinely missing routes."] },
    { d:2, q:"A user reports the site is broken but it works for you. What is your first guess?", a:[
      "Stale cached HTML pointing at a chunk that no longer exists, producing a chunk load error. Classic after a deploy.",
      "Mitigations: keep old assets around for a period rather than deleting on deploy, catch chunk load errors and force a reload, and version the app so the client can detect a mismatch.",
      "Also consider service worker caching an old shell, browser extension interference, and a CDN PoP that is stale."] },
    { d:2, q:"How do you keep bundle size under control?", a:[
      "Measure in CI with a size budget that fails the PR. Analyse with the bundle analyzer.",
      "Route-level code splitting and dynamic import for heavy components. Watch for the whole-library import (moment, lodash, icon packs).",
      "Check the actual big offenders: date libraries, chart libraries, polyfills for browsers you no longer support, and duplicated transitive dependencies."] },
    { d:2, q:"What are Core Web Vitals and how do you improve them?", a:[
      "LCP (largest content paint): preload the hero image and fonts, cut render-blocking resources, server-render above the fold.",
      "INP (interaction to next paint, replaced FID): break up long tasks, avoid heavy synchronous work on input, reduce hydration cost.",
      "CLS: reserve space with width and height on images, avoid injecting banners above content, use font-display swap with a matched fallback metric."] },
    { d:2, q:"What is hydration and what goes wrong with it?", a:[
      "React attaches event listeners to server-rendered HTML. If server and client render different output you get a hydration mismatch.",
      "Causes: Date.now(), random values, browser-only APIs, locale differences, and content that depends on localStorage.",
      "Cost: a large page can be interactive-blocked while hydrating, which is what partial hydration and server components address."] },
    { d:2, q:"How do you do preview deployments and why are they valuable?", a:[
      "Every PR gets a unique URL built from that branch, seeded with staging data.",
      "Value: designers and PMs review the real thing, e2e runs against a real deployment, and you catch build-time failures before merge.",
      "Implementation: Vercel/Netlify do it natively; on your own infra it is a per-PR namespace or a path-prefixed bucket, torn down on merge."] },
    { d:2, q:"How do you monitor a frontend in production?", a:[
      "Error tracking with source maps uploaded at build (Sentry), so stack traces are readable but maps are not public.",
      "Real user monitoring for web vitals split by device and geography, because your laptop is not the user.",
      "Track deploy version in every event so you can tie a spike to a release."] },
    { d:3, q:"How do you roll back a frontend deploy instantly?", a:[
      "Keep every build as an immutable versioned directory or bucket prefix; the deploy is repointing the CDN origin or the alias.",
      "Rollback becomes repointing plus a purge of the HTML, which is seconds, not a rebuild.",
      "Watch the interaction with the API: if the new frontend needed a new API field, rolling back frontend alone is fine, but rolling back the API is not."] },
    { d:3, q:"How do you ship a feature to 10 percent of users from the frontend?", a:[
      "Feature flags evaluated server-side or via a flag service, keyed by a stable user hash so a user stays in the same bucket.",
      "Ship the code dark behind the flag so deploy and release are separate events.",
      "Watch bundle cost: flagged-off code still ships unless it is dynamically imported. Have a cleanup policy or you accumulate dead flags."] },
    { d:3, q:"What is a micro-frontend and would you use one?", a:[
      "Independently deployable frontend pieces composed at runtime (module federation) or build time.",
      "Justified when separate teams need independent release cadence on one product surface.",
      "Costs: shared dependency version drift, duplicated runtime, harder global state and routing, and inconsistent UX. For one team it is pure overhead. Saying no here is a strong answer."] },
    { d:3, q:"How would you handle a frontend app that must work offline or on bad networks?", a:[
      "Service worker with a deliberate strategy per resource: cache-first for the shell, network-first with cache fallback for data.",
      "Queue writes locally and sync when back online, with conflict handling defined up front.",
      "Be explicit about the danger: a badly scoped service worker can pin users on an old version forever, so you need a skipWaiting and update flow."] },
    { d:3, q:"What does a good CDN configuration for a Next.js app look like?", a:[
      "Static assets under the immutable hashed path cached forever at edge and browser.",
      "Server-rendered pages cached at edge with s-maxage and stale-while-revalidate, keyed carefully so you do not cache a logged-in user's page for everyone.",
      "Vary on the headers that actually change the response, and never on cookies you do not need, or your hit rate collapses."] },
    { d:3, q:"How do you handle API versioning without breaking deployed clients?", a:[
      "Web clients can be forced to refresh; mobile clients cannot, so the API must support old versions for as long as old apps exist.",
      "Additive changes only: new optional fields, never renaming or removing without a version bump.",
      "Version in the path or a header, publish a deprecation window, and instrument usage per version so you know when it is actually safe to remove."] },
  ]
},
{
  id: "mobile",
  name: "Mobile & Hybrid App Delivery",
  blurb: "Asked if your resume shows Capacitor, React Native or any app release ownership. Very few candidates answer this well.",
  questions: [
    { d:1, q:"What is versionCode vs versionName on Android?", a:[
      "versionCode is an integer the system uses to decide what is an upgrade; versionName is the human string.",
      "Two builds with the same versionCode are the same version as far as the OS is concerned, so the install silently does nothing or is rejected.",
      "It must be generated in CI (commit count, build number, or a timestamp) and never hand-maintained."] },
    { d:2, q:"How do over-the-air updates work for a hybrid app, and what are the limits?", a:[
      "The web bundle is downloaded and swapped at runtime, so JS, HTML and CSS changes ship without a store review.",
      "Native changes (plugins, permissions, SDK versions, anything under the native project) require a rebuild and a store release.",
      "Store policies allow bug fixes and content updates but not changing the app's core purpose. Say you keep a hard version floor so an old shell cannot load a bundle that needs a newer native API."] },
    { d:2, q:"Why does the app work in debug but crash in release?", a:[
      "R8/ProGuard minification stripping or renaming classes accessed by reflection: Firebase, plugin registration, model classes used by JSON parsers.",
      "Fix with keep rules, and prove it by testing the release build in CI rather than only debug.",
      "Second common cause: cleartext HTTP blocked in release by the network security config, and manifest merge differences between build types."] },
    { d:2, q:"How do you distribute builds internally to a known set of users?", a:[
      "Firebase App Distribution or TestFlight for tester groups, with automatic notification on new build.",
      "For a closed enterprise audience, a signed APK hosted behind auth with an in-app update check against a manifest is legitimate; on Android the user must allow install from unknown sources.",
      "Always verify the downloaded artifact (checksum or signature) before installing, and check the signing certificate matches or the update will fail."] },
    { d:2, q:"How do you decide between an in-app update prompt and a forced update?", a:[
      "Soft prompt for normal releases, dismissible with a reminder interval.",
      "Force only when the old client is genuinely broken: an API contract removed, a security fix, or a data corruption bug.",
      "Implement with a server-side minimum supported version so you can force without shipping a new build."] },
    { d:2, q:"What does your mobile release pipeline look like?", a:[
      "Tag triggers a build; version generated from git; signing keys from the CI secret store; build the signed artifact; run instrumentation smoke tests; upload symbols for crash reporting; distribute to internal testers; promote to the store track on approval.",
      "Keep a staged rollout percentage at the store level so you can halt on a crash-rate spike."] },
    { d:3, q:"How do you debug a crash that only happens on one manufacturer's devices?", a:[
      "Vendor OS layers change behaviour: aggressive battery management killing background services, custom permission dialogs, non-standard notification and full-screen intent handling.",
      "Get the real signal first: crash reporting segmented by device and OS version, plus remote logs.",
      "Then reproduce on a device farm, and code defensively with capability checks rather than assuming the AOSP behaviour.",
      "Mention Android 14 changing full-screen intent permissions as the kind of thing that breaks only on upgrade."] },
    { d:3, q:"Your OTA updates are silently failing for some users. How do you find out?", a:[
      "The core problem is that a silent failure has no telemetry. Add it: report the installed bundle version on every app launch to your backend.",
      "Then you can see the distribution of versions in the field and detect users stuck on an old bundle instead of guessing.",
      "Add a fallback: if the update mechanism fails N times, surface a manual update path rather than failing quietly.",
      "This is the kind of answer that lands well because it starts with observability rather than a fix."] },
    { d:3, q:"How do you handle push notifications reliably?", a:[
      "Token registration on launch and refresh, stored server-side per device with a user mapping, and cleaned up on logout or unregister errors.",
      "Delivery is best effort, so anything critical needs an in-app fetch on open as a backstop.",
      "Debug path: is the token valid, did the provider accept it, did the OS deliver it, did the app handle it in each of foreground, background and killed state. Those three states behave differently and that is where bugs live."] },
    { d:3, q:"How do you roll back a mobile release?", a:[
      "You mostly cannot. The store rollout can be halted, and a previous build can be re-promoted on some tracks, but users who already updated stay updated.",
      "Hence: staged rollout, feature flags so behaviour can be turned off server-side without a release, and a kill switch for risky features.",
      "For OTA bundles you can and should be able to roll back the bundle pointer instantly. Say that this is the main operational reason to run OTA at all."] },
  ]
},
{
  id: "db",
  name: "Databases in Production",
  blurb: "The place most deploy incidents actually originate. Expect at least two of these in any backend round.",
  questions: [
    { d:1, q:"What is an index and when does it hurt?", a:[
      "A separate sorted structure (usually B-tree) that turns a scan into a lookup for reads.",
      "Costs: every write must update every index, plus disk. Too many indexes slow down writes and waste memory.",
      "Composite index column order matters: an index on (a, b) helps queries filtering on a, or a and b, but not b alone."] },
    { d:1, q:"Explain ACID.", a:[
      "Atomicity: all or nothing. Consistency: constraints hold. Isolation: concurrent transactions do not see each other's partial work. Durability: committed means survives a crash.",
      "Follow-up will be isolation levels: read committed (Postgres default), repeatable read, serializable, and what anomalies each allows."] },
    { d:2, q:"What is an N+1 query and how do you find it?", a:[
      "One query for a list, then one per row for a relation. Looks fine on ten rows, dies on ten thousand.",
      "Fix: select_related for a join on a foreign key, prefetch_related for a second query on a many relation, or an explicit join.",
      "Find it with query logging in dev, an APM trace showing query count per request, or a middleware that fails the test if a request exceeds a query budget."] },
    { d:2, q:"How do you read an EXPLAIN plan?", a:[
      "EXPLAIN ANALYZE for real timings. Look for Seq Scan on a large table, the row estimate vs actual mismatch (bad statistics), and where the time is actually spent.",
      "Nested loop over a large outer set is usually the smell. Sort spilling to disk means work_mem is too low.",
      "Then check whether an index exists and whether the query is written so it can be used (functions on the column, leading wildcard LIKE, and type mismatches all prevent index use)."] },
    { d:2, q:"How do connection pools work and why do they break under scale?", a:[
      "Each Postgres connection is a backend process with real memory cost, so a few hundred is the practical ceiling.",
      "Every app instance keeping its own pool multiplies: 20 pods times 20 connections is 400.",
      "Serverless makes it worse since every invocation may want a connection. Answer: pgbouncer or RDS Proxy in transaction pooling mode, and know that transaction pooling breaks session-level features like prepared statements and advisory locks."] },
    { d:2, q:"How do you add a column to a 50 million row table without downtime?", a:[
      "Adding a nullable column with no default is metadata-only and instant on modern Postgres. Adding NOT NULL with a default used to rewrite the table; know your version's behaviour.",
      "Backfill in batches with a sleep between, not one big UPDATE that holds locks and blows up WAL.",
      "Create indexes CONCURRENTLY so writes are not blocked. Set a lock_timeout so a migration that cannot get the lock fails fast instead of queueing every query behind it.",
      "That last point about lock queueing is what separates a real answer from a textbook one."] },
    { d:2, q:"Replication: what is a read replica and what does it cost you?", a:[
      "Async streaming replication gives you read scaling and a failover candidate.",
      "Cost is replication lag, so a read right after a write may not see it. Route reads that must be fresh to the primary, or use a read-your-writes strategy.",
      "Failover is not free either: promotion takes time and you need connection handling that survives it."] },
    { d:2, q:"Caching: what would you cache and how do you invalidate it?", a:[
      "Cache expensive reads with a low change rate. Cache-aside is the default: read cache, miss goes to DB and populates.",
      "Invalidation options: TTL (simple, allows staleness), explicit delete on write (correct, easy to miss a path), or versioned keys (change the key, never delete).",
      "Talk about the stampede: when a hot key expires, every request hits the DB. Mitigate with a lock or early probabilistic refresh."] },
    { d:2, q:"SQL vs NoSQL. Pick one for a lending or transactions system and defend it.", a:[
      "Relational, clearly. Money needs transactions, constraints, joins for reporting, and a schema someone can audit.",
      "NoSQL earns its place for high-volume append-only event data, flexible documents, or key-value at scale.",
      "The strongest answer names the access pattern first and picks the store second, and notes Postgres JSONB covers a lot of the document use case without a second database."] },
    { d:3, q:"How do you handle a long-running transaction that is blocking everything?", a:[
      "Find it: pg_stat_activity for state and query start, pg_locks for the blocking chain, then pg_terminate_backend if it must go.",
      "Root causes: a transaction left open by application code, a migration taking a strong lock, or an idle-in-transaction connection from a bug in error handling.",
      "Prevent with statement_timeout, idle_in_transaction_session_timeout, and keeping transactions short and free of external HTTP calls."] },
    { d:3, q:"How would you do a zero-downtime schema change that renames a column?", a:[
      "Never rename in place. Add the new column, write to both, backfill, switch reads, stop writing the old, drop it in a later release.",
      "Each step is independently deployable and independently rollback-able, which is the whole point.",
      "Say the tell: if a deploy can only go forward, the migration design is wrong."] },
    { d:3, q:"Design a backup strategy for a production database.", a:[
      "Automated daily snapshots plus continuous WAL archiving for point-in-time recovery; that combination is what gives you a small RPO.",
      "Retention tiered by age, stored in a different account or region so a compromised account cannot delete them.",
      "Test restores on a schedule and record the actual restore time, because that number is your real RTO, not the one in the doc.",
      "Also: backups contain PII, so they need encryption and the same access controls as prod."] },
  ]
},
{
  id: "obs",
  name: "Observability & Incidents",
  blurb: "This is the section that makes you sound senior. Most candidates say monitoring and stop.",
  questions: [
    { d:1, q:"Logs vs metrics vs traces.", a:[
      "Logs: discrete events with detail, high cardinality, expensive at volume. Metrics: cheap aggregated numbers over time, good for alerting and dashboards. Traces: one request's path across services with timing per span.",
      "Rule of thumb: metrics tell you something is wrong, traces tell you where, logs tell you why."] },
    { d:1, q:"What is structured logging and why bother?", a:[
      "Log JSON with consistent fields (request id, user id, service, level) instead of free-text strings.",
      "Makes logs queryable and aggregatable. Free text means grep and regex forever.",
      "Include a correlation ID propagated across services so one user action can be reconstructed."] },
    { d:2, q:"What are the four golden signals?", a:[
      "Latency, traffic, errors, saturation. RED for services: rate, errors, duration. USE for resources: utilisation, saturation, errors.",
      "Use them as a structure when answering any what would you monitor question; it instantly sounds organised."] },
    { d:2, q:"Why do you alert on p95 or p99 rather than average latency?", a:[
      "The average hides the tail. If 1 percent of requests take 10 seconds, the mean barely moves but a real slice of users is having a bad time.",
      "At scale that 1 percent is your heaviest users, since more requests per session means more chance of hitting the tail.",
      "Alert on user-visible symptoms (error rate, latency), not on causes (CPU), or you page people for things nobody noticed."] },
    { d:2, q:"What makes a good alert?", a:[
      "Actionable, urgent, and tied to user impact. If there is no action, it is a dashboard, not a page.",
      "Every alert needs an owner and a runbook link. Alerts that fire and get ignored are worse than no alerts because they train people to ignore the pager.",
      "Use burn-rate alerting on an SLO rather than static thresholds so you page on a trajectory, not a blip."] },
    { d:2, q:"Explain SLI, SLO and error budget.", a:[
      "SLI is the measurement (percentage of requests under 300 ms). SLO is the target (99.5 percent over 30 days). Error budget is the allowed failure, so 0.5 percent.",
      "The useful part is the policy: if the budget is burnt, feature work pauses in favour of reliability. It turns reliability into a shared decision rather than an argument.",
      "SLA is the contractual version with penalties, and should always be looser than your SLO."] },
    { d:2, q:"How do you debug a latency spike with no obvious errors?", a:[
      "Scope it first: all endpoints or one, all users or one tenant, started at a deploy or gradually.",
      "Then follow the trace waterfall to the slow span. Usual suspects: a query that lost its index plan, a slow external dependency, connection pool saturation, GC or CPU throttling, a cache hit rate collapse, or a noisy neighbour on shared infrastructure.",
      "Correlate with the deploy timeline first, because that answers it more often than anything else."] },
    { d:2, q:"What is distributed tracing and what do you need for it to work?", a:[
      "Each request gets a trace ID; every hop creates a span with parent linkage. Context must be propagated in headers through every service and every async boundary.",
      "OpenTelemetry is the vendor-neutral standard. Sampling is necessary at volume; tail-based sampling keeps the interesting (slow or errored) traces rather than a random slice.",
      "The hard part is always propagation through queues and background jobs."] },
    { d:2, q:"How do you handle log volume and cost?", a:[
      "Log levels used properly, sampling for high-volume success paths, keeping full fidelity for errors.",
      "Short hot retention with searchable index, long cold retention in object storage.",
      "Do not log PII or secrets; scrub at the emitter, not at the collector, because the collector is already a copy."] },
    { d:3, q:"Walk me through how you would run an incident.", a:[
      "Declare it and assign roles: incident commander, comms, and operators. One person decides, everyone else reports.",
      "Mitigate before diagnosing. Roll back, feature flag off, scale up, shed load. Understanding can wait; users cannot.",
      "Keep a timeline in the channel as you go, because you will not remember it later.",
      "Then a blameless postmortem with contributing factors, timeline, and action items with owners and dates. Blameless because if people fear the review they hide information and you learn nothing."] },
    { d:3, q:"Tell me about a time an alert did not fire when it should have.", a:[
      "This is really about gaps: monitoring the service but not the queue that feeds it, or checking the process is up but not that it is doing work.",
      "Answer with the fix pattern: add a heartbeat or dead-man's-switch alert for things that should happen regularly, and alert on the absence of expected events, not only on errors.",
      "Concrete example: a cron job that silently stopped running produces no errors at all, so you monitor the last successful run timestamp."] },
    { d:3, q:"How would you add observability to a system that has none?", a:[
      "Start with the user-facing edge: request rate, error rate, latency at the load balancer. That gives you a symptom-level signal in an afternoon.",
      "Then structured logs with a correlation ID, then errors to a tracker with release tagging, then traces on the slowest paths.",
      "Define two or three SLOs so there is a shared definition of healthy, then build alerts from those.",
      "State the order explicitly: symptoms first, causes second. Most people do it backwards."] },
    { d:3, q:"What is a runbook and what belongs in one?", a:[
      "Per-alert doc: what the alert means, user impact, the first three things to check, known causes with fixes, escalation path, and how to verify recovery.",
      "Written by whoever built the alert, updated after every incident that used it.",
      "The test: could someone who has never touched this service act on it at 3am."] },
    { d:3, q:"How do you avoid alert fatigue on a small team?", a:[
      "Page only on user impact; everything else goes to a ticket or a dashboard.",
      "Group related alerts so one failure is one page, add inhibition so a downstream alert is suppressed when the upstream is already firing.",
      "Review the pager weekly: what fired, was it actionable, was it fixed. Delete or tune anything that keeps firing without action."] },
  ]
},
{
  id: "sec",
  name: "Security & Secrets",
  blurb: "In fintech this gets weighted heavily. You are expected to have opinions here, not just awareness.",
  questions: [
    { d:1, q:"How do you store passwords?", a:[
      "Hash with bcrypt, scrypt or argon2, with a per-user salt, tuned so it is deliberately slow.",
      "Never MD5 or SHA-256 alone; they are fast, which is exactly wrong for passwords.",
      "Say what you never do: store plaintext, log the password, or return it in any API response."] },
    { d:1, q:"What is the difference between authentication and authorization?", a:[
      "Authentication is who you are; authorization is what you may do.",
      "Most real breaches are authorization failures: a valid user accessing another tenant's record because the query filtered by ID but not by owner. That is IDOR and it is the number one API vulnerability."] },
    { d:2, q:"JWT vs session cookies. Which and why?", a:[
      "Sessions: server-side state, instantly revocable, simple. Needs a shared store across instances.",
      "JWT: stateless, verifiable without a lookup, good across services. But you cannot revoke it before expiry, which matters for logout, role change and compromise.",
      "Common resolution: short-lived access token plus a refresh token that is stored server-side and revocable.",
      "Storage: httpOnly, Secure, SameSite cookie. localStorage is readable by any XSS."] },
    { d:2, q:"How do you manage secrets across environments?", a:[
      "A secret manager (Vault, AWS Secrets Manager, GCP Secret Manager) as the source of truth, injected at runtime, never in the repo or the image.",
      "Rotation on a schedule and on any suspected exposure, with the application able to pick up a new value without a redeploy where possible.",
      "Audit log on access. Separate secrets per environment so a staging leak is not a prod incident."] },
    { d:2, q:"Explain XSS, CSRF and SQL injection and the fix for each.", a:[
      "XSS: attacker JS runs in your page. Fix with output encoding, never dangerouslySetInnerHTML on untrusted input, and CSP.",
      "CSRF: the browser sends cookies on a cross-site request. Fix with SameSite cookies and an anti-CSRF token. Note token-in-header auth is not vulnerable in the same way.",
      "SQLi: untrusted input concatenated into a query. Fix with parameterised queries or the ORM, and never string-format SQL, including in raw queries and ORDER BY clauses."] },
    { d:2, q:"What is the principle of least privilege in practice?", a:[
      "Every identity, human or machine, gets only what it needs, scoped to specific resources, and only for as long as needed.",
      "Concretely: no wildcard IAM policies, per-service database users with limited grants, read-only credentials for analytics, and short-lived credentials over static keys.",
      "Also applies to CI: a deploy pipeline should not have admin on the whole account."] },
    { d:2, q:"What would you check in a security review of an API?", a:[
      "Authentication on every endpoint including the ones added last week. Object-level authorization on every fetch by ID.",
      "Rate limiting, input validation, output filtering so you do not leak internal fields, mass assignment protection.",
      "TLS everywhere, no secrets in URLs or logs, error messages that do not leak stack traces, and CORS not set to a wildcard with credentials."] },
    { d:2, q:"How do you handle dependency vulnerabilities?", a:[
      "Automated scanning (Dependabot, Snyk, npm audit, pip-audit) with a policy: criticals in days, highs in a sprint, and a documented exception when there is no exploitable path.",
      "Lockfiles committed so builds are reproducible, and regular scheduled upgrades so you are never twelve majors behind.",
      "Note that severity scores are context-free: a vulnerability in a dev dependency that never runs in production is not the same as one in your request path."] },
    { d:3, q:"How do you secure a CI/CD pipeline?", a:[
      "The pipeline has production access, so it is a high-value target. Scope credentials per environment with OIDC and no long-lived keys.",
      "Pin actions and images by SHA, not by a moving tag, because a compromised upstream tag is a supply chain attack.",
      "Never run untrusted fork PR code with access to secrets, require approvals for prod, and keep an audit log of deploys."] },
    { d:3, q:"What does encryption at rest and in transit actually mean, and what does it not protect against?", a:[
      "In transit: TLS between every hop, including internal service to service and app to database.",
      "At rest: disk or volume encryption plus field-level encryption for sensitive columns.",
      "The honest part: at-rest encryption protects against stolen disks and snapshot leakage. It does nothing against a compromised application that is authorised to read the data, which is the far more likely attack. Field-level encryption and tokenisation are what narrow that."] },
    { d:3, q:"How would you approach compliance requirements like PCI or data localisation?", a:[
      "Reduce scope first: do not store card data, use a tokenising payment provider, so most of the standard no longer applies to your systems.",
      "Then the controls that remain: access logging, retention policies, encryption, separation of duties, and evidence that they are enforced rather than documented.",
      "Data localisation means region-pinned storage and being able to prove where backups and logs live too, which is the part people forget."] },
    { d:3, q:"An engineer left the company. What do you do?", a:[
      "Revoke SSO and MFA first since that gates most things, then anything outside SSO: personal access tokens, SSH keys, API keys they created, cloud CLI credentials, third-party tool logins.",
      "Rotate any shared secret they had access to, because access and knowledge are different things.",
      "The systemic answer: if offboarding requires a checklist of twenty places, the problem is that access was not centralised through SSO and short-lived credentials in the first place."] },
  ]
},
{
  id: "sysdesign",
  name: "Backend System Design",
  blurb: "At 2+ YOE you get scoped design, not Design Twitter. Show structure, name trade-offs, and ask about scale before drawing.",
  questions: [
    { d:1, q:"How do you structure a system design answer?", a:[
      "Clarify requirements and scale first: users, read/write ratio, latency target, consistency needs. Never start drawing.",
      "Then: API contract, data model, high-level components, then the deep dive the interviewer cares about, then bottlenecks and how you scale each one.",
      "Say the numbers out loud. 100 requests per second is a laptop; 100k is a different architecture. Sizing early stops you from over-engineering."] },
    { d:1, q:"Vertical vs horizontal scaling.", a:[
      "Vertical: bigger machine. Simple, no code change, hard ceiling, single point of failure.",
      "Horizontal: more machines. Needs statelessness, a load balancer and shared state externalised.",
      "Practical answer: vertical is underrated and often the correct first move; horizontal is what you need for availability, not just throughput."] },
    { d:2, q:"What makes a service stateless and why does it matter?", a:[
      "No request depends on in-memory state from a previous request on that instance. Sessions in Redis, uploads in object storage, no local scheduler.",
      "It matters because any instance can serve any request, so you can scale, restart and deploy freely.",
      "The usual violations: in-memory caches that must be consistent, local cron jobs, and websocket connections."] },
    { d:2, q:"When would you introduce a message queue?", a:[
      "To decouple a slow or unreliable operation from the request path: emails, PDF generation, third-party calls, webhooks, heavy computation.",
      "Also for buffering spikes and for fan-out to multiple consumers.",
      "Trade-off: the operation becomes async, so you need job status, retries with backoff, idempotency, and a dead letter queue. The user experience must handle not-yet-done."] },
    { d:2, q:"Design a rate limiter for an API.", a:[
      "Distributed counter in Redis keyed by user or API key, sliding window or token bucket.",
      "Atomicity matters: use INCR with expiry or a Lua script, not read-modify-write.",
      "Return 429 with Retry-After and X-RateLimit headers. Decide fail-open vs fail-closed if Redis is down and justify it: for an API gateway, fail-open usually beats an outage."] },
    { d:2, q:"Design a file upload feature that scales.", a:[
      "Presigned URL so the client uploads directly to object storage; the file never touches your app servers.",
      "Backend issues the URL with constraints (size, content type, expiry), then the storage event triggers processing (virus scan, thumbnail, metadata extraction) via a queue.",
      "Serve back through a CDN with signed URLs if the content is private."] },
    { d:2, q:"How would you design a notification system?", a:[
      "Producers emit events; a notification service resolves recipients, checks preferences and quiet hours, renders per channel (push, email, SMS, in-app), and enqueues per channel.",
      "Deduplicate and batch so a busy hour does not send forty pushes. Idempotency key so a retried event does not double-send.",
      "Track delivery status per channel and fall back across channels for critical messages."] },
    { d:2, q:"Design an audit log for a financial application.", a:[
      "Append-only, immutable, with actor, action, entity, before and after state, timestamp, request ID and source IP.",
      "Write it in the same transaction as the change so it cannot drift, or capture it from the database change stream so nothing can bypass it.",
      "Retention and access control matter: auditors read it, engineers do not delete it. Partition by time so it stays queryable as it grows."] },
    { d:2, q:"How do you make an operation idempotent?", a:[
      "Client sends an idempotency key; the server stores the key with the result and returns the stored result on a retry rather than re-executing.",
      "Needed anywhere a retry could double-charge or double-create: payments, webhooks, queue consumers, and any client with automatic retries.",
      "Watch the race: two concurrent requests with the same key need a unique constraint or a lock, not a check-then-insert."] },
    { d:3, q:"Design a job scheduler that runs tasks reliably.", a:[
      "Persist jobs with state, next run time and attempt count. Workers claim with SELECT FOR UPDATE SKIP LOCKED or an equivalent so two workers cannot take the same job.",
      "At-least-once delivery is the realistic guarantee, so consumers must be idempotent. Exponential backoff on failure and a dead letter queue after N attempts.",
      "Handle the worker that dies mid-job with a visibility timeout or heartbeat lease, otherwise the job is stuck forever.",
      "For cron-style jobs, a distributed lock so only one instance fires the schedule."] },
    { d:3, q:"Design the deployment architecture for a multi-tenant B2B application.", a:[
      "Decide the isolation model first: shared schema with a tenant column (cheapest, needs bulletproof query filtering), schema per tenant, or database per tenant (strongest isolation, operationally heavy at scale).",
      "For B2B fintech, per-tenant database or schema is often justified by compliance and noisy-neighbour concerns; state that the migration story is the hard part.",
      "Add per-tenant rate limits and quotas so one customer's batch job cannot degrade everyone.",
      "Deployment: same artifact, tenant config resolved at runtime, and a rollout order that lets you canary on a low-risk tenant."] },
    { d:3, q:"How would you design a system to handle 10x traffic next month?", a:[
      "Find the actual bottleneck before scaling anything. Load-test to failure and see what breaks first; it is usually the database, not the app.",
      "Then in order: caching for read amplification, read replicas, queue the writes that do not need to be synchronous, and horizontal scaling for stateless tiers.",
      "Add backpressure and graceful degradation: shed non-essential work and serve stale data rather than falling over.",
      "Say explicitly what you would not do: sharding or a rewrite is a last resort, not a first move."] },
    { d:3, q:"Monolith vs microservices for a team of eight engineers.", a:[
      "Modular monolith, and be willing to defend it. Microservices buy independent deployment and scaling at the cost of network failure modes, distributed transactions, and per-service operational overhead.",
      "Eight engineers cannot staff ten services. Conway's law works against you.",
      "Extract a service when there is a real reason: different scaling profile, different language, a compliance boundary, or a team boundary that genuinely exists."] },
    { d:3, q:"How do you handle a third-party API that is slow or unreliable?", a:[
      "Timeouts on everything, always. A missing timeout is how one slow dependency takes down your whole service.",
      "Retries with exponential backoff and jitter, but only on idempotent operations, and with a cap so you do not amplify their outage.",
      "Circuit breaker so you stop calling a dead dependency and fail fast, with a fallback: cached response, queued for later, or a degraded feature.",
      "Bulkhead the thread or connection pool so that integration cannot exhaust resources needed by the rest of the app."] },
    { d:3, q:"What is eventual consistency and where would you accept it?", a:[
      "Replicas converge over time, so a read may be stale. CAP forces the choice when the network partitions.",
      "Accept it for feeds, analytics, search indexes, counters and notifications.",
      "Refuse it for balances, ledgers and anything where a stale read leads to a wrong money decision. Being able to draw that line is the answer they want in fintech."] },
    { d:3, q:"Design the release process for a system where a bad deploy costs real money.", a:[
      "Multiple gates: automated tests, staging with production-shaped data, mandatory review, and deploy windows that avoid peak financial hours.",
      "Canary with automatic rollback on error-rate or business-metric regression, not just technical metrics. A deploy that keeps 200s but stops creating loans is still an outage.",
      "Feature flags so release is decoupled from deploy, a documented rollback path tested in advance, and a change log that operations can read.",
      "Name the business metric you would watch. That is what makes this answer sound like someone who works in fintech."] },
  ]
},
{
  id: "scenario",
  name: "Live Debugging Scenarios",
  blurb: "Open-ended, no clean answer. They are scoring your method, not your conclusion. Narrate your reasoning out loud.",
  questions: [
    { d:2, q:"The site is down. What do you do in the first five minutes?", a:[
      "Confirm the scope: is it everyone or one user, all endpoints or one, from all regions. Check the status page of your cloud and key dependencies.",
      "Check the deploy timeline. If something shipped in the last hour, roll back first and investigate after.",
      "Look at the edge metrics: error rate, latency, traffic volume. A traffic drop to zero is a different problem from a 500 spike.",
      "Communicate early even with no answer. Silence is the thing people actually complain about afterwards."] },
    { d:2, q:"CPU is at 100 percent on one instance but not the others. What now?", a:[
      "Take it out of the load balancer rather than restarting, so you keep the evidence.",
      "Profile it: which thread or process, a flame graph if you can get one, check for a runaway loop, a regex backtracking, or GC thrashing.",
      "Ask why only one: sticky sessions sending a heavy user there, a stuck background job that only one instance picked up, or a leader-election role."] },
    { d:2, q:"Memory grows steadily and the pod restarts every six hours. Diagnose.", a:[
      "Classic leak signature. Confirm with a memory graph: sawtooth is normal GC, a rising floor is a leak.",
      "Common causes: an unbounded in-memory cache or list, event listeners never removed, connections not closed, or a logger buffering.",
      "Get a heap snapshot at two points and diff by object type. In the meantime raise the limit as a stopgap and be honest that it is a stopgap."] },
    { d:2, q:"A background job queue is backing up. Walk me through it.", a:[
      "Is production up or consumption down? Check enqueue rate versus processing rate.",
      "If consumption dropped: workers crashed, stuck on a poison message, blocked on a slow dependency, or lost their database connections.",
      "If production spiked: an upstream retry storm, a batch import, or a bug enqueuing duplicates.",
      "Mitigation: scale workers, move the poison message to the dead letter queue, and if the backlog is stale data, consider draining it rather than processing it."] },
    { d:2, q:"Users report intermittent 401s despite being logged in.", a:[
      "Check whether it correlates with an instance: a signing key mismatch across instances after a rotation, or one instance with a stale config.",
      "Check clock skew, since JWT expiry validation fails on a drifted clock.",
      "Check the refresh flow for a race: two concurrent refreshes where one invalidates the other's token.",
      "Check the cookie attributes: SameSite or domain changes break auth for a subset of navigation paths."] },
    { d:2, q:"The staging environment works but production fails immediately after deploy.", a:[
      "Diff the environments: env vars, secrets, versions, network egress rules, database schema state, and scale.",
      "Most common: a missing environment variable or secret in prod, a migration that has not run, or an external allowlist that includes staging IPs but not prod.",
      "Root cause is usually that staging is not actually prod-shaped, and that is the real thing to fix."] },
    { d:2, q:"Response times doubled but nothing was deployed.", a:[
      "Things that change without a deploy: data volume crossing a threshold so a query plan flips, a cache expiring, a dependency degrading, traffic pattern change, a certificate or credential nearing expiry, or infrastructure maintenance.",
      "Check the slow query log and compare a plan now versus a known-good baseline.",
      "Also check whether anyone changed config, a feature flag, or a third-party setting. Config is a deploy that nobody logs."] },
    { d:3, q:"A single customer reports failures nobody else has. How do you investigate?", a:[
      "Get identifiers: user ID, tenant, timestamps, request IDs. Without those you are guessing.",
      "Query logs filtered to that tenant. Look for data-shape differences: a much larger dataset, unusual characters, a legacy record missing a field, or a timezone.",
      "Check tenant-specific config and feature flags.",
      "Say the general principle: single-tenant bugs are almost always data-dependent, so reproduce with their data shape rather than a fresh test account."] },
    { d:3, q:"Your deploy succeeded but the new code is not live.", a:[
      "Check what is actually running: image digest on the running pods versus the one you built, or the bundle hash being served.",
      "Candidates: a moving tag that was not re-pulled (imagePullPolicy), a CDN or proxy serving cached assets, a rollout that failed readiness and was rolled back automatically, a GitOps sync that has not run, or you deployed to the wrong environment.",
      "The lesson to state: deploy verification should be automatic, and version should be exposed on a health endpoint so this takes ten seconds to answer."] },
    { d:3, q:"Error rate rose to 2 percent and stayed there. Nobody can reproduce it.", a:[
      "Segment the 2 percent. By endpoint, client version, region, device, tenant, and time of day. A flat 2 percent across everything is a different problem from 100 percent of one client version.",
      "Check whether it started at a deploy, an infrastructure change, or a mobile release rolling out (which explains why nobody internal reproduces it).",
      "Look at the actual error payloads rather than the count. Two percent often turns out to be one specific failure mode you can then reproduce deliberately."] },
    { d:3, q:"You are on call, it is 3am, and you do not understand the failing service.", a:[
      "Mitigate without understanding: roll back, disable the feature flag, scale up, fail over. That is legitimate and expected.",
      "Use the runbook and the dashboards, and escalate early. Escalating at 3am is not a failure; sitting alone for two hours is.",
      "Document what you did so the owner can pick it up, and file the gap: the missing runbook is itself an action item.",
      "This question is testing judgement and ego, not knowledge. Answer accordingly."] },
    { d:3, q:"A migration is running on prod and it is taking far longer than expected.", a:[
      "First: is it blocking? Check for lock waits. A slow migration is bad; a slow migration holding an exclusive lock is an outage.",
      "Decide kill or wait. Killing mid-migration must be safe, which means the migration should have been written to be resumable and batched.",
      "If it is blocking, terminate it, let queries drain, and rerun it in batches off the deploy path.",
      "Prevention: test migrations against a production-sized dataset copy, set lock_timeout, and never run a heavy migration inside the deploy step."] },
    { d:3, q:"Costs jumped 40 percent this month with no traffic change.", a:[
      "Break down by service and by tag to localise it. Usual culprits: a runaway autoscaler, a log or metric volume explosion, cross-AZ or NAT data transfer, orphaned resources from a failed teardown, or a retry loop hammering a paid API.",
      "Check for a loop: a job that retries forever generates both cost and load without any user-visible error.",
      "Fix and then add the guardrail: budget alerts, anomaly detection, and resource tagging enforced at creation."] },
    { d:3, q:"Two services disagree about the state of the same record.", a:[
      "Establish which is the source of truth. If the answer is unclear, that is the actual bug.",
      "Causes: dual writes without a transaction, an event consumed out of order, a failed event with no retry, or a cache that was never invalidated.",
      "Fix pattern: single writer with events derived from the write (outbox pattern or change data capture), consumers idempotent and order-tolerant, and a reconciliation job that detects and reports drift rather than assuming it never happens."] },
  ]
},
{
  id: "behavioral",
  name: "Behavioural & Ownership",
  blurb: "Prepare two or three real stories from your own work and reuse them. Vague answers here sink otherwise strong candidates.",
  questions: [
    { d:1, q:"Tell me about a production incident you caused or fixed.", a:[
      "Structure: situation, what broke and its user impact, what you did to mitigate, what the root cause was, what you changed so it cannot recur.",
      "Own it plainly if you caused it. Interviewers trust candidates who say I shipped this without a migration guard more than candidates who blame a process.",
      "The strongest ending is a systemic fix, not just I was more careful afterwards."] },
    { d:2, q:"Tell me about a technical decision you made that you would make differently now.", a:[
      "Pick something real with a genuine trade-off, not a fake weakness.",
      "Explain the constraints at the time, why the choice was reasonable then, what evidence changed your view, and what you would do instead.",
      "This tests whether you can update your beliefs, which is the actual signal."] },
    { d:2, q:"How do you handle disagreement with a senior engineer on an architecture choice?", a:[
      "Establish the shared goal first, then argue about evidence rather than preference: write down the trade-offs, prototype if the disagreement is empirical, define what would change your mind.",
      "Disagree and commit is a legitimate ending. Say you would document the concern so it can be revisited with data.",
      "Avoid framing it as winning."] },
    { d:2, q:"Describe a time you improved a process rather than fixing a bug.", a:[
      "Pipeline speed, flaky test elimination, a runbook, an onboarding doc, automating a manual release step, adding observability where there was none.",
      "Quantify it: minutes saved per deploy times deploys per week, or incidents avoided.",
      "This question separates people who do tickets from people who own systems."] },
    { d:2, q:"How do you prioritise when everything is urgent?", a:[
      "Impact and reversibility. What is user-facing, what is losing money, what blocks other people, what is a one-way door.",
      "Say you make the trade-off visible rather than silently dropping work: if A ships this week, B slips, and here is the risk.",
      "Interviewers are checking whether you communicate the trade-off or quietly burn out."] },
    { d:2, q:"Tell me about a time you had to learn something quickly.", a:[
      "Pick something concrete and technical, ideally adjacent to the role you are interviewing for.",
      "Describe the method, not just the outcome: read the source, built a minimal reproduction, asked a specific person a specific question, shipped something small first.",
      "End with what you can now do that you could not before."] },
    { d:2, q:"Why are you leaving your current role?", a:[
      "Frame forward, not backward: what you want to do more of, what scope you are ready for.",
      "Do not criticise your employer, but do not be evasive either. Wanting more ownership, more scale, or a different domain are all fine and honest answers.",
      "Have a coherent story that connects your last role, this role, and where you want to be."] },
    { d:3, q:"What would you improve in the first 90 days if we hired you?", a:[
      "Answer with a method, since you do not know their systems: first weeks understanding the deploy path, the on-call load, and where time is lost. Then pick the highest-leverage thing.",
      "Name what you would look for: deploy frequency, lead time, change failure rate, time to restore. Those four DORA metrics give you a vocabulary that lands well.",
      "Say you would ship something small early to build trust before proposing anything structural."] },
    { d:3, q:"How do you make sure the code you ship is actually correct?", a:[
      "Tests at the level where they pay off: unit for logic, integration for the seams, a small e2e set for critical paths. Say you do not chase coverage numbers.",
      "Plus everything around the code: review, staging verification, feature flags, canary, monitoring on the specific thing you changed, and a rollback plan written before the deploy.",
      "The senior framing: correctness is a property of the whole delivery system, not just the diff."] },
    { d:3, q:"Do you have any questions for us?", a:[
      "Always yes, and make them specific: how often do you deploy, who is on call and how noisy is it, what does the rollback path look like, how are incidents reviewed, what does the test suite runtime look like.",
      "Also: what does success in this role look like in six months, and what is the biggest source of engineering frustration right now.",
      "These questions signal that you have operated real systems, and they also tell you whether you actually want the job."] },
  ]
},
];

/* ============================================================
   DERIVED INDEX
   ============================================================ */

const ALL = [];
DATA.forEach((cat) => {
  cat.questions.forEach((q, i) => {
    ALL.push({ ...q, id: cat.id + "-" + i, cat: cat.id, catName: cat.name });
  });
});

const STATUSES = {
  unseen:   { label: "Not started", dot: "bg-zinc-600",    text: "text-zinc-500",   ring: "border-zinc-800" },
  read:     { label: "Read",        dot: "bg-sky-400",     text: "text-sky-300",    ring: "border-sky-900" },
  revise:   { label: "Revise",      dot: "bg-amber-400",   text: "text-amber-300",  ring: "border-amber-900" },
  mastered: { label: "Mastered",    dot: "bg-emerald-400", text: "text-emerald-300",ring: "border-emerald-900" },
};

const DIFF = {
  1: { label: "basic", cls: "text-zinc-400 border-zinc-700" },
  2: { label: "core",  cls: "text-sky-300 border-sky-800" },
  3: { label: "hard",  cls: "text-rose-300 border-rose-900" },
};

const STORAGE_KEY = "sde-devops-qbank-v1";

/* ============================================================
   APP
   ============================================================ */

export default function QuestionBank() {
  const [status, setStatus] = useState({});
  const [open, setOpen] = useState({});
  const [cat, setCat] = useState("all");
  const [diffFilter, setDiffFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [drill, setDrill] = useState(null);
  const [drillRevealed, setDrillRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const firstLoad = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) setStatus(JSON.parse(r.value));
      } catch (e) {
        // no saved progress yet
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = false; return; }
    if (loading) return;
    setSaveState("saving");
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(status));
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch (e) {
        setSaveState("error");
      }
    })();
  }, [status, loading]);

  const st = (id) => status[id] || "unseen";
  const mark = (id, s) => setStatus((p) => ({ ...p, [id]: p[id] === s ? "unseen" : s }));

  const counts = useMemo(() => {
    const c = { unseen: 0, read: 0, revise: 0, mastered: 0 };
    ALL.forEach((q) => { c[st(q.id)]++; });
    return c;
  }, [status]);

  const catStats = useMemo(() => {
    const m = {};
    DATA.forEach((c) => {
      const s = { total: c.questions.length, unseen: 0, read: 0, revise: 0, mastered: 0 };
      c.questions.forEach((_, i) => { s[st(c.id + "-" + i)]++; });
      m[c.id] = s;
    });
    return m;
  }, [status]);

  const visible = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return ALL.filter((q) => {
      if (cat !== "all" && q.cat !== cat) return false;
      if (diffFilter && q.d !== diffFilter) return false;
      if (statusFilter !== "all" && st(q.id) !== statusFilter) return false;
      if (ql && !(q.q.toLowerCase().includes(ql) || q.a.join(" ").toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [cat, diffFilter, statusFilter, query, status]);

  const startDrill = () => {
    const pool = visible.filter((q) => st(q.id) !== "mastered");
    const src = pool.length ? pool : visible;
    if (!src.length) return;
    setDrill(src[Math.floor(Math.random() * src.length)]);
    setDrillRevealed(false);
  };

  const pct = Math.round((counts.mastered / ALL.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="font-mono text-xs tracking-widest text-zinc-600 uppercase">Loading your progress</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* HEADER */}
        <header className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-zinc-500 mb-3">
            Interview prep · 2+ yrs · devops & deployments
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50 leading-tight">
            The question bank
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            {ALL.length} questions across {DATA.length} areas, with the answer the interviewer is
            listening for. Mark each one as you go. Progress saves automatically.
          </p>
        </header>

        {/* READINESS METER */}
        <section className="mb-8 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-4 sm:px-5 flex flex-wrap items-end gap-x-8 gap-y-4 justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-emerald-300 tabular-nums">{pct}</span>
                <span className="text-lg text-zinc-600">%</span>
                <span className="ml-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">mastered</span>
              </div>
            </div>
            <div className="flex gap-5 font-mono text-[11px]">
              {Object.entries(STATUSES).map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-center gap-1.5">
                    <span className={"w-1.5 h-1.5 rounded-full " + v.dot} />
                    <span className="text-zinc-500 uppercase tracking-wider">{v.label}</span>
                  </div>
                  <div className="mt-1 text-base text-zinc-300 tabular-nums">{counts[k]}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-1.5 w-full bg-zinc-900">
            <div className="bg-emerald-400" style={{ width: (counts.mastered / ALL.length) * 100 + "%" }} />
            <div className="bg-amber-400" style={{ width: (counts.revise / ALL.length) * 100 + "%" }} />
            <div className="bg-sky-400" style={{ width: (counts.read / ALL.length) * 100 + "%" }} />
          </div>
        </section>

        {/* CONTROLS */}
        <section className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions and answers"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={startDrill}
              className="px-4 py-2 rounded text-sm font-medium bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              Drill a random one
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>All areas</Chip>
            {DATA.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.name.split(" ")[0].replace(",", "")}{" "}
                <span className="text-zinc-600 tabular-nums">
                  {catStats[c.id].mastered}/{catStats[c.id].total}
                </span>
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip active={diffFilter === 0} onClick={() => setDiffFilter(0)}>Any level</Chip>
            {[1, 2, 3].map((d) => (
              <Chip key={d} active={diffFilter === d} onClick={() => setDiffFilter(d)}>{DIFF[d].label}</Chip>
            ))}
            <span className="w-px bg-zinc-800 mx-1.5" />
            <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Any status</Chip>
            {Object.entries(STATUSES).map(([k, v]) => (
              <Chip key={k} active={statusFilter === k} onClick={() => setStatusFilter(k)}>{v.label}</Chip>
            ))}
          </div>
        </section>

        {/* DRILL CARD */}
        {drill && (
          <section className="mb-8 border border-emerald-900 rounded-lg bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                Drill · {drill.catName} · {DIFF[drill.d].label}
              </p>
              <button onClick={() => setDrill(null)} className="text-zinc-500 hover:text-zinc-300 text-sm">
                Close
              </button>
            </div>
            <p className="text-lg text-zinc-100 leading-snug mb-4">{drill.q}</p>
            {drillRevealed ? (
              <ul className="space-y-2 mb-4">
                {drill.a.map((line, i) => (
                  <li key={i} className="text-sm text-zinc-300 leading-relaxed pl-4 border-l border-zinc-700">{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 mb-4 italic">Answer out loud first, then reveal.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {!drillRevealed && (
                <button
                  onClick={() => setDrillRevealed(true)}
                  className="px-3 py-1.5 rounded text-sm bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                >
                  Reveal answer
                </button>
              )}
              {drillRevealed && (
                <>
                  <button
                    onClick={() => { mark(drill.id, "mastered"); startDrill(); }}
                    className="px-3 py-1.5 rounded text-sm bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  >
                    Got it, next
                  </button>
                  <button
                    onClick={() => { mark(drill.id, "revise"); startDrill(); }}
                    className="px-3 py-1.5 rounded text-sm bg-amber-500 text-zinc-950 hover:bg-amber-400"
                  >
                    Needs revision, next
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* LIST */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              {visible.length} showing
            </p>
            <p className="font-mono text-[11px] text-zinc-600 h-4">
              {saveState === "saving" && "saving…"}
              {saveState === "saved" && "progress saved"}
              {saveState === "error" && "could not save progress"}
            </p>
          </div>

          {visible.length === 0 && (
            <div className="border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-sm text-zinc-400">No questions match these filters.</p>
              <button
                onClick={() => { setCat("all"); setDiffFilter(0); setStatusFilter("all"); setQuery(""); }}
                className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="space-y-2">
            {visible.map((q) => {
              const s = st(q.id);
              const isOpen = !!open[q.id];
              return (
                <article key={q.id} className={"border rounded-lg bg-zinc-900 " + STATUSES[s].ring}>
                  <div className="flex">
                    <div className={"w-1 rounded-l-lg " + STATUSES[s].dot} />
                    <div className="flex-1 min-w-0 p-4">
                      <button
                        onClick={() => setOpen((p) => ({ ...p, [q.id]: !p[q.id] }))}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={"font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded " + DIFF[q.d].cls}>
                            {DIFF[q.d].label}
                          </span>
                          {cat === "all" && (
                            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                              {q.catName}
                            </span>
                          )}
                          {s !== "unseen" && (
                            <span className={"font-mono text-[10px] uppercase tracking-wider " + STATUSES[s].text}>
                              {STATUSES[s].label}
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] text-zinc-100 leading-snug pr-4">{q.q}</p>
                      </button>

                      {isOpen && (
                        <ul className="mt-3 space-y-2">
                          {q.a.map((line, i) => (
                            <li key={i} className="text-sm text-zinc-300 leading-relaxed pl-3 border-l border-zinc-700">
                              {line}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setOpen((p) => ({ ...p, [q.id]: !p[q.id] }))}
                          className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        >
                          {isOpen ? "Hide answer" : "Show answer"}
                        </button>
                        <MarkBtn on={s === "read"} onClick={() => mark(q.id, "read")} tone="sky">Read</MarkBtn>
                        <MarkBtn on={s === "revise"} onClick={() => mark(q.id, "revise")} tone="amber">Revise</MarkBtn>
                        <MarkBtn on={s === "mastered"} onClick={() => mark(q.id, "mastered")} tone="emerald">Mastered</MarkBtn>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 pt-6 border-t border-zinc-900 flex items-center justify-between">
          <p className="font-mono text-[11px] text-zinc-600">
            Tip: filter to Revise the night before an interview.
          </p>
          <button
            onClick={() => { if (window.confirm("Clear all marks and start over?")) setStatus({}); }}
            className="text-xs text-zinc-600 hover:text-rose-400"
          >
            Reset progress
          </button>
        </footer>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded text-xs border transition-colors " +
        (active
          ? "bg-zinc-100 text-zinc-900 border-zinc-100"
          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600")
      }
    >
      {children}
    </button>
  );
}

function MarkBtn({ on, onClick, tone, children }) {
  const tones = {
    sky: on ? "bg-sky-500 text-zinc-950" : "text-sky-400 hover:bg-sky-950",
    amber: on ? "bg-amber-500 text-zinc-950" : "text-amber-400 hover:bg-amber-950",
    emerald: on ? "bg-emerald-500 text-zinc-950" : "text-emerald-400 hover:bg-emerald-950",
  };
  return (
    <button onClick={onClick} className={"px-2 py-1 rounded text-xs border border-zinc-800 " + tones[tone]}>
      {children}
    </button>
  );
}
