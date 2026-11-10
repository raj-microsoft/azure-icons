$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    # Compare against HEAD, so an earlier local sync never consumes a publication.
    $before = 0
    $tracked = git ls-tree --name-only HEAD -- public/sketchnote-gpt/manifest.json
    if ($tracked) {
        $committed = git show HEAD:public/sketchnote-gpt/manifest.json
        if ($LASTEXITCODE -ne 0) { throw 'Cannot read committed manifest' }
        $before = ($committed | ConvertFrom-Json).count
    }
    npm run sync-gpt | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'ChatGPT sync/build failed' }
    $count = (Get-Content public/sketchnote-gpt/manifest.json -Raw | ConvertFrom-Json).count
    $pushed = $false
    if ($count -ne $before) {
        # Never sweep in the growing source, raw chats, queues or unrelated staged files.
        $paths = @('scripts/sync-gpt.mjs', 'scripts/publish-gpt.ps1', 'scripts/verify-gpt.mjs', 'package.json', 'src/main.ts', 'src/style.css', 'public/sketchnote-gpt', 'docs')
        git add -- $paths | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Git staging failed' }
        git -c user.name='Raj Balakrishnan' -c user.email='raj-microsoft@users.noreply.github.com' commit --only -m "ChatGPT sketchnotes: $count of 643" -- $paths | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Git commit failed' }
    }
    # Retry a prior successful commit whose push failed, without creating an empty commit.
    $ahead = git rev-list --count '@{upstream}..HEAD'
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect upstream' }
    if ([int]$ahead -gt 0) {
        git -c http.sslBackend=openssl -c "http.sslCAInfo=$env:NODE_EXTRA_CA_CERTS" push | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Git push failed; rerun this script to retry' }
        $pushed = $true
    }
    @{count=$count; pushed=$pushed} | ConvertTo-Json -Compress
} finally {
    Pop-Location
}
