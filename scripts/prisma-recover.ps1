$ErrorActionPreference = 'SilentlyContinue'

# Stop node processes that often lock Prisma engine DLLs on Windows.
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'prisma|next dev|ts-node' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

$clientDir = Join-Path $PSScriptRoot "..\node_modules\.prisma\client"

# Remove stale tmp binaries that block EPERM rename during prisma generate.
Remove-Item (Join-Path $clientDir "query_engine-windows.dll.node") -Force
Remove-Item (Join-Path $clientDir "query_engine-windows.dll.node.tmp*") -Force
Remove-Item (Join-Path $clientDir "libquery_engine-windows.dll.node") -Force
Remove-Item (Join-Path $clientDir "libquery_engine-windows.dll.node.tmp*") -Force

# Remove stale duplicate SQLite DB path left by old setup if it exists.
$duplicateDb = Join-Path $PSScriptRoot "..\prisma\prisma\dev.db"
$duplicateDir = Join-Path $PSScriptRoot "..\prisma\prisma"
Remove-Item $duplicateDb -Force
Remove-Item $duplicateDir -Recurse -Force

Write-Output "Prisma lock cleanup complete."
