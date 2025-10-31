# Script to kill process on a specific port
# Usage: .\kill-port.ps1 8081

param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Finding process on port $Port..." -ForegroundColor Yellow

$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess | Select-Object -Unique
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
        Stop-Process -Id $processId -Force
        Write-Host "✓ Killed process $processId on port $Port" -ForegroundColor Green
    } else {
        Write-Host "Process not found (may have already been killed)" -ForegroundColor Yellow
    }
} else {
    Write-Host "No process found using port $Port" -ForegroundColor Green
}

# Also kill any Node processes (common for Metro)
Write-Host "`nChecking for Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node process(es)" -ForegroundColor Cyan
    $nodeProcesses | ForEach-Object {
        Write-Host "  - Killing Node process (PID: $($_.Id))"
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "✓ All Node processes killed" -ForegroundColor Green
} else {
    Write-Host "No Node processes found" -ForegroundColor Green
}


