$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$runtime = Join-Path $PSScriptRoot '.local'
$pgBin = Join-Path $runtime 'pgsql/bin'
$pgData = Join-Path $runtime 'data'
$nodeExe = Join-Path (Split-Path (Get-Command npm.cmd).Source) 'node.exe'
if (!(Test-Path $nodeExe)) { throw 'Install Node.js 22 or newer first.' }
if (!(Test-Path "$pgBin/initdb.exe")) {
  if (!(Test-Path "$runtime/postgresql.zip")) {
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    # PostgreSQL 18 Windows archive linked by EDB's official binaries page.
    Invoke-WebRequest 'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260609' -OutFile "$runtime/postgresql.zip"
  }
  Expand-Archive -LiteralPath "$runtime/postgresql.zip" -DestinationPath $runtime -Force
}
if (!(Test-Path "$pgData/PG_VERSION")) {
  if (Test-Path 'backend/.env') { throw 'Existing backend/.env found. Preserve it and configure the database manually before running setup.' }
  $password = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace('+','-').Replace('/','_')
  $passwordFile = Join-Path $runtime 'init-password.tmp'
  [IO.File]::WriteAllText($passwordFile, $password)
  try {
    & "$pgBin/initdb.exe" -D $pgData -U quietcue -A scram-sha-256 --encoding=UTF8 --locale=C "--pwfile=$passwordFile"
    if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed.' }
  } finally { Remove-Item -LiteralPath $passwordFile -Force }
  $envContent = "DATABASE_URL=postgresql://quietcue:$password@127.0.0.1:54329/quietcue`nPORT=3001`nCORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081`n"
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'backend/.env'), $envContent)
}
& "$pgBin/pg_ctl.exe" status -D $pgData *> $null
if ($LASTEXITCODE -ne 0) {
  & "$pgBin/pg_ctl.exe" start -D $pgData -l "$runtime/postgres.log" -o '-p 54329 -h 127.0.0.1' -w
  if ($LASTEXITCODE -ne 0) { throw 'Database did not start. See .local/postgres.log.' }
}
$connectionLine = Get-Content 'backend/.env' | Where-Object { $_ -like 'DATABASE_URL=*' } | Select-Object -First 1
$connection = [Uri]($connectionLine.Substring(13))
$env:PGPASSWORD = [Uri]::UnescapeDataString($connection.UserInfo.Split(':',2)[1])
try {
  $exists = & "$pgBin/psql.exe" -h 127.0.0.1 -p 54329 -U quietcue -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='quietcue'"
  if ($LASTEXITCODE -ne 0) { throw 'Could not connect to the local database.' }
  if ($exists -ne '1') {
    & "$pgBin/createdb.exe" -h 127.0.0.1 -p 54329 -U quietcue quietcue
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the QuietCue database.' }
  }
} finally { Remove-Item Env:PGPASSWORD }
Push-Location backend
try {
  if (!(Test-Path node_modules/pg)) { & npm.cmd ci --ignore-scripts; if ($LASTEXITCODE -ne 0) { throw 'Backend dependency install failed.' } }
  & $nodeExe --env-file=.env migrate.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Migration failed.' }
} finally { Pop-Location }
if (!(Test-Path 'mobile/.env')) { Copy-Item mobile/.env.example mobile/.env }
Write-Host 'Local PostgreSQL is ready on port 54329. Run start-local.ps1 to start QuietCue.'
