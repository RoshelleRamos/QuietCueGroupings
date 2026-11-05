$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (Test-Path '.local/backend.pid') {
  $backendId = [int](Get-Content '.local/backend.pid')
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$backendId"
  if ($process -and $process.CommandLine -match 'server\.mjs' -and $process.Name -eq 'node.exe') {
    Stop-Process -Id $backendId
  }
  Remove-Item -LiteralPath '.local/backend.pid'
}
if (Test-Path '.local/pgsql/bin/pg_ctl.exe') {
  & '.local/pgsql/bin/pg_ctl.exe' status -D '.local/data' *> $null
  if ($LASTEXITCODE -eq 0) { & '.local/pgsql/bin/pg_ctl.exe' stop -D '.local/data' -m fast }
}
