param(
    [string]$NasHost = "192.168.1.237",
    [string]$NasUser = "admin",
    [string]$NasPath = "/volume1/docker/autonomous-freight"
)

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$Files = @(
    "index.html",
    "app.js",
    "styles.css",
    "server.js",
    "Dockerfile",
    "nginx.conf",
    "docker-compose.nas.yml",
    ".dockerignore"
)

Write-Host "Copying to ${NasUser}@${NasHost}:${NasPath} ..."
ssh "${NasUser}@${NasHost}" "mkdir -p '$NasPath/deploy'"

foreach ($file in $Files) {
    scp "$ProjectRoot\$file" "${NasUser}@${NasHost}:${NasPath}/$file"
}

scp "$ProjectRoot\deploy\nas-start.sh" "${NasUser}@${NasHost}:${NasPath}/deploy/nas-start.sh"
ssh "${NasUser}@${NasHost}" "chmod +x '$NasPath/deploy/nas-start.sh' && cd '$NasPath' && sh deploy/nas-start.sh"

Write-Host "Done. Test: http://${NasHost}:5173"
