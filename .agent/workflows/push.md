---
description: How to push changes to GitHub
---

To push your latest changes to GitHub, simply ask the assistant:
"Run the push workflow"

The assistant will then:
1. Stage all your changes.
2. Commit them with a descriptive message.
3. Push them to the `main` branch on GitHub.

// turbo
```powershell
& "C:\Program Files\Git\cmd\git.exe" add .; & "C:\Program Files\Git\cmd\git.exe" commit -m "update from Antigravity"; & "C:\Program Files\Git\cmd\git.exe" push origin main
```
