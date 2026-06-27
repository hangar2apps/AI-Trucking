$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$OutZip = Join-Path $env:TEMP "autonomous-freight-nas.zip"

$Include = @(
    "index.html", "app.js", "styles.css", "server.js",
    "Dockerfile", "nginx.conf", "docker-compose.nas.yml", ".dockerignore",
    "deploy\nas-start.sh"
)

if (Test-Path $OutZip) { Remove-Item $OutZip -Force }

Push-Location $ProjectRoot
Compress-Archive -Path $Include -DestinationPath $OutZip -Force
Pop-Location

Write-Host "Created: $OutZip"
Write-Host ""
Write-Host "Next steps on your NAS:"
Write-Host "  1. Upload this zip via File Station / SMB share"
Write-Host "  2. Extract to a folder (e.g. docker/autonomous-freight)"
Write-Host "  3. In Container Manager, open that folder and run:"
Write-Host "     docker compose -f docker-compose.nas.yml up -d --build"
Write-Host ""
Write-Host "Or SSH/Terminal on NAS:"
Write-Host "  cd /path/to/autonomous-freight && sh deploy/nas-start.sh"
