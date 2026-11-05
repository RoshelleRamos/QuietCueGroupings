$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path '.local/data/PG_VERSION')) { throw 'Run setup-local.ps1 first.' }
$nodeExe = Join-Path (Split-Path (Get-Command npm.cmd).Source) 'node.exe'
& '.local/pgsql/bin/pg_ctl.exe' status -D '.local/data' *> $null
if ($LASTEXITCODE -ne 0) {
  & '.local/pgsql/bin/pg_ctl.exe' start -D '.local/data' -l '.local/postgres.log' -o '-p 54329 -h 127.0.0.1' -w
  if ($LASTEXITCODE -ne 0) { throw 'Database did not start.' }
}
$backend = Join-Path $PSScriptRoot 'backend'
try { $health = Invoke-RestMethod 'http://127.0.0.1:3001/health' -TimeoutSec 2 } catch { $health = $null }
if (!$health) {
  $backendProcess = Start-Process -FilePath $nodeExe -ArgumentList '--env-file=.env','server.mjs' -WorkingDirectory $backend -WindowStyle Hidden -RedirectStandardOutput '.local/backend.log' -RedirectStandardError '.local/backend-errors.log' -PassThru
  Set-Content '.local/backend.pid' $backendProcess.Id
}
Set-Location mobile
if (!(Test-Path node_modules/expo)) { & npm.cmd ci --ignore-scripts; if ($LASTEXITCODE -ne 0) { throw 'App dependency install failed.' } }
& $nodeExe node_modules/expo/bin/cli start
